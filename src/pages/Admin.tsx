import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Users, FileImage, BarChart3, AlertTriangle, CheckCircle2, LogOut, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProfileRecord {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface AnalysisRecord {
  id: string;
  prediction: string;
  confidence: number;
  original_filename: string;
  model_used: string;
  created_at: string;
  user_id: string;
}

const Admin = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchData();
  }, [userRole]);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, analysesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("analyses").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (analysesRes.data) setAnalyses(analysesRes.data);
    setLoading(false);
  };

  const totalAnalyses = analyses.length;
  const pneumoniaCases = analyses.filter(a => a.prediction === "Pneumonia").length;
  const normalCases = analyses.filter(a => a.prediction === "Normal").length;
  const avgConfidence = analyses.length > 0
    ? (analyses.reduce((s, a) => s + Number(a.confidence), 0) / analyses.length).toFixed(1)
    : "0";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mb-8 text-muted-foreground">Monitor system activity, users, and analysis results.</p>
        </motion.div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Users", value: profiles.length, icon: Users, color: "text-secondary" },
            { label: "Total Analyses", value: totalAnalyses, icon: FileImage, color: "text-info" },
            { label: "Pneumonia Detected", value: pneumoniaCases, icon: AlertTriangle, color: "text-destructive" },
            { label: "Avg. Confidence", value: `${avgConfidence}%`, icon: BarChart3, color: "text-success" },
          ].map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Users table */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Registered Users</h2>
            {loading ? (
              <p className="py-8 text-center text-muted-foreground">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Name</th>
                      <th className="pb-3 font-medium text-muted-foreground">Email</th>
                      <th className="pb-3 font-medium text-muted-foreground">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p) => (
                      <tr key={p.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 text-foreground">{p.full_name || "N/A"}</td>
                        <td className="py-3 text-foreground">{p.email}</td>
                        <td className="py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent analyses */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Recent Analyses</h2>
            {loading ? (
              <p className="py-8 text-center text-muted-foreground">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Date</th>
                      <th className="pb-3 font-medium text-muted-foreground">File</th>
                      <th className="pb-3 font-medium text-muted-foreground">Result</th>
                      <th className="pb-3 font-medium text-muted-foreground">Conf.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.slice(0, 20).map((a) => (
                      <tr key={a.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 text-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                        <td className="py-3 text-foreground">{a.original_filename}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            a.prediction === "Pneumonia" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                          }`}>
                            {a.prediction === "Pneumonia" ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                            {a.prediction}
                          </span>
                        </td>
                        <td className="py-3 text-foreground">{Number(a.confidence).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
