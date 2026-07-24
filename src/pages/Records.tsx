import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield, LogOut, ArrowLeft, Search, Download, FileImage,
  AlertTriangle, CheckCircle2, Database, Filter, Activity,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { downloadCSV } from "@/lib/csv";
import { toast } from "sonner";

// Consistent per-class styling — supports any number of classes the model emits.
const CLASS_STYLES: Record<string, { badge: string; icon: typeof CheckCircle2 }> = {
  Normal: { badge: "bg-success/10 text-success", icon: CheckCircle2 },
  Pneumonia: { badge: "bg-destructive/10 text-destructive", icon: AlertTriangle },
  "COVID-19": { badge: "bg-purple-500/10 text-purple-500", icon: Activity },
  Covid: { badge: "bg-purple-500/10 text-purple-500", icon: Activity },
  Tuberculosis: { badge: "bg-orange-500/10 text-orange-500", icon: Activity },
  Invalid: { badge: "bg-muted text-muted-foreground", icon: AlertTriangle },
};
const styleFor = (p: string) => CLASS_STYLES[p] ?? { badge: "bg-info/10 text-info", icon: Activity };

interface AnalysisRow {
  id: string;
  prediction: string;
  confidence: number;
  original_filename: string;
  model_used: string;
  findings: string | null;
  patient_id: string | null;
  created_at: string;
  user_id: string;
}

interface PatientRow {
  id: string;
  patient_name: string;
  gender: string | null;
  age: number | null;
}

const Records = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<AnalysisRow[]>([]);
  const [patients, setPatients] = useState<Record<string, PatientRow>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "Pneumonia" | "Normal">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("analyses").select("*")
      .order("created_at", { ascending: false });
    const { data: pats } = await supabase.from("patients").select("id, patient_name, gender, age");
    if (data) setRows(data as AnalysisRow[]);
    if (pats) setPatients(Object.fromEntries(pats.map(p => [p.id, p as PatientRow])));
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filter !== "all" && r.prediction !== filter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      const p = r.patient_id ? patients[r.patient_id]?.patient_name : "";
      return r.original_filename.toLowerCase().includes(q)
        || r.prediction.toLowerCase().includes(q)
        || (p && p.toLowerCase().includes(q));
    });
  }, [rows, search, filter, patients]);

  const handleExport = async () => {
    const exportRows = filtered.map(r => ({
      date: new Date(r.created_at).toISOString(),
      patient: r.patient_id ? patients[r.patient_id]?.patient_name ?? "—" : "—",
      filename: r.original_filename,
      prediction: r.prediction,
      confidence: Number(r.confidence).toFixed(2),
      model: r.model_used,
      findings: r.findings ?? "",
    }));
    downloadCSV(`medvision-records-${Date.now()}.csv`, exportRows);
    if (user) {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "export_records_csv",
        details: { count: exportRows.length, filter },
      });
    }
    toast.success(`Exported ${exportRows.length} records`);
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const stats = useMemo(() => ({
    total: rows.length,
    pneumonia: rows.filter(r => r.prediction === "Pneumonia").length,
    normal: rows.filter(r => r.prediction === "Normal").length,
    avg: rows.length ? (rows.reduce((s, r) => s + Number(r.confidence), 0) / rows.length).toFixed(1) : "0",
  }), [rows]);

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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground flex items-center gap-2">
              <Database className="h-7 w-7 text-secondary" />Records Management
            </h1>
            <p className="text-muted-foreground">Centralized, encrypted diagnostic records. RLS-secured per user{userRole === "admin" ? " (admin view: all users)" : ""}.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/audit">Audit Trail</Link></Button>
            <Button onClick={handleExport} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Download className="mr-2 h-4 w-4" />Export CSV
            </Button>
          </div>
        </motion.div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Records", value: stats.total, icon: FileImage, color: "text-secondary" },
            { label: "Pneumonia", value: stats.pneumonia, icon: AlertTriangle, color: "text-destructive" },
            { label: "Normal", value: stats.normal, icon: CheckCircle2, color: "text-success" },
            { label: "Avg Confidence", value: `${stats.avg}%`, icon: Filter, color: "text-info" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by patient, filename, or result…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filter} onValueChange={(v: typeof filter) => setFilter(v)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="Pneumonia">Pneumonia</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card overflow-x-auto">
          {loading ? (
            <p className="py-12 text-center text-muted-foreground">Loading records…</p>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No records match your filters.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Date</th>
                  <th className="pb-3 font-medium text-muted-foreground">Patient</th>
                  <th className="pb-3 font-medium text-muted-foreground">File</th>
                  <th className="pb-3 font-medium text-muted-foreground">Result</th>
                  <th className="pb-3 font-medium text-muted-foreground">Confidence</th>
                  <th className="pb-3 font-medium text-muted-foreground">Model</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 text-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-3 text-foreground">{r.patient_id ? patients[r.patient_id]?.patient_name ?? "—" : "—"}</td>
                    <td className="py-3 text-muted-foreground max-w-[200px] truncate">{r.original_filename}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.prediction === "Pneumonia" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                      }`}>
                        {r.prediction === "Pneumonia" ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        {r.prediction}
                      </span>
                    </td>
                    <td className="py-3 text-foreground">{Number(r.confidence).toFixed(1)}%</td>
                    <td className="py-3 text-muted-foreground">{r.model_used}</td>
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

export default Records;
