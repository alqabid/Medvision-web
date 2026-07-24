import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Shield, LogOut, ArrowLeft, BarChart3, TrendingUp, Activity, FileImage } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";

interface AnalysisRecord {
  id: string;
  prediction: string;
  confidence: number;
  created_at: string;
}

// Deterministic color per class label — falls back to a rotating palette for unknown classes.
const KNOWN_COLORS: Record<string, string> = {
  Normal: "hsl(152 60% 42%)",
  Pneumonia: "hsl(0 72% 55%)",
  "COVID-19": "hsl(280 65% 55%)",
  Covid: "hsl(280 65% 55%)",
  Tuberculosis: "hsl(35 90% 55%)",
  Invalid: "hsl(220 10% 55%)",
};
const PALETTE = ["hsl(210 80% 55%)", "hsl(340 70% 55%)", "hsl(45 85% 55%)", "hsl(170 60% 45%)", "hsl(260 60% 60%)"];
const colorFor = (label: string, idx: number) => KNOWN_COLORS[label] ?? PALETTE[idx % PALETTE.length];

const Analytics = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("analyses").select("id, prediction, confidence, created_at").eq("user_id", user.id).then(({ data }) => {
      if (data) setAnalyses(data as AnalysisRecord[]);
    });
  }, [user]);

  const total = analyses.length;
  const avgConf = total ? (analyses.reduce((s, a) => s + Number(a.confidence), 0) / total).toFixed(1) : "0";

  // Dynamic class aggregation — every distinct prediction becomes its own class.
  const classCounts = useMemo(() => {
    const map = new Map<string, number>();
    analyses.forEach(a => map.set(a.prediction, (map.get(a.prediction) ?? 0) + 1));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [analyses]);

  const abnormal = useMemo(
    () => analyses.filter(a => a.prediction !== "Normal" && a.prediction !== "Invalid").length,
    [analyses]
  );

  // Monthly trend across every class
  const trendData = useMemo(() => {
    const monthly: Record<string, Record<string, number | string>> = {};
    analyses.forEach(a => {
      const m = new Date(a.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (!monthly[m]) monthly[m] = { month: m };
      monthly[m][a.prediction] = ((monthly[m][a.prediction] as number) ?? 0) + 1;
    });
    return Object.values(monthly).slice(-6);
  }, [analyses]);

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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground flex items-center gap-2"><BarChart3 className="h-7 w-7 text-secondary" />Analytics</h1>
          <p className="text-muted-foreground">Multi-class insights across every diagnosis your model has produced.</p>
        </motion.div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Scans", value: total, icon: FileImage, color: "text-secondary" },
            { label: "Distinct Classes", value: classCounts.length, icon: BarChart3, color: "text-info" },
            { label: "Abnormal Findings", value: abnormal, icon: Activity, color: "text-destructive" },
            { label: "Avg. Confidence", value: `${avgConf}%`, icon: TrendingUp, color: "text-success" },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">{stat.value}</p>
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
