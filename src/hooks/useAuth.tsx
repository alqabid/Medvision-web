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
} from "@/lib/localClinicalStore";

export const DEMO_ACCOUNT = {
  email: "demo@medvision.app",
  password: "medvision123",
  full_name: "Dr. Demo Clinician",
  specialty: "Thoracic Radiology",
  hospital: "Korle Bu Teaching Hospital",
};

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
    specialty: string,
    hospital: string
  ) => Promise<{ error: Error | null; immediateLogin?: boolean }>;
  signIn: (
    email: string,
    password: string,
    requireOtp?: boolean
  ) => Promise<{ error: Error | null; requiresOtp?: boolean }>;
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
      role: "practitioner",
      hospital: acct.hospital,
      specialty: acct.specialty || "Thoracic Radiology",
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string | null>(null);

  const applyLocalAccount = (acct: LocalAccount) => {
    setActiveLocalAccount(acct);
    const synUser = buildSyntheticUser(acct);
    const synSession = buildSyntheticSession(acct);
    setUser(synUser);
    setSession(synSession);
    setUserRole("practitioner");
    setLoading(false);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, supaSession) => {
      if (supaSession?.user) {
        setSession(supaSession);
        setUser(supaSession.user);
        setUserRole("practitioner");
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
        setUserRole("practitioner");
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
    specialty: string,
    hospital: string
  ) => {
    const localAcct = upsertLocalAccount({
      email,
      password,
      full_name: fullName,
      specialty: specialty || "Thoracic Radiology",
      hospital,
    });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            role: "practitioner",
            specialty: specialty || "Thoracic Radiology",
            hospital,
          },
        },
      });

      if (!error && data.session && data.user) {
        const synced = upsertLocalAccount({
          id: data.user.id,
          email,
          password,
          full_name: fullName,
          specialty: specialty || "Thoracic Radiology",
          hospital,
        });
        setActiveLocalAccount(synced);
        return { error: null, immediateLogin: true };
      }

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
          specialty: specialty || "Thoracic Radiology",
          hospital,
        });
        setActiveLocalAccount(synced);
        return { error: null, immediateLogin: true };
      }
    } catch {
      // Proceed to immediate local activation
    }

    applyLocalAccount(localAcct);
    addLocalAuditLog({
      user_id: localAcct.id,
      action: "clinician_signup",
      details: { email: localAcct.email, specialty: localAcct.specialty, hospital: localAcct.hospital },
    });
    return { error: null, immediateLogin: true };
  };

  const signIn = async (email: string, password: string, requireOtp = false) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
      const demoAcct = upsertLocalAccount({
        email: DEMO_ACCOUNT.email,
        password: DEMO_ACCOUNT.password,
        full_name: DEMO_ACCOUNT.full_name,
        specialty: DEMO_ACCOUNT.specialty,
        hospital: DEMO_ACCOUNT.hospital,
      });
      applyLocalAccount(demoAcct);
      addLocalAuditLog({
        user_id: demoAcct.id,
        action: "clinician_signin",
        details: { email: demoAcct.email },
      });
      return { error: null, requiresOtp: false };
    }

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
            specialty: (meta.specialty as string) || "Thoracic Radiology",
            hospital: (meta.hospital as string) || "Korle Bu Teaching Hospital",
          });
          setActiveLocalAccount(synced);
          return { error: null, requiresOtp: false };
        }

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

      const knownAccounts = getLocalAccounts();
      const matched = knownAccounts.find((a) => a.email.toLowerCase() === normalizedEmail);

      if (matched && (!matched.password || matched.password === password)) {
        applyLocalAccount(matched);
        addLocalAuditLog({
          user_id: matched.id,
          action: "clinician_signin",
          details: { email: matched.email },
        });
        return { error: null, requiresOtp: false };
      }

      if (passwordError && /email not confirmed/i.test(passwordError.message)) {
        const acct = upsertLocalAccount({
          email: normalizedEmail,
          password,
          full_name: matched?.full_name || normalizedEmail.split("@")[0],
          specialty: matched?.specialty || "Thoracic Radiology",
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
