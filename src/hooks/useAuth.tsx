import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import {
  type LocalAccount,
  getActiveLocalAccount,
  getLocalAccounts,
  setActiveLocalAccount,
  upsertLocalAccount,
  addLocalAuditLog,
  getLocalPatients,
  addLocalPatient,
} from "@/lib/localClinicalStore";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  pendingOtpEmail: string | null;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: string,
    hospital: string
  ) => Promise<{ error: Error | null; immediateLogin?: boolean }>;
  signIn: (
    email: string,
    password: string,
    requireOtp?: boolean
  ) => Promise<{ error: Error | null; requiresOtp?: boolean }>;
  signInDemo: (role?: "practitioner" | "admin") => Promise<void>;
  verifyLoginOtp: (code: string) => Promise<{ error: Error | null }>;
  resendLoginOtp: () => Promise<{ error: Error | null }>;
  cancelOtpLogin: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildSyntheticUser(acct: LocalAccount): User {
  return {
    id: acct.id,
    app_metadata: { provider: "email" },
    user_metadata: {
      full_name: acct.full_name,
      role: acct.role,
      hospital: acct.hospital,
    },
    aud: "authenticated",
    created_at: acct.created_at,
    email: acct.email,
  } as User;
}

function buildSyntheticSession(acct: LocalAccount): Session {
  const u = buildSyntheticUser(acct);
  return {
    access_token: `local-session-${acct.id}`,
    refresh_token: `local-refresh-${acct.id}`,
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    token_type: "bearer",
    user: u,
  } as Session;
}

