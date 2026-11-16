import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield, Eye, EyeOff, Mail, Lock, KeyRound, ArrowRight, ArrowLeft,
  Activity, Layers, Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import lungsHero from "@/assets/thoracic-lungs-hero.jpg";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"password" | "otp">("password");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signInDemo, verifyLoginOtp, resendLoginOtp, cancelOtpLogin } = useAuth();
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
      toast.error("Please fill in your email and password");
      return;
    }
    setIsLoading(true);
    const { error, requiresOtp } = await signIn(email, password, requireOtp);
    setIsLoading(false);
    if (error) {
      toast.error(error.message);
    } else if (requiresOtp) {
      toast.success("We sent a login code to your email");
      setStep("otp");
    } else {
      toast.success("Signed in to MedVision Workstation");
      goToDashboard();
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    await signInDemo();
    setIsLoading(false);
    toast.success("Signed in as Dr. Amara Mensah");
    goToDashboard();
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
    <div className="flex min-h-screen bg-background p-3 sm:p-5">
      {/* Left: Dentivo Deep Emerald Bioluminescent 3D Lungs Showcase */}
      <div className="emerald-stage relative hidden w-1/2 flex-col justify-between overflow-hidden rounded-[32px] p-10 text-white shadow-elevated lg:flex">
        {/* Ambient 3D Lungs Backdrop */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <img
            src={lungsHero}
            alt="Translucent Bioluminescent Lungs"
            className="h-full w-full object-cover object-center opacity-90 mix-blend-screen animate-lung-breathe"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07221e]/80 via-transparent to-[#07221e]/90" />
        </div>

        {/* Top Brand Row */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#72f6d5] text-[#06221e] shadow-[0_0_20px_rgba(114,246,213,0.5)]">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              MedVision
            </span>
          </Link>
        </div>

        {/* Floating Glass Modality Callout Pods */}
        <div className="relative z-10 my-auto flex flex-col gap-3 max-w-xs">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            className="glass-pill flex items-center gap-3.5 rounded-full px-4 py-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#72f6d5] text-[#06221e]">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xs font-bold text-white">Chest Radiography</div>
              <div className="text-[11px] text-white/75">Bacterial · Viral · Normal</div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
            className="glass-pill flex items-center gap-3.5 rounded-full px-4 py-3 ml-6"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#72f6d5] text-[#06221e]">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xs font-bold text-white">Chest CT Oncology</div>
              <div className="text-[11px] text-white/75">Adenocarcinoma · Large Cell · Squamous</div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Editorial Headline */}
        <div className="relative z-10 max-w-md space-y-2">
          <h2 className="font-display text-3xl font-bold leading-tight text-white">
            Precision Thoracic <span className="text-[#72f6d5]">Clarity</span> in Every Scan
          </h2>
          <p className="text-sm leading-relaxed text-white/75">
            Guided visual attention maps, chest radiography and CT oncology review, and longitudinal patient records in one calm workspace.
          </p>
        </div>
      </div>

      {/* Right: Interactive Sign-In Form */}
      <div className="flex w-full flex-col justify-between px-4 py-6 sm:px-10 lg:w-1/2">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#07221e] text-[#72f6d5]">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">MedVision</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto my-8 w-full max-w-md"
        >
          <div className="clinical-surface p-7 sm:p-9">
            {step === "password" ? (
              <>
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Clinician Portal
                  </p>
                  <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground">
                    Welcome back
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sign in to access the Chest X-ray &amp; Chest CT workstation.
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Clinician Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="doctor@hospital.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-2xl pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link to="/forgot-password" className="text-xs font-semibold text-secondary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 rounded-2xl pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={requireOtp}
                      onChange={(e) => setRequireOtp(e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-[#07221e]"
                    />
                    Require additional 2FA email verification code
                  </label>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full rounded-full bg-[#07221e] text-sm font-bold text-[#72f6d5] shadow-[0_0_24px_rgba(114,246,213,0.2)] ring-1 ring-[#72f6d5]/40 hover:bg-[#0b352e]"
                  >
                    {isLoading ? "Signing in..." : "Sign In to Workstation"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>

                {/* Instant Demo Access Section */}
                <div className="mt-6 border-t border-border/70 pt-5">
                  <p className="mb-3 text-center text-xs font-medium text-muted-foreground">
                    Or launch an instant clinical session
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={handleDemoLogin}
                    className="h-10 w-full rounded-full border-secondary/30 bg-secondary/5 text-xs font-semibold text-foreground hover:bg-secondary/15"
                  >
                    <Stethoscope className="mr-1.5 h-3.5 w-3.5 text-secondary" />
                    Instant Demo Clinician (Dr. Amara Mensah)
                  </Button>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Don't have a clinician account?{" "}
                  <Link to="/signup" className="font-bold text-secondary hover:underline">
                    Create account
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Check your email</h1>
                <p className="mb-6 text-sm text-muted-foreground">
                  We sent a one-time code to <span className="font-medium text-foreground">{email}</span>. Enter it below to finish signing in.
                </p>

                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Login code</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        placeholder="6-digit code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="h-11 rounded-2xl pl-10 tracking-widest"
                        autoFocus
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full rounded-full bg-[#07221e] text-sm font-bold text-[#72f6d5] hover:bg-[#0b352e]"
                  >
                    {isLoading ? "Verifying..." : "Verify & Sign In"}
                  </Button>
                </form>

                <div className="mt-6 flex items-center justify-between text-sm">
                  <button onClick={handleBackToPassword} className="text-muted-foreground hover:text-foreground">
                    Back to password
                  </button>
                  <button onClick={handleResend} className="font-semibold text-secondary hover:underline">
                    Resend code
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground">
          Dedicated thoracic imaging workstation for clinical decision support.
        </p>
      </div>
    </div>
  );
};

export default Login;
