import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield, Eye, EyeOff, Mail, Lock, User, Building2, ArrowRight, ArrowLeft,
  Activity, Layers, Stethoscope, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import lungsHero from "@/assets/thoracic-lungs-hero.jpg";

const HOSPITALS = [
  "Korle Bu Teaching Hospital",
  "Komfo Anokye Teaching Hospital",
  "37 Military Hospital",
  "Ridge Hospital",
  "Tamale Teaching Hospital",
  "Cape Coast Teaching Hospital",
  "Effia Nkwanta Regional Hospital",
  "Other",
];

const SPECIALTIES = [
  "Thoracic Radiology",
  "Pulmonology & Critical Care",
  "Thoracic Oncology",
  "Internal Medicine",
];

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialty, setSpecialty] = useState<string>("Thoracic Radiology");
  const [hospital, setHospital] = useState<string>("Korle Bu Teaching Hospital");
  const [otherHospital, setOtherHospital] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalHospital = hospital === "Other" ? otherHospital.trim() : hospital;

    if (!fullName.trim() || !email.trim() || !password || !hospital) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (hospital === "Other" && !otherHospital.trim()) {
      toast.error("Please enter your hospital's name");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    const { error, immediateLogin } = await signUp(
      email.trim(),
      password,
      fullName.trim(),
      specialty,
      finalHospital
    );
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else if (immediateLogin) {
      toast.success(`Welcome to MedVision, ${fullName.trim()}`);
      navigate("/dashboard");
    } else {
      toast.success("Account created! Signing in to workstation...");
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen bg-background p-3 sm:p-5">
      {/* Left: Dentivo Deep Emerald Bioluminescent 3D Lungs Showcase */}
      <div className="emerald-stage relative hidden w-1/2 flex-col justify-between overflow-hidden rounded-[32px] p-10 text-white shadow-elevated lg:flex">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <img
            src={lungsHero}
            alt="Translucent Bioluminescent Lungs"
            className="h-full w-full object-cover object-center opacity-90 mix-blend-screen animate-lung-breathe"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07221e]/80 via-transparent to-[#07221e]/90" />
        </div>

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

        <div className="relative z-10 my-auto space-y-3 max-w-sm">
          {[
            {
              icon: Activity,
              title: "Chest Radiography Care",
              sub: "Bacterial · Viral · Clear lung fields",
            },
            {
              icon: Layers,
              title: "Chest CT Oncology Care",
              sub: "Adenocarcinoma · Large Cell · Squamous Cell",
            },
            {
              icon: CheckCircle2,
              title: "Instant Workstation Access",
              sub: "Immediate visual attention maps & PDF reports",
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              animate={{ y: [0, idx % 2 === 0 ? -4 : 4, 0] }}
              transition={{ duration: 4 + idx * 0.5, repeat: Infinity, ease: "easeInOut" }}
              className="glass-pill flex items-center gap-3.5 rounded-full px-4 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#72f6d5] text-[#06221e]">
                <item.icon className="h-4 w-4" />
              </span>
              <div>
                <div className="text-xs font-bold text-white">{item.title}</div>
                <div className="text-[11px] text-white/75">{item.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 max-w-md space-y-2">
          <h2 className="font-display text-3xl font-bold leading-tight text-white">
            Join the <span className="text-[#72f6d5]">Thoracic Care</span> Clinical Network
          </h2>
          <p className="text-sm leading-relaxed text-white/75">
            Register your clinician profile to review chest radiographs and CT studies with longitudinal patient records.
          </p>
        </div>
      </div>

      {/* Right: Interactive Registration Form */}
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
          className="mx-auto my-6 w-full max-w-md"
        >
          <div className="clinical-surface p-7 sm:p-9">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                Clinician Registration
              </p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground">
                Create account
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Instant access to Chest X-ray &amp; Chest CT review.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name &amp; Title</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Dr. Amara Mensah"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 rounded-2xl pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Clinical Email</Label>
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
                <Label>Clinical Specialty</Label>
                <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-muted/70 p-1.5 text-xs">
                  {SPECIALTIES.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => setSpecialty(spec)}
                      className={`rounded-xl px-2.5 py-2 font-semibold transition-all ${
                        specialty === spec
                          ? "bg-[#07221e] text-[#72f6d5] shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hospital">Hospital / Institution</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Select value={hospital} onValueChange={setHospital}>
                    <SelectTrigger className="h-11 rounded-2xl pl-10">
                      <SelectValue placeholder="Select your hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOSPITALS.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {hospital === "Other" && (
                  <Input
                    placeholder="Enter your hospital's name"
                    value={otherHospital}
                    onChange={(e) => setOtherHospital(e.target.value)}
                    className="mt-2 h-11 rounded-2xl"
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
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

              <Button
                type="submit"
                disabled={isLoading}
                className="mt-2 h-12 w-full rounded-full bg-[#07221e] text-sm font-bold text-[#72f6d5] shadow-[0_0_24px_rgba(114,246,213,0.2)] ring-1 ring-[#72f6d5]/40 hover:bg-[#0b352e]"
              >
                {isLoading ? "Activating Account..." : "Create & Launch Workstation"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-secondary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground">
          Dedicated thoracic imaging workstation for clinical decision support.
        </p>
      </div>
    </div>
  );
};

export default Signup;