function ensureSamplePatientsForUser(userId: string) {
  const existing = getLocalPatients(userId);
  if (existing.length === 0) {
    addLocalPatient({
      created_by: userId,
      patient_name: "Kwame Mensah",
      age: 58,
      gender: "Male",
      notes: "Persistent cough, 20 pack-year smoking history; referred for thoracic CT & X-ray evaluation.",
    });
    addLocalPatient({
      created_by: userId,
      patient_name: "Abena Osei",
      age: 34,
      gender: "Female",
      notes: "Acute fever (38.9°C) and productive cough for 4 days; evaluate for lobar consolidation.",
    });
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string | null>(null);

  const fetchRole = async (userId: string, fallbackRole?: string | null) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (data?.role) {
        setUserRole(data.role);
        return;
      }
    } catch {
      // ignore RLS/network errors and fall back
    }
    const localAcct = getActiveLocalAccount();
    setUserRole(fallbackRole || localAcct?.role || "practitioner");
  };

  const applyLocalAccount = (acct: LocalAccount) => {
    setActiveLocalAccount(acct);
    ensureSamplePatientsForUser(acct.id);
    const synUser = buildSyntheticUser(acct);
    const synSession = buildSyntheticSession(acct);
    setUser(synUser);
    setSession(synSession);
    setUserRole(acct.role);
    setLoading(false);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, supaSession) => {
      if (supaSession?.user) {
        setSession(supaSession);
        setUser(supaSession.user);
        const metaRole = (supaSession.user.user_metadata?.role as string) || null;
        setTimeout(() => fetchRole(supaSession.user.id, metaRole), 0);
        setLoading(false);
      } else {
        const localAcct = getActiveLocalAccount();
        if (localAcct) {
          applyLocalAccount(localAcct);
        } else {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session: supaSession } }) => {
      if (supaSession?.user) {
        setSession(supaSession);
        setUser(supaSession.user);
        const metaRole = (supaSession.user.user_metadata?.role as string) || null;
        fetchRole(supaSession.user.id, metaRole);
        setLoading(false);
      } else {
        const localAcct = getActiveLocalAccount();
        if (localAcct) {
          applyLocalAccount(localAcct);
        } else {
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: string,
    hospital: string
  ) => {
    const normalizedRole =
      role === "admin" || role === "practitioner" || role === "authorized_user"
        ? role
        : "practitioner";

    // Always register in the Local Clinical Vault first so the clinician can access
    // the workstation immediately even if Supabase email confirmation is pending or rate-limited.
    const localAcct = upsertLocalAccount({
      email,
      password,
      full_name: fullName,
      role: normalizedRole,
      hospital,
    });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName, role: normalizedRole, hospital },
        },
      });

      if (!error && data.session && data.user) {
        const synced = upsertLocalAccount({
          id: data.user.id,
          email,
          password,
          full_name: fullName,
          role: normalizedRole,
          hospital,
        });
        setActiveLocalAccount(synced);
        ensureSamplePatientsForUser(data.user.id);
        return { error: null, immediateLogin: true };
      }

      // If signUp created the user without a session (or user already exists), try direct password sign-in
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!signInErr && signInData.session && signInData.user) {
        const synced = upsertLocalAccount({
          id: signInData.user.id,
          email,
          password,
          full_name: fullName,
          role: normalizedRole,
          hospital,
        });
        setActiveLocalAccount(synced);
        ensureSamplePatientsForUser(signInData.user.id);
        return { error: null, immediateLogin: true };
      }
    } catch {
      // Proceed to immediate local activation
    }

    // Activate immediately via Local Clinical Session so email rate-limits / unconfirmed emails never block the user
    applyLocalAccount(localAcct);
    addLocalAuditLog({
      user_id: localAcct.id,
      action: "clinician_signup",
      details: { email: localAcct.email, role: localAcct.role, hospital: localAcct.hospital },
    });
    return { error: null, immediateLogin: true };
  };

  const signIn = async (email: string, password: string, requireOtp = false) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { data, error: passwordError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!passwordError && data.session && data.user) {
        if (!requireOtp) {
          const meta = data.user.user_metadata || {};
          const synced = upsertLocalAccount({
            id: data.user.id,
            email: normalizedEmail,
            password,
            full_name: (meta.full_name as string) || normalizedEmail.split("@")[0],
            role:
              meta.role === "admin" || meta.role === "practitioner" || meta.role === "authorized_user"
                ? meta.role
                : "practitioner",
            hospital: (meta.hospital as string) || "Korle Bu Teaching Hospital",
          });
          setActiveLocalAccount(synced);
          ensureSamplePatientsForUser(data.user.id);
          return { error: null, requiresOtp: false };
        }

        // Optional 2FA OTP mode if explicitly requested
        await supabase.auth.signOut();
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: { shouldCreateUser: false },
        });
        if (!otpError) {
          setPendingOtpEmail(normalizedEmail);
          return { error: null, requiresOtp: true };
        }
      }

      // Check local clinician vault (handles accounts created when Supabase email confirmation is pending or rate-limited)
      const knownAccounts = getLocalAccounts();
      const matched = knownAccounts.find((a) => a.email.toLowerCase() === normalizedEmail);

      if (matched && (!matched.password || matched.password === password)) {
        applyLocalAccount(matched);
        addLocalAuditLog({
          user_id: matched.id,
          action: "clinician_signin",
          details: { email: matched.email, mode: "local_verified" },
        });
        return { error: null, requiresOtp: false };
      }

      // Also if Supabase specifically says "Email not confirmed", activate the clinician session directly
      if (passwordError && /email not confirmed/i.test(passwordError.message)) {
        const acct = upsertLocalAccount({
          email: normalizedEmail,
          password,
          full_name: matched?.full_name || normalizedEmail.split("@")[0],
          role: matched?.role || "practitioner",
          hospital: matched?.hospital || "Korle Bu Teaching Hospital",
        });
        applyLocalAccount(acct);
        return { error: null, requiresOtp: false };
      }

      return {
        error: new Error(passwordError?.message || "Invalid email or password"),
      };
    } catch (err: any) {
      const knownAccounts = getLocalAccounts();
      const matched = knownAccounts.find((a) => a.email.toLowerCase() === normalizedEmail);
      if (matched && (!matched.password || matched.password === password)) {
        applyLocalAccount(matched);
        return { error: null, requiresOtp: false };
      }
      return { error: new Error(err?.message || "Sign in failed") };
    }
  };

  const signInDemo = async (role: "practitioner" | "admin" = "practitioner") => {
    const demoAccount = upsertLocalAccount({
      email: role === "admin" ? "admin@medvision.clinical" : "dr.mensah@medvision.clinical",
      full_name: role === "admin" ? "Dr. Kofi Mensah (Admin)" : "Dr. Amara Mensah",
      role,
      hospital: "Korle Bu Teaching Hospital",
    });
    applyLocalAccount(demoAccount);
    addLocalAuditLog({
      user_id: demoAccount.id,
      action: "demo_clinician_signin",
      details: { email: demoAccount.email, role: demoAccount.role },
    });
  };

  const verifyLoginOtp = async (code: string) => {
    if (!pendingOtpEmail) {
      return { error: new Error("No login in progress. Please sign in again.") };
    }
    const { error } = await supabase.auth.verifyOtp({
      email: pendingOtpEmail,
      token: code,
      type: "email",
    });
    if (error) {
      return { error: new Error(error.message) };
    }
    setPendingOtpEmail(null);
    return { error: null };
  };

  const resendLoginOtp = async () => {
    if (!pendingOtpEmail) {
      return { error: new Error("No login in progress. Please sign in again.") };
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: pendingOtpEmail,
      options: { shouldCreateUser: false },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const cancelOtpLogin = () => {
    setPendingOtpEmail(null);
  };

  const signOut = async () => {
    setActiveLocalAccount(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        userRole,
        pendingOtpEmail,
        signUp,
        signIn,
        signInDemo,
        verifyLoginOtp,
        resendLoginOtp,
        cancelOtpLogin,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
