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

interface AuditRow {
  id: string;
  user_id: string | null;
  action: string;
  details: any;
  created_at: string;
}

const AuditLogs = () => {
  const { userRole } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_logs").select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    if (data) setRows(data as AuditRow[]);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      r.action.toLowerCase().includes(q) ||
      JSON.stringify(r.details ?? {}).toLowerCase().includes(q)
    );
  }, [rows, search]);

  const handleExport = () => {
    downloadCSV(`medvision-audit-${Date.now()}.csv`, filtered.map(r => ({
      timestamp: new Date(r.created_at).toISOString(),
      user_id: r.user_id ?? "",
      action: r.action,
      details: JSON.stringify(r.details ?? {}),
    })));
    toast.success("Audit log exported");
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
          <ScrollText className="h-8 w-8 text-secondary" />Audit Trail
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Immutable activity log for compliance &amp; security review.
          {userRole === "admin" ? " Showing all events." : " Showing your activity."}
        </p>
      </motion.div>

      <div className="mb-5 relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search action or details…" value={search} onChange={e => setSearch(e.target.value)} className="rounded-full pl-10" />
      </div>

      <div className="clinical-surface p-6 overflow-x-auto">
        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Loading audit log…</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No audit events found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">Timestamp</th>
                <th className="pb-3 font-medium text-muted-foreground">Action</th>
                <th className="pb-3 font-medium text-muted-foreground">User</th>
                <th className="pb-3 font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3.5 text-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center rounded-full bg-[#07221e] px-2.5 py-0.5 text-xs font-semibold text-[#72f6d5]">
                      {r.action}
                    </span>
                  </td>
                  <td className="py-3.5 text-muted-foreground font-mono text-xs">{r.user_id?.slice(0, 8) ?? "system"}</td>
                  <td className="py-3.5 text-muted-foreground font-mono text-xs max-w-md truncate">
                    {r.details ? JSON.stringify(r.details) : "None"}
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
