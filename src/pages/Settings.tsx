import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ClinicalShell from "@/components/ClinicalShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const { user, userRole } = useAuth();
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

  return (
    <ClinicalShell practitionerName={fullName}>
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-1 font-display text-3xl font-extrabold text-foreground sm:text-4xl">Account Settings</h1>
          <p className="mb-7 text-sm text-muted-foreground">Manage your clinician profile and security credentials.</p>
        </motion.div>

        <div className="space-y-6">
          <div className="clinical-surface p-7">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#07221e] text-[#72f6d5]">
                <User className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-bold text-card-foreground">Clinician Profile</h2>
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
            <Button onClick={saveProfile} disabled={saving} className="mt-6 rounded-full bg-[#07221e] px-6 text-[#72f6d5] shadow-sm hover:bg-[#0b352e]">
              <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>

          <div className="clinical-surface p-7">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#07221e] text-[#72f6d5]">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-bold text-card-foreground">Password &amp; Security</h2>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <Button onClick={changePassword} disabled={pwSaving || !newPassword} className="mt-6 rounded-full bg-[#07221e] px-6 text-[#72f6d5] shadow-sm hover:bg-[#0b352e]">
              <Lock className="mr-2 h-4 w-4" />{pwSaving ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </div>
    </ClinicalShell>
  );
};

export default Settings;
