import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. Please sign in.");
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <Shield className="h-8 w-8 text-secondary" />
          <span className="font-display text-2xl font-bold text-foreground">MedVision</span>
        </div>
        <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Set New Password</h1>
        <p className="mb-8 text-sm text-muted-foreground">Enter a new password for your account.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" placeholder="At least 8 characters" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
