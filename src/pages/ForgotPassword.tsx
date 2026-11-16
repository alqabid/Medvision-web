import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Reset link sent. Check your inbox.");
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="clinical-surface p-8">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#07221e] text-[#72f6d5]">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">MedVision</span>
          </div>
          <h1 className="mb-2 font-display text-2xl font-extrabold text-foreground">Reset Password</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Enter your clinical email and we will send you a password reset link.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-2xl pl-10"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-full bg-[#07221e] text-sm font-bold text-[#72f6d5] hover:bg-[#0b352e]"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
          <Link to="/login" className="mt-6 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
