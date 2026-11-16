import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Activity, FileImage, Layers } from "lucide-react";
import ClinicalShell from "@/components/ClinicalShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getLocalAnalyses } from "@/lib/localClinicalStore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";

interface AnalysisRecord {
  id: string;
  modality?: string;
  prediction: string;
  confidence: number;
  created_at: string;
}

// Deterministic color per class label: supports both X-ray and CT classes and falls back to a rotating palette.
const KNOWN_COLORS: Record<string, string> = {
  Normal: "hsl(161 78% 36%)",
  Bacterial: "hsl(0 74% 54%)",
  Viral: "hsl(38 92% 48%)",
  Adenocarcinoma: "hsl(348 78% 54%)",
  "Large Cell Carcinoma": "hsl(172 68% 34%)",
  "Squamous Cell Carcinoma": "hsl(18 85% 54%)",
  Pneumonia: "hsl(0 74% 54%)",
  "COVID-19": "hsl(280 65% 55%)",
  Covid: "hsl(280 65% 55%)",
  Tuberculosis: "hsl(35 90% 55%)",
  Invalid: "hsl(45 90% 48%)",
};
const PALETTE = ["hsl(161 78% 36%)", "hsl(340 70% 55%)", "hsl(45 85% 55%)", "hsl(170 60% 45%)", "hsl(195 65% 42%)"];
const colorFor = (label: string, idx: number) => KNOWN_COLORS[label] ?? PALETTE[idx % PALETTE.length];

const Analytics = () => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [modalityFilter, setModalityFilter] = useState<"all" | "xray" | "ct">("all");

  useEffect(() => {
    if (!user) return;
    const localItems = getLocalAnalyses(user.id);
    supabase.from("analyses").select("*").eq("user_id", user.id).then(({ data }) => {
      const remoteItems = (data as AnalysisRecord[]) || [];
      const seen = new Set(remoteItems.map((r) => r.id));
      setAnalyses([...remoteItems, ...localItems.filter((l) => !seen.has(l.id))]);
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

  const trendData = useMemo(() => {
    const monthly: Record<string, Record<string, number | string>> = {};
    filteredAnalyses.forEach(a => {
      const m = new Date(a.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (!monthly[m]) monthly[m] = { month: m };
      monthly[m][a.prediction] = ((monthly[m][a.prediction] as number) ?? 0) + 1;
    });
    return Object.values(monthly).slice(-6);
  }, [filteredAnalyses]);

  return (
    <ClinicalShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground flex items-center gap-2.5 sm:text-4xl">
            <BarChart3 className="h-8 w-8 text-secondary" />Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Multi-class diagnostic insights across Chest X-ray (Pneumonia) and Chest CT (Lung-Cancer Subtypes).
          </p>
        </div>
        <div role="group" aria-label="Modality analytics filter" className="inline-flex rounded-full border border-border/70 bg-card p-1 text-xs shadow-card">
          <button
            type="button"
            onClick={() => setModalityFilter("all")}
            className={`rounded-full px-4 py-1.5 font-semibold transition-all ${
              modalityFilter === "all" ? "bg-[#07221e] text-[#72f6d5] shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Modalities ({analyses.length})
          </button>
          <button
            type="button"
            onClick={() => setModalityFilter("xray")}
            className={`rounded-full px-4 py-1.5 font-semibold transition-all ${
              modalityFilter === "xray" ? "bg-[#07221e] text-[#72f6d5] shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Chest X-ray ({xrayTotal})
          </button>
          <button
            type="button"
            onClick={() => setModalityFilter("ct")}
            className={`rounded-full px-4 py-1.5 font-semibold transition-all ${
              modalityFilter === "ct" ? "bg-[#07221e] text-[#72f6d5] shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Chest CT ({ctTotal})
          </button>
        </div>
      </motion.div>

      <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Scans", value: total, sub: `${xrayTotal} X-ray · ${ctTotal} CT`, icon: FileImage, color: "text-secondary" },
          { label: "Distinct Classes", value: classCounts.length, sub: "Active diagnostic labels", icon: Layers, color: "text-info" },
          { label: "Abnormal Findings", value: abnormal, sub: "Non-normal classifications", icon: Activity, color: "text-destructive" },
          { label: "Avg. Confidence", value: `${avgConf}%`, sub: "Mean model probability", icon: TrendingUp, color: "text-success" },
        ].map(stat => (
          <div key={stat.label} className="clinical-surface p-5">
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
      <div className="mb-7 clinical-surface p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-card-foreground">Diagnoses by Class</h2>
        {classCounts.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No data yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classCounts.map((c, i) => {
              const pct = total ? ((c.value / total) * 100).toFixed(1) : "0";
              return (
                <div key={c.name} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: colorFor(c.name, i) }} />
                      <span className="font-semibold text-foreground">{c.name}</span>
                    </div>
                    <span className="font-mono text-sm text-muted-foreground">{pct}%</span>
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

      <div className="grid gap-7 lg:grid-cols-2">
        <div className="clinical-surface p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-card-foreground">Monthly Predictions (all classes)</h2>
          {trendData.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 16 }} />
                <Legend />
                {classCounts.map((c, i) => (
                  <Line key={c.name} type="monotone" dataKey={c.name} stroke={colorFor(c.name, i)} strokeWidth={2.5} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="clinical-surface p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-card-foreground">Class Distribution</h2>
          {total === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={classCounts} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} label>
                  {classCounts.map((c, i) => <Cell key={c.name} fill={colorFor(c.name, i)} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 16 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-2 clinical-surface p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-card-foreground">Volume by Class</h2>
          {classCounts.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={classCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 16 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {classCounts.map((c, i) => <Cell key={c.name} fill={colorFor(c.name, i)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </ClinicalShell>
  );
};

export default Analytics;
