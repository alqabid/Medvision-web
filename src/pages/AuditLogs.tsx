import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Download, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ClinicalShell from "@/components/ClinicalShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { downloadCSV } from "@/lib/csv";
import { toast } from "sonner";
import { getLocalAuditLogs } from "@/lib/localClinicalStore";

interface AuditRow {
  id: string;
  user_id: string | null;
  action: string;
  details: any;
  created_at: string;
}

const formatActionLabel = (action: string) => {
  switch (action) {
    case "analyze_scan":
      return "Scan Analyzed";
    case "create_patient":
      return "Patient Registered";
    case "download_report_pdf":
      return "PDF Report Exported";
    case "export_records_csv":
      return "Records CSV Exported";
    case "clinician_signin":
    case "demo_clinician_signin":
      return "Clinician Sign-In";
    case "clinician_signup":
      return "Clinician Onboarded";
    default:
      return action.replace(/_/g, " ");
  }
};

const formatDetailsSummary = (details: any) => {
  if (!details || typeof details !== "object") return "Standard clinical event";
  const parts: string[] = [];
  if (details.modality) parts.push(details.modality === "ct" ? "Chest CT" : "Chest X-ray");
  if (details.prediction) parts.push(`Finding: ${details.prediction}`);
  if (details.confidence !== undefined) parts.push(`${details.confidence}% confidence`);
  if (details.name) parts.push(`Patient: ${details.name}`);
  if (details.filename) parts.push(`File: ${details.filename}`);
  if (details.count !== undefined) parts.push(`${details.count} records`);
  if (details.hospital) parts.push(String(details.hospital));
  if (details.email && parts.length === 0) parts.push(String(details.email));
  return parts.length > 0 ? parts.join(" · ") : "Completed";
};

const AuditLogs = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLogs(); }, [user]);

  const fetchLogs = async () => {
    setLoading(true);
    const localLogs = getLocalAuditLogs(user?.id);
    try {
      const { data } = await supabase
        .from("audit_logs").select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      const remoteLogs = (data as AuditRow[]) || [];
      const seen = new Set(remoteLogs.map((l) => l.id));
      const merged = [...remoteLogs, ...localLogs.filter((l) => !seen.has(l.id))].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRows(merged);
    } catch {
      setRows(localLogs);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      formatActionLabel(r.action).toLowerCase().includes(q) ||
      formatDetailsSummary(r.details).toLowerCase().includes(q)
    );
  }, [rows, search]);

  const handleExport = () => {
    downloadCSV(`medvision-activity-${Date.now()}.csv`, filtered.map(r => ({
      timestamp: new Date(r.created_at).toISOString(),
      event: formatActionLabel(r.action),
      summary: formatDetailsSummary(r.details),
    })));
    toast.success("Activity log exported");
  };

  return (
    <ClinicalShell
      headerRight={
        <Button onClick={handleExport} size="sm" className="rounded-full bg-[#07221e] px-4 text-[#72f6d5] shadow-sm hover:bg-[#0b352e]">
          <Download className="mr-1.5 h-3.5 w-3.5" />Export CSV
        </Button>
      }
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
        <h1 className="font-display text-3xl font-extrabold text-foreground flex items-center gap-2.5 sm:text-4xl">
          <ScrollText className="h-8 w-8 text-secondary" />Clinical Activity Log
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chronological record of diagnostic reviews, patient registrations, and report exports.
        </p>
      </motion.div>

      <div className="mb-5 relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search activity events..." value={search} onChange={e => setSearch(e.target.value)} className="rounded-full pl-10" />
      </div>

      <div className="clinical-surface p-6 overflow-x-auto">
        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Loading activity log...</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No clinical activity recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">Date &amp; Time</th>
                <th className="pb-3 font-medium text-muted-foreground">Event</th>
                <th className="pb-3 font-medium text-muted-foreground">Clinical Summary</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3.5 text-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center rounded-full bg-[#07221e] px-3 py-0.5 text-xs font-semibold text-[#72f6d5]">
                      {formatActionLabel(r.action)}
                    </span>
                  </td>
                  <td className="py-3.5 text-muted-foreground">
                    {formatDetailsSummary(r.details)}
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

export default AuditLogs;
