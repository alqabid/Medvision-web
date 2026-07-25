import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, Mail, Lock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"password" | "otp">("password");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, verifyLoginOtp, resendLoginOtp, cancelOtpLogin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const nextParam = params.get("next");
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;

  const goToDashboard = () => {
    if (safeNext) window.location.href = safeNext;
    else navigate("/dashboard");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    const { error, requiresOtp } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      toast.error(error.message);
    } else if (requiresOtp) {
      toast.success("We sent a login code to your email");
      setStep("otp");
    } else {
      goToDashboard();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error("Please enter the code from your email");
      return;
    }
    setIsLoading(true);
    const { error } = await verifyLoginOtp(otpCode);
    setIsLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signed in successfully");
      goToDashboard();
    }
  };

  const handleResend = async () => {
    const { error } = await resendLoginOtp();
    if (error) toast.error(error.message);
    else toast.success("Code resent");
  };

  const handleBackToPassword = () => {
    cancelOtpLogin();
    setOtpCode("");
    setStep("password");
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-hero lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Shield className="h-10 w-10 text-accent" />
            <span className="font-display text-3xl font-bold text-primary-foreground">MedVision</span>
          </div>
          <h2 className="mb-4 font-display text-2xl font-semibold text-primary-foreground">Secure AI Diagnostics</h2>
          <p className="text-primary-foreground/60">Access your AI-powered pneumonia detection platform with enterprise-grade security.</p>
        </motion.div>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Shield className="h-8 w-8 text-secondary" />
            <span className="font-display text-2xl font-bold text-foreground">MedVision</span>
          </div>

          {step === "password" ? (
            <>
              <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="mb-8 text-sm text-muted-foreground">Sign in to your account to continue</p>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="doctor@hospital.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs text-secondary hover:underline">Forgot password?</Link>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  {isLoading ? "Checking password..." : "Sign In"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/signup" className="font-medium text-secondary hover:underline">Sign up</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Check your email</h1>
              <p className="mb-8 text-sm text-muted-foreground">
                We sent a one-time code to <span className="font-medium text-foreground">{email}</span>. Enter it below to finish signing in.
              </p>

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Login code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      placeholder="6-digit code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="pl-10 tracking-widest"
                      autoFocus
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  {isLoading ? "Verifying..." : "Verify & Sign In"}
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-between text-sm">
                <button onClick={handleBackToPassword} className="text-muted-foreground hover:text-foreground">
                  &larr; Back
                </button>
                <button onClick={handleResend} className="font-medium text-secondary hover:underline">
                  Resend code
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
