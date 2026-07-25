import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  pendingOtpEmail: string | null;
  signUp: (email: string, password: string, fullName: string, role: string, hospital: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; requiresOtp?: boolean }>;
  verifyLoginOtp: (code: string) => Promise<{ error: Error | null }>;
  resendLoginOtp: () => Promise<{ error: Error | null }>;
  cancelOtpLogin: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  // Holds the email address that has passed the password check and is
  // waiting on the emailed one-time code (second factor) to finish logging in.
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string | null>(null);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    setUserRole(data?.role || null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchRole(session.user.id), 0);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: string, hospital: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, role, hospital },
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  // Step 1 of login: verify the password is correct, then (instead of granting
  // access immediately) sign that session back out and email a one-time code
  // as the second factor. The caller should show a "enter your code" screen
  // when requiresOtp comes back true.
  const signIn = async (email: string, password: string) => {
    const { error: passwordError } = await supabase.auth.signInWithPassword({ email, password });
    if (passwordError) {
      return { error: new Error(passwordError.message) };
    }

    // Password was correct, but don't let this session count as "logged in"
    // yet -- drop it and require the emailed code first.
    await supabase.auth.signOut();

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (otpError) {
      return { error: new Error(otpError.message) };
    }

    setPendingOtpEmail(email);
    return { error: null, requiresOtp: true };
  };

  // Step 2 of login: verify the emailed code. On success, Supabase issues a
  // real session and onAuthStateChange above picks it up automatically.
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
    await supabase.auth.signOut();
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
