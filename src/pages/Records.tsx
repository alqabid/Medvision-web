import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Download, FileImage, AlertTriangle, CheckCircle2, Database, Filter,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import ClinicalShell from "@/components/ClinicalShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { downloadCSV } from "@/lib/csv";
import { toast } from "sonner";

// Result colours: "Normal" green, "Invalid" amber, every other class red
const styleFor = (p: string) => {
  if (p === "Normal") return { badge: "bg-success/10 text-success", icon: CheckCircle2 };
  if (p === "Invalid") return { badge: "bg-warning/10 text-warning", icon: AlertTriangle };
  return { badge: "bg-destructive/10 text-destructive", icon: AlertTriangle };
};

const formatModalityLabel = (modality?: string) => (modality === "ct" ? "Chest CT" : "Chest X-ray");

interface AnalysisRow {
  id: string;
  modality?: string;
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
  const { user, userRole } = useAuth();
  const [rows, setRows] = useState<AnalysisRow[]>([]);
  const [patients, setPatients] = useState<Record<string, PatientRow>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [modalityFilter, setModalityFilter] = useState<string>("all");
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

  const modalityFilteredRows = useMemo(() => {
    if (modalityFilter === "all") return rows;
    return rows.filter(r => (r.modality ?? "xray") === modalityFilter);
  }, [rows, modalityFilter]);

  const classCounts = useMemo(() => {
    const map = new Map<string, number>();
    modalityFilteredRows.forEach(r => map.set(r.prediction, (map.get(r.prediction) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [modalityFilteredRows]);

  const filtered = useMemo(() => {
    return modalityFilteredRows.filter(r => {
      if (filter !== "all" && r.prediction !== filter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      const p = r.patient_id ? patients[r.patient_id]?.patient_name : "";
      return r.original_filename.toLowerCase().includes(q)
        || r.prediction.toLowerCase().includes(q)
        || (p && p.toLowerCase().includes(q));
    });
  }, [modalityFilteredRows, search, filter, patients]);

  const handleExport = async () => {
    const exportRows = filtered.map(r => ({
      date: new Date(r.created_at).toISOString(),
      patient: r.patient_id ? patients[r.patient_id]?.patient_name ?? "—" : "—",
      modality: formatModalityLabel(r.modality),
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
        details: { count: exportRows.length, filter, modalityFilter },
      });
    }
    toast.success(`Exported ${exportRows.length} records`);
  };

  const avgConf = useMemo(
    () => modalityFilteredRows.length ? (modalityFilteredRows.reduce((s, r) => s + Number(r.confidence), 0) / modalityFilteredRows.length).toFixed(1) : "0",
    [modalityFilteredRows]
  );

  const xrayCount = useMemo(() => rows.filter(r => (r.modality ?? "xray") === "xray").length, [rows]);
  const ctCount = useMemo(() => rows.filter(r => r.modality === "ct").length, [rows]);

  return (
    <ClinicalShell
      headerRight={
        <Button onClick={handleExport} size="sm" className="rounded-full bg-[#2563eb] px-4 text-white hover:bg-[#1d4ed8]">
          <Download className="mr-1.5 h-3.5 w-3.5" />Export CSV
        </Button>
      }
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground flex items-center gap-2.5 sm:text-4xl">
            <Database className="h-8 w-8 text-[#2563eb]" />Records Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Centralized, encrypted diagnostic records across Chest X-ray and Chest CT{userRole === "admin" ? " (admin view: all users)" : ""}.
          </p>
        </div>
        <Button variant="outline" asChild className="rounded-full">
          <Link to="/audit">Audit Trail</Link>
        </Button>
      </motion.div>

      {/* Overview cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="clinical-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Records</span>
            <FileImage className="h-5 w-5 text-[#2563eb]" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">{modalityFilteredRows.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">{xrayCount} X-ray · {ctCount} CT</p>
        </div>
        <div className="clinical-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Avg Confidence</span>
            <Filter className="h-5 w-5 text-info" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">{avgConf}%</p>
          <p className="mt-1 text-xs text-muted-foreground">Mean model probability</p>
        </div>
        {classCounts.slice(0, 6).map(c => {
          const st = styleFor(c.name);
          const Icon = st.icon;
          return (
            <div key={c.name} className="clinical-surface p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{c.name}</span>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${st.badge}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">
                {modalityFilteredRows.length ? ((c.value / modalityFilteredRows.length) * 100).toFixed(1) : "0"}% of cohort
              </p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by patient, filename, or result…" value={search} onChange={e => setSearch(e.target.value)} className="rounded-full pl-10" />
        </div>
        <Select value={modalityFilter} onValueChange={setModalityFilter}>
          <SelectTrigger className="w-48 rounded-full"><SelectValue placeholder="All Scan Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scan Types ({rows.length})</SelectItem>
            <SelectItem value="xray">Chest X-ray ({xrayCount})</SelectItem>
            <SelectItem value="ct">Chest CT ({ctCount})</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-52 rounded-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes ({modalityFilteredRows.length})</SelectItem>
            {classCounts.map(c => (
              <SelectItem key={c.name} value={c.name}>{c.name} ({c.value})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="clinical-surface p-6 overflow-x-auto">
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
                <th className="pb-3 font-medium text-muted-foreground">Scan Type</th>
                <th className="pb-3 font-medium text-muted-foreground">File</th>
                <th className="pb-3 font-medium text-muted-foreground">Result</th>
                <th className="pb-3 font-medium text-muted-foreground">Confidence</th>
                <th className="pb-3 font-medium text-muted-foreground">Model</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const st = styleFor(r.prediction);
                const Icon = st.icon;
                const isCt = r.modality === "ct";
                return (
                <tr key={r.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3.5 text-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="py-3.5 font-medium text-foreground">{r.patient_id ? patients[r.patient_id]?.patient_name ?? "—" : "—"}</td>
                  <td className="py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isCt ? "bg-info/10 text-info" : "bg-secondary/10 text-secondary"
                      }`}
                    >
                      {formatModalityLabel(r.modality)}
                    </span>
                  </td>
                  <td className="py-3.5 text-muted-foreground max-w-[200px] truncate">{r.original_filename}</td>
                  <td className="py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.badge}`}>
                      <Icon className="h-3 w-3" />
                      {r.prediction}
                    </span>
                  </td>
                  <td className="py-3.5 font-mono text-foreground">{Number(r.confidence).toFixed(1)}%</td>
                  <td className="py-3.5 text-muted-foreground">{r.model_used}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </ClinicalShell>
  );
};

export default Records;
