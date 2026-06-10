import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, LogOut, ArrowLeft, User, Lock, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, email").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setFullName(data.full_name || ""); setEmail(data.email || user.email || ""); }
    });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  const changePassword = async () => {
    if (newPassword.length < 8) return toast.error("Password must be at least 8 characters");
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setNewPassword("");
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-secondary" />
            <span className="font-display text-lg font-bold text-foreground">MedVision</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="mb-8 text-muted-foreground">Manage your profile and security preferences.</p>
        </motion.div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-secondary" />
              <h2 className="font-display text-lg font-semibold text-card-foreground">Profile</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={userRole?.replace("_", " ") || "user"} disabled className="capitalize" />
              </div>
              <div className="space-y-2">
                <Label>User ID</Label>
                <Input value={user?.id || ""} disabled className="font-mono text-xs" />
              </div>
            </div>
            <Button onClick={saveProfile} disabled={saving} className="mt-6 bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-secondary" />
              <h2 className="font-display text-lg font-semibold text-card-foreground">Security</h2>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <Button onClick={changePassword} disabled={pwSaving || !newPassword} className="mt-6 bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Lock className="mr-2 h-4 w-4" />{pwSaving ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
