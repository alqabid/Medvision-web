import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, LogOut, ArrowLeft, Search, Download, ScrollText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { userRole, signOut } = useAuth();
  const navigate = useNavigate();
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground flex items-center gap-2">
              <ScrollText className="h-7 w-7 text-secondary" />Audit Trail
            </h1>
            <p className="text-muted-foreground">
              Immutable activity log for compliance & security review.
              {userRole === "admin" ? " Showing all events." : " Showing your activity."}
            </p>
          </div>
          <Button onClick={handleExport} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Download className="mr-2 h-4 w-4" />Export CSV
          </Button>
        </motion.div>

        <div className="mb-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search action or details…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card overflow-x-auto">
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
                    <td className="py-3 text-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                        {r.action}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground font-mono text-xs">{r.user_id?.slice(0, 8) ?? "system"}</td>
                    <td className="py-3 text-muted-foreground font-mono text-xs max-w-md truncate">
                      {r.details ? JSON.stringify(r.details) : "—"}
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

export default AuditLogs;
