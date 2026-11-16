import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ClinicalShell from "@/components/ClinicalShell";
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
  const { user } = useAuth();
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

  return (
    <ClinicalShell
      headerRight={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full bg-[#2563eb] px-4 text-white hover:bg-[#1d4ed8]">
              <Plus className="mr-1.5 h-3.5 w-3.5" />Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>New Patient</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Gender</Label><Input value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} /></div>
                <div><Label>Age</Label><Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} /></div>
              </div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button onClick={handleCreate} className="w-full rounded-full bg-[#2563eb] text-white hover:bg-[#1d4ed8]">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
        <h1 className="font-display text-3xl font-extrabold text-foreground flex items-center gap-2.5 sm:text-4xl">
          <Users className="h-8 w-8 text-[#2563eb]" />Patient Queue &amp; Directory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage patient profiles linked to Chest X-ray and Chest CT scans.</p>
      </motion.div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} className="rounded-full pl-10" />
      </div>

      <div className="clinical-surface p-6">
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
                <tr
                  key={p.id}
                  onClick={() => navigate(`/patients/${p.id}`)}
                  className="cursor-pointer border-b border-border/50 last:border-0 transition-colors hover:bg-muted/40"
                >
                  <td className="py-3.5 text-foreground font-semibold">{p.patient_name}</td>
                  <td className="py-3.5 text-foreground">{p.gender || "—"}</td>
                  <td className="py-3.5 text-foreground">{p.age ?? "—"}</td>
                  <td className="py-3.5 text-muted-foreground max-w-xs truncate">{p.notes || "—"}</td>
                  <td className="py-3.5 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="py-3.5 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ClinicalShell>
  );
};

export default Patients;
