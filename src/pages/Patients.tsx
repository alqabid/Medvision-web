import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Trash2, Users, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ClinicalShell from "@/components/ClinicalShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getLocalPatients,
  getLocalAnalyses,
  addLocalPatient,
  deleteLocalPatient,
  addLocalAuditLog,
} from "@/lib/localClinicalStore";

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
  const [scanCounts, setScanCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patient_name: "", gender: "Male", age: "", notes: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    setLoading(true);
    const localList = getLocalPatients(user?.id);
    const localScans = getLocalAnalyses(user?.id);
    const counts: Record<string, number> = {};
    localScans.forEach((a) => {
      if (a.patient_id) counts[a.patient_id] = (counts[a.patient_id] || 0) + 1;
    });

    try {
      const { data } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
      const { data: remoteScans } = await supabase.from("analyses").select("id, patient_id");
      const seenScanIds = new Set(localScans.map((s) => s.id));
      (remoteScans || []).forEach((s: any) => {
        if (s.patient_id && !seenScanIds.has(s.id)) {
          counts[s.patient_id] = (counts[s.patient_id] || 0) + 1;
        }
      });

      const remoteList = (data as Patient[]) || [];
      const seen = new Set(remoteList.map((p) => p.id));
      const merged = [...remoteList, ...localList.filter((p) => !seen.has(p.id))].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setPatients(merged);
      setScanCounts(counts);
    } catch {
      setPatients(localList);
      setScanCounts(counts);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !form.patient_name.trim()) {
      toast.error("Please enter the patient's name");
      return;
    }
    const payload = {
      created_by: user.id,
      patient_name: form.patient_name.trim(),
      gender: form.gender || null,
      age: form.age ? Number(form.age) : null,
      notes: form.notes || null,
    };

    const { error } = await supabase.from("patients").insert(payload);
    if (error) {
      addLocalPatient(payload);
    } else {
      await supabase.from("audit_logs").insert({ user_id: user.id, action: "create_patient", details: { name: form.patient_name } });
    }
    addLocalAuditLog({ user_id: user.id, action: "create_patient", details: { name: form.patient_name } });
    toast.success(`Patient ${form.patient_name.trim()} added`);
    setOpen(false);
    setForm({ patient_name: "", gender: "Male", age: "", notes: "" });
    fetchPatients();
  };

  const handleDelete = async (id: string) => {
    deleteLocalPatient(id);
    await supabase.from("patients").delete().eq("id", id);
    toast.success("Patient removed");
    fetchPatients();
  };

  const filtered = patients.filter(p => p.patient_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <ClinicalShell
      headerRight={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full bg-[#07221e] px-4 text-[#72f6d5] shadow-sm hover:bg-[#0b352e]">
              <Plus className="mr-1.5 h-3.5 w-3.5" />Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>Register New Patient</DialogTitle></DialogHeader>
            <div className="space-y-3.5 pt-2">
              <div className="space-y-1.5">
                <Label>Patient Full Name</Label>
                <Input
                  placeholder="e.g. Kwame Boateng"
                  value={form.patient_name}
                  onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={val => setForm(f => ({ ...f, gender: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Age (years)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 54"
                    value={form.age}
                    onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Clinical Notes / Indication</Label>
                <Input
                  placeholder="e.g. Persistent cough, evaluate for pulmonary nodules"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <Button onClick={handleCreate} className="w-full rounded-full bg-[#07221e] text-[#72f6d5] hover:bg-[#0b352e]">
                Save Patient Profile
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
        <h1 className="font-display text-3xl font-extrabold text-foreground flex items-center gap-2.5 sm:text-4xl">
          <Users className="h-8 w-8 text-secondary" />Patient Directory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select any patient to inspect their longitudinal Chest X-ray and Chest CT history or start a new scan.
        </p>
      </motion.div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search patients by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-full pl-10"
        />
      </div>

      <div className="clinical-surface p-6 overflow-x-auto">
        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Loading patients...</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No patients found. Add a patient to begin.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">Patient Name</th>
                <th className="pb-3 font-medium text-muted-foreground">Demographics</th>
                <th className="pb-3 font-medium text-muted-foreground">Clinical Notes</th>
                <th className="pb-3 font-medium text-muted-foreground">Studies</th>
                <th className="pb-3 font-medium text-muted-foreground">Registered</th>
                <th className="pb-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/patients/${p.id}`)}
                  className="cursor-pointer border-b border-border/50 last:border-0 transition-colors hover:bg-muted/40"
                >
                  <td className="py-3.5 font-semibold text-foreground">{p.patient_name}</td>
                  <td className="py-3.5 text-foreground">
                    {p.gender || "Unspecified"} · {p.age ? `${p.age} yrs` : "Age N/A"}
                  </td>
                  <td className="py-3.5 text-muted-foreground max-w-xs truncate">{p.notes || "No clinical notes"}</td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center rounded-full bg-[#07221e] px-2.5 py-0.5 text-xs font-semibold text-[#72f6d5]">
                      {scanCounts[p.id] || 0} {scanCounts[p.id] === 1 ? "scan" : "scans"}
                    </span>
                  </td>
                  <td className="py-3.5 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard?patient=${p.id}`);
                        }}
                      >
                        <Activity className="mr-1 h-3.5 w-3.5 text-secondary" />
                        New Scan
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
