import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, LogOut, ArrowLeft, Plus, Search, Trash2, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Patient {
  id: string;
  patient_name: string;
  gender: string | null;
  age: number | null;
  notes: string | null;
  created_at: string;
}

const Patients = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patient_name: "", gender: "", age: "", notes: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    const { data } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
    if (data) setPatients(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !form.patient_name.trim()) return;
    const { error } = await supabase.from("patients").insert({
      created_by: user.id,
      patient_name: form.patient_name.trim(),
      gender: form.gender || null,
      age: form.age ? Number(form.age) : null,
      notes: form.notes || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("audit_logs").insert({ user_id: user.id, action: "create_patient", details: { name: form.patient_name } });
    toast.success("Patient added");
    setOpen(false);
    setForm({ patient_name: "", gender: "", age: "", notes: "" });
    fetchPatients();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Patient removed");
    fetchPatients();
  };

  const filtered = patients.filter(p => p.patient_name.toLowerCase().includes(search.toLowerCase()));

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

      <main className="mx-auto max-w-7xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground flex items-center gap-2"><Users className="h-7 w-7 text-secondary" />Patient Records</h1>
            <p className="text-muted-foreground">Manage patient records linked to your scans.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90"><Plus className="mr-2 h-4 w-4" />Add Patient</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Patient</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Gender</Label><Input value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} /></div>
                  <div><Label>Age</Label><Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} /></div>
                </div>
                <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button onClick={handleCreate} className="w-full">Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          {loading ? (
            <p className="py-12 text-center text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No patients yet. Add your first record.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Name</th>
                  <th className="pb-3 font-medium text-muted-foreground">Gender</th>
                  <th className="pb-3 font-medium text-muted-foreground">Age</th>
                  <th className="pb-3 font-medium text-muted-foreground">Notes</th>
                  <th className="pb-3 font-medium text-muted-foreground">Added</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 text-foreground font-medium">{p.patient_name}</td>
                    <td className="py-3 text-foreground">{p.gender || "—"}</td>
                    <td className="py-3 text-foreground">{p.age ?? "—"}</td>
                    <td className="py-3 text-muted-foreground max-w-xs truncate">{p.notes || "—"}</td>
                    <td className="py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default Patients;
