import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Shield, LogOut, ArrowLeft, BarChart3, TrendingUp, Activity, FileImage, Layers } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";

interface AnalysisRecord {
  id: string;
  modality?: string;
  prediction: string;
  confidence: number;
  created_at: string;
}

// Deterministic color per class label — supports both X-ray and CT classes and falls back to a rotating palette.
const KNOWN_COLORS: Record<string, string> = {
  Normal: "hsl(152 60% 42%)",
  Bacterial: "hsl(0 72% 55%)",
  Viral: "hsl(35 90% 55%)",
  Adenocarcinoma: "hsl(350 75% 55%)",
  "Large Cell Carcinoma": "hsl(280 65% 55%)",
  "Squamous Cell Carcinoma": "hsl(18 85% 55%)",
  Pneumonia: "hsl(0 72% 55%)",
  "COVID-19": "hsl(280 65% 55%)",
  Covid: "hsl(280 65% 55%)",
  Tuberculosis: "hsl(35 90% 55%)",
  Invalid: "hsl(45 90% 48%)",
};
const PALETTE = ["hsl(210 80% 55%)", "hsl(340 70% 55%)", "hsl(45 85% 55%)", "hsl(170 60% 45%)", "hsl(260 60% 60%)"];
const colorFor = (label: string, idx: number) => KNOWN_COLORS[label] ?? PALETTE[idx % PALETTE.length];

const Analytics = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [modalityFilter, setModalityFilter] = useState<"all" | "xray" | "ct">("all");

  useEffect(() => {
    if (!user) return;
    supabase.from("analyses").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) setAnalyses(data as AnalysisRecord[]);
    });
  }, [user]);

  const filteredAnalyses = useMemo(() => {
    if (modalityFilter === "all") return analyses;
    return analyses.filter((a) => (a.modality ?? "xray") === modalityFilter);
  }, [analyses, modalityFilter]);

  const xrayTotal = useMemo(() => analyses.filter((a) => (a.modality ?? "xray") === "xray").length, [analyses]);
  const ctTotal = useMemo(() => analyses.filter((a) => a.modality === "ct").length, [analyses]);

  const total = filteredAnalyses.length;
  const avgConf = total ? (filteredAnalyses.reduce((s, a) => s + Number(a.confidence), 0) / total).toFixed(1) : "0";

  // Dynamic class aggregation — every distinct prediction becomes its own class.
  const classCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredAnalyses.forEach(a => map.set(a.prediction, (map.get(a.prediction) ?? 0) + 1));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredAnalyses]);

  const abnormal = useMemo(
    () => filteredAnalyses.filter(a => a.prediction !== "Normal" && a.prediction !== "Invalid").length,
    [filteredAnalyses]
  );

  // Monthly trend across every class
  const trendData = useMemo(() => {
    const monthly: Record<string, Record<string, number | string>> = {};
    filteredAnalyses.forEach(a => {
      const m = new Date(a.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (!monthly[m]) monthly[m] = { month: m };
      monthly[m][a.prediction] = ((monthly[m][a.prediction] as number) ?? 0) + 1;
    });
    return Object.values(monthly).slice(-6);
  }, [filteredAnalyses]);

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
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground flex items-center gap-2"><BarChart3 className="h-7 w-7 text-secondary" />Analytics</h1>
            <p className="text-muted-foreground">Multi-class insights across Chest X-ray (Pneumonia) and Chest CT (Lung-Cancer Subtypes) diagnoses.</p>
          </div>
          <div role="group" aria-label="Modality analytics filter" className="inline-flex rounded-lg border border-border bg-card p-1 text-xs shadow-sm">
            <button
              type="button"
              onClick={() => setModalityFilter("all")}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                modalityFilter === "all" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Modalities ({analyses.length})
            </button>
            <button
              type="button"
              onClick={() => setModalityFilter("xray")}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                modalityFilter === "xray" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Chest X-ray ({xrayTotal})
            </button>
            <button
              type="button"
              onClick={() => setModalityFilter("ct")}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                modalityFilter === "ct" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Chest CT ({ctTotal})
            </button>
          </div>
        </motion.div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Scans", value: total, sub: `${xrayTotal} X-ray · ${ctTotal} CT`, icon: FileImage, color: "text-secondary" },
            { label: "Distinct Classes", value: classCounts.length, sub: "Active diagnostic labels", icon: Layers, color: "text-info" },
            { label: "Abnormal Findings", value: abnormal, sub: "Non-normal classifications", icon: Activity, color: "text-destructive" },
            { label: "Avg. Confidence", value: `${avgConf}%`, sub: "Mean model probability", icon: TrendingUp, color: "text-success" },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Per-class summary strip */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Diagnoses by Class</h2>
          {classCounts.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No data yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classCounts.map((c, i) => {
                const pct = total ? ((c.value / total) * 100).toFixed(1) : "0";
                return (
                  <div key={c.name} className="rounded-lg border border-border/60 bg-muted/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ background: colorFor(c.name, i) }} />
                        <span className="font-medium text-foreground">{c.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{pct}%</span>
                    </div>
                    <p className="font-display text-2xl font-bold text-foreground">{c.value}</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/50">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colorFor(c.name, i) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Monthly Predictions (all classes)</h2>
            {trendData.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  {classCounts.map((c, i) => (
                    <Line key={c.name} type="monotone" dataKey={c.name} stroke={colorFor(c.name, i)} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Class Distribution</h2>
            {total === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={classCounts} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} label>
                    {classCounts.map((c, i) => <Cell key={c.name} fill={colorFor(c.name, i)} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Volume by Class</h2>
            {classCounts.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={classCounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {classCounts.map((c, i) => <Cell key={c.name} fill={colorFor(c.name, i)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
