import { useEffect, useState } from "react";
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
  const pneumonia = analyses.filter(a => a.prediction === "Pneumonia").length;
  const normal = analyses.filter(a => a.prediction === "Normal").length;
  const avgConf = total ? (analyses.reduce((s, a) => s + Number(a.confidence), 0) / total).toFixed(1) : "0";

  // Monthly trend
  const monthly: Record<string, { month: string; Pneumonia: number; Normal: number }> = {};
  analyses.forEach(a => {
    const m = new Date(a.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    if (!monthly[m]) monthly[m] = { month: m, Pneumonia: 0, Normal: 0 };
    if (a.prediction === "Pneumonia") monthly[m].Pneumonia++;
    else if (a.prediction === "Normal") monthly[m].Normal++;
  });
  const trendData = Object.values(monthly).slice(-6);

  const pieData = [
    { name: "Pneumonia", value: pneumonia },
    { name: "Normal", value: normal },
  ];
  const COLORS = ["hsl(0 72% 55%)", "hsl(152 60% 42%)"];

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
          <p className="text-muted-foreground">Insights into your X-ray analysis history.</p>
        </motion.div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Scans", value: total, icon: FileImage, color: "text-secondary" },
            { label: "Pneumonia Detected", value: pneumonia, icon: Activity, color: "text-destructive" },
            { label: "Normal Results", value: normal, icon: TrendingUp, color: "text-success" },
            { label: "Avg. Confidence", value: `${avgConf}%`, icon: BarChart3, color: "text-info" },
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

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Monthly Predictions</h2>
            {trendData.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Line type="monotone" dataKey="Pneumonia" stroke="hsl(0 72% 55%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="Normal" stroke="hsl(152 60% 42%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Prediction Distribution</h2>
            {total === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} label>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
