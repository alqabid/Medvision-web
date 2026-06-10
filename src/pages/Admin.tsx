import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield, Users, FileImage, BarChart3, AlertTriangle, CheckCircle2,
  LogOut, ArrowLeft, Cpu, Stethoscope, Settings as SettingsIcon,
  Plus, Trash2, Save,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ProfileRecord { id: string; full_name: string; email: string; created_at: string; user_id: string; }
interface AnalysisRecord { id: string; prediction: string; confidence: number; original_filename: string; model_used: string; created_at: string; user_id: string; }
interface AiModel { id: string; name: string; provider: string; endpoint: string | null; model_identifier: string | null; api_key_secret_name: string | null; is_active: boolean; is_default: boolean; notes: string | null; }
interface Disease { id: string; name: string; description: string | null; severity: string; is_active: boolean; }
interface RoleRow { user_id: string; role: string; }

const Admin = () => {
  const { userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [models, setModels] = useState<AiModel[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // new model form
  const [newModel, setNewModel] = useState<Partial<AiModel>>({
    name: "", provider: "custom", endpoint: "", model_identifier: "",
    api_key_secret_name: "", is_active: true, is_default: false, notes: "",
  });
  // new disease form
  const [newDisease, setNewDisease] = useState<Partial<Disease>>({
    name: "", description: "", severity: "moderate", is_active: true,
  });

  useEffect(() => {
    if (userRole && userRole !== "admin") {
      navigate("/dashboard");
      return;
    }
    if (userRole === "admin") fetchAll();
  }, [userRole]);

  const fetchAll = async () => {
    setLoading(true);
    const [p, a, m, d, r] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("analyses").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("ai_models").select("*").order("created_at", { ascending: false }),
      supabase.from("diseases").select("*").order("name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (p.data) setProfiles(p.data as any);
    if (a.data) setAnalyses(a.data as any);
    if (m.data) setModels(m.data as any);
    if (d.data) setDiseases(d.data as any);
    if (r.data) {
      const map: Record<string, string> = {};
      (r.data as RoleRow[]).forEach((x) => { map[x.user_id] = x.role; });
      setRoles(map);
    }
    setLoading(false);
  };

  // ---- AI Models ----
  const addModel = async () => {
    if (!newModel.name) return toast({ title: "Name required", variant: "destructive" });
    const { error } = await supabase.from("ai_models").insert(newModel as any);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Model added" });
    setNewModel({ name: "", provider: "custom", endpoint: "", model_identifier: "", api_key_secret_name: "", is_active: true, is_default: false, notes: "" });
    fetchAll();
  };
  const toggleModel = async (id: string, field: "is_active" | "is_default", value: boolean) => {
    await supabase.from("ai_models").update({ [field]: value }).eq("id", id);
    fetchAll();
  };
  const deleteModel = async (id: string) => {
    await supabase.from("ai_models").delete().eq("id", id);
    toast({ title: "Model removed" });
    fetchAll();
  };

  // ---- Diseases ----
  const addDisease = async () => {
    if (!newDisease.name) return toast({ title: "Name required", variant: "destructive" });
    const { error } = await supabase.from("diseases").insert(newDisease as any);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Disease added" });
    setNewDisease({ name: "", description: "", severity: "moderate", is_active: true });
    fetchAll();
  };
  const toggleDisease = async (id: string, value: boolean) => {
    await supabase.from("diseases").update({ is_active: value }).eq("id", id);
    fetchAll();
  };
  const deleteDisease = async (id: string) => {
    await supabase.from("diseases").delete().eq("id", id);
    toast({ title: "Disease removed" });
    fetchAll();
  };

  // ---- Roles ----
  const updateRole = async (userId: string, role: "admin" | "medical_practitioner" | "authorized_user") => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role } as any);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Role updated" });
    fetchAll();
  };

  // ---- Analyses ----
  const deleteAnalysis = async (id: string) => {
    await supabase.from("analyses").delete().eq("id", id);
    toast({ title: "Record deleted" });
    fetchAll();
  };

  const totalAnalyses = analyses.length;
  const pneumoniaCases = analyses.filter(a => a.prediction === "Pneumonia").length;
  const avgConfidence = analyses.length > 0
    ? (analyses.reduce((s, a) => s + Number(a.confidence), 0) / analyses.length).toFixed(1)
    : "0";

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  if (userRole && userRole !== "admin") return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-secondary" />
            <span className="font-display text-lg font-bold text-foreground">MedVision <span className="text-xs font-normal text-muted-foreground">/ Admin</span></span>
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
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Admin Portal</h1>
          <p className="mb-8 text-muted-foreground">Manage users, AI models, diseases, and system configuration.</p>
        </motion.div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Users", value: profiles.length, icon: Users, color: "text-secondary" },
            { label: "Total Analyses", value: totalAnalyses, icon: FileImage, color: "text-info" },
            { label: "Pneumonia Detected", value: pneumoniaCases, icon: AlertTriangle, color: "text-destructive" },
            { label: "Avg. Confidence", value: `${avgConfidence}%`, icon: BarChart3, color: "text-success" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Users</TabsTrigger>
            <TabsTrigger value="models"><Cpu className="mr-2 h-4 w-4" />AI Models</TabsTrigger>
            <TabsTrigger value="diseases"><Stethoscope className="mr-2 h-4 w-4" />Diseases</TabsTrigger>
            <TabsTrigger value="records"><FileImage className="mr-2 h-4 w-4" />Records</TabsTrigger>
          </TabsList>

          {/* USERS */}
          <TabsContent value="users" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Registered Users & Roles</h2>
              {loading ? <p className="py-8 text-center text-muted-foreground">Loading...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Name</th>
                      <th className="pb-3 font-medium text-muted-foreground">Email</th>
                      <th className="pb-3 font-medium text-muted-foreground">Joined</th>
                      <th className="pb-3 font-medium text-muted-foreground">Role</th>
                    </tr></thead>
                    <tbody>
                      {profiles.map((p) => (
                        <tr key={p.id} className="border-b border-border/50 last:border-0">
                          <td className="py-3 text-foreground">{p.full_name || "N/A"}</td>
                          <td className="py-3 text-foreground">{p.email}</td>
                          <td className="py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="py-3">
                            <Select value={roles[p.user_id] || "authorized_user"} onValueChange={(v) => updateRole(p.user_id, v as any)}>
                              <SelectTrigger className="h-8 w-[200px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="medical_practitioner">Medical Practitioner</SelectItem>
                                <SelectItem value="authorized_user">Authorized User</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* AI MODELS */}
          <TabsContent value="models" className="mt-6 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-semibold">Add AI Model / API</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Name</Label><Input value={newModel.name || ""} onChange={(e) => setNewModel({ ...newModel, name: e.target.value })} placeholder="e.g. CheXNet v2" /></div>
                <div><Label>Provider</Label>
                  <Select value={newModel.provider} onValueChange={(v) => setNewModel({ ...newModel, provider: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lovable">Lovable AI</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="huggingface">HuggingFace</SelectItem>
                      <SelectItem value="custom">Custom Endpoint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Model Identifier</Label><Input value={newModel.model_identifier || ""} onChange={(e) => setNewModel({ ...newModel, model_identifier: e.target.value })} placeholder="google/gemini-2.5-flash" /></div>
                <div><Label>Endpoint URL (optional)</Label><Input value={newModel.endpoint || ""} onChange={(e) => setNewModel({ ...newModel, endpoint: e.target.value })} placeholder="https://api.example.com/predict" /></div>
                <div><Label>API Key Secret Name</Label><Input value={newModel.api_key_secret_name || ""} onChange={(e) => setNewModel({ ...newModel, api_key_secret_name: e.target.value })} placeholder="MY_MODEL_API_KEY" /></div>
                <div className="flex items-end gap-6">
                  <div className="flex items-center gap-2"><Switch checked={!!newModel.is_active} onCheckedChange={(v) => setNewModel({ ...newModel, is_active: v })} /><Label>Active</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={!!newModel.is_default} onCheckedChange={(v) => setNewModel({ ...newModel, is_default: v })} /><Label>Default</Label></div>
                </div>
                <div className="md:col-span-2"><Label>Notes</Label><Textarea value={newModel.notes || ""} onChange={(e) => setNewModel({ ...newModel, notes: e.target.value })} /></div>
              </div>
              <Button onClick={addModel} className="mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/90"><Plus className="mr-2 h-4 w-4" />Add Model</Button>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-semibold">Registered Models</h2>
              <div className="space-y-3">
                {models.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/40 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{m.name}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{m.provider}</span>
                        {m.is_default && <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-xs text-secondary">default</span>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground truncate">{m.model_identifier || m.endpoint || "—"}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2"><Switch checked={m.is_active} onCheckedChange={(v) => toggleModel(m.id, "is_active", v)} /><span className="text-xs text-muted-foreground">Active</span></div>
                      <div className="flex items-center gap-2"><Switch checked={m.is_default} onCheckedChange={(v) => toggleModel(m.id, "is_default", v)} /><span className="text-xs text-muted-foreground">Default</span></div>
                      <Button variant="ghost" size="icon" onClick={() => deleteModel(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
                {models.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No models configured.</p>}
              </div>
            </div>
          </TabsContent>

          {/* DISEASES */}
          <TabsContent value="diseases" className="mt-6 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-semibold">Add Disease / Condition</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Name</Label><Input value={newDisease.name || ""} onChange={(e) => setNewDisease({ ...newDisease, name: e.target.value })} /></div>
                <div><Label>Severity</Label>
                  <Select value={newDisease.severity} onValueChange={(v) => setNewDisease({ ...newDisease, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2"><Label>Description</Label><Textarea value={newDisease.description || ""} onChange={(e) => setNewDisease({ ...newDisease, description: e.target.value })} /></div>
              </div>
              <Button onClick={addDisease} className="mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/90"><Plus className="mr-2 h-4 w-4" />Add Disease</Button>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-semibold">Classifiable Conditions</h2>
              <div className="space-y-3">
                {diseases.map((d) => (
                  <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/40 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{d.name}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{d.severity}</span>
                      </div>
                      {d.description && <p className="mt-1 text-xs text-muted-foreground">{d.description}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2"><Switch checked={d.is_active} onCheckedChange={(v) => toggleDisease(d.id, v)} /><span className="text-xs text-muted-foreground">Active</span></div>
                      <Button variant="ghost" size="icon" onClick={() => deleteDisease(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
                {diseases.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No diseases configured.</p>}
              </div>
            </div>
          </TabsContent>

          {/* RECORDS */}
          <TabsContent value="records" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-semibold">Recent Analyses</h2>
              {loading ? <p className="py-8 text-center text-muted-foreground">Loading...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Date</th>
                      <th className="pb-3 font-medium text-muted-foreground">File</th>
                      <th className="pb-3 font-medium text-muted-foreground">Result</th>
                      <th className="pb-3 font-medium text-muted-foreground">Conf.</th>
                      <th className="pb-3 font-medium text-muted-foreground">Model</th>
                      <th></th>
                    </tr></thead>
                    <tbody>
                      {analyses.slice(0, 50).map((a) => (
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
                          <td className="py-3 text-muted-foreground">{a.model_used}</td>
                          <td className="py-3 text-right"><Button variant="ghost" size="icon" onClick={() => deleteAnalysis(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
