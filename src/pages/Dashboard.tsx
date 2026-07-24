import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Upload, LogOut, FileImage, AlertTriangle, CheckCircle2, Loader2, X, History, Settings, User, Users, BarChart3, Download, Database, ScrollText, Share2, MessageCircle, Mail, Link2, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateReport } from "@/lib/report";

interface AnalysisResult {
  prediction: string;
  confidence: number;
  findings: string;
  timestamp: string;
  classProbabilities?: Record<string, number>;
  heatmapDataUrl?: string;
  modelUsed?: string;
}

interface AnalysisRecord {
  id: string;
  prediction: string;
  confidence: number;
  original_filename: string;
  model_used: string;
  created_at: string;
}

interface PatientRow {
  id: string;
  patient_name: string;
  age: number | null;
  gender: string | null;
  notes: string | null;
}

interface PatientDraft {
  patient_name: string;
  age: string;
  gender: string;
  notes: string;
}

const emptyPatient: PatientDraft = { patient_name: "", age: "", gender: "", notes: "" };

const getResultStyle = (prediction: string) => {
  if (prediction === "Normal") return { icon: CheckCircle2, iconClass: "text-success", boxClass: "border-success/20 bg-success/10" };
  if (prediction === "Invalid") return { icon: AlertTriangle, iconClass: "text-warning", boxClass: "border-warning/20 bg-warning/10" };
  return { icon: AlertTriangle, iconClass: "text-destructive", boxClass: "border-destructive/20 bg-destructive/10" };
};

const Dashboard = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);

  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [newPatient, setNewPatient] = useState<PatientDraft>(emptyPatient);
  const [activePatient, setActivePatient] = useState<PatientRow | null>(null);

  useEffect(() => {
    fetchHistory();
    fetchProfile();
    fetchPatients();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("full_name, email").eq("user_id", user.id).maybeSingle();
    if (data) setProfile(data);
  };

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase.from("analyses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    if (data) setHistory(data);
  };

  const fetchPatients = async () => {
    if (!user) return;
    const { data } = await supabase.from("patients").select("id, patient_name, age, gender, notes").order("created_at", { ascending: false });
    if (data) setPatients(data as PatientRow[]);
  };

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
    setSelectedFile(file);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const resolvePatient = async (): Promise<PatientRow | null> => {
    if (patientMode === "existing") {
      if (!selectedPatientId) return null;
      return patients.find((p) => p.id === selectedPatientId) ?? null;
    }
    if (!newPatient.patient_name.trim()) return null;
    const { data, error } = await supabase.from("patients").insert({
      patient_name: newPatient.patient_name.trim(),
      age: newPatient.age ? parseInt(newPatient.age, 10) : null,
      gender: newPatient.gender || null,
      notes: newPatient.notes || null,
      created_by: user!.id,
    }).select().maybeSingle();
    if (error || !data) { toast.error("Could not save patient: " + (error?.message || "unknown")); return null; }
    await fetchPatients();
    setPatientMode("existing");
    setSelectedPatientId(data.id);
    setNewPatient(emptyPatient);
    return data as PatientRow;
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !user) return;

    const patient = await resolvePatient();
    if (!patient) {
      toast.error(patientMode === "existing" ? "Select a patient for this scan" : "Enter the patient's name");
      return;
    }
    setActivePatient(patient);
    setIsAnalyzing(true);

    try {
      const filePath = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage.from("xray-images").upload(filePath, selectedFile);
      if (uploadError) throw new Error("Failed to upload image: " + uploadError.message);

      const apiUrl = import.meta.env.VITE_MEDVISION_API_URL || "http://localhost:8000";
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetch(`${apiUrl}/predict`, { method: "POST", body: formData });
      if (!response.ok) throw new Error("Model analysis failed. Is the backend server running?");

      const modelResult = await response.json();
      const findings = `Model classified this scan as ${modelResult.prediction} with ${modelResult.confidence}% confidence for patient ${patient.patient_name}.`;
      const modelUsed = modelResult.model_used || "MobileNetV2 (3-class, fine-tuned)";

      const { error: insertError } = await supabase.from("analyses").insert({
        user_id: user.id,
        patient_id: patient.id,
        image_path: filePath,
        original_filename: selectedFile.name,
        prediction: modelResult.prediction,
        confidence: modelResult.confidence,
        findings,
        model_used: modelUsed,
      });
      if (insertError) console.error("DB insert error:", insertError);

      setResult({
        prediction: modelResult.prediction,
        confidence: modelResult.confidence,
        findings,
        timestamp: new Date().toLocaleString(),
        classProbabilities: modelResult.class_probabilities,
        heatmapDataUrl: modelResult.heatmap_base64 ? `data:image/png;base64,${modelResult.heatmap_base64}` : undefined,
        modelUsed,
      });
      fetchHistory();
      toast.success("Analysis complete");
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast.error(err.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearSelection = () => { setSelectedFile(null); setPreview(null); setResult(null); };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const buildShareText = () => {
    if (!result || !activePatient) return "";
    const probs = result.classProbabilities
      ? "\n" + Object.entries(result.classProbabilities).map(([k, v]) => `• ${k}: ${Number(v).toFixed(1)}%`).join("\n")
      : "";
    return `🩺 *MedVision Diagnostic Report*
Patient: ${activePatient.patient_name}${activePatient.age ? ` (${activePatient.age}${activePatient.gender ? ", " + activePatient.gender : ""})` : ""}
Practitioner: ${profile?.full_name || user?.email || "—"}
Date: ${result.timestamp}

Diagnosis: *${result.prediction}*
Confidence: ${Number(result.confidence).toFixed(1)}%${probs}

Findings: ${result.findings}

Model: ${result.modelUsed}
— Generated by MedVision (AI-assisted, not a substitute for professional medical diagnosis)`;
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(buildShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`MedVision Report — ${activePatient?.patient_name || "Patient"}`);
    const body = encodeURIComponent(buildShareText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareNative = async () => {
    const text = buildShareText();
    if (navigator.share) {
      try { await navigator.share({ title: "MedVision Report", text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Report copied to clipboard");
    }
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(buildShareText());
    toast.success("Report summary copied");
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
            <Button variant={showHistory ? "default" : "ghost"} size="sm" onClick={() => setShowHistory(!showHistory)} className={showHistory ? "bg-secondary text-secondary-foreground" : ""}>
              <History className="mr-2 h-4 w-4" />History
            </Button>
            <Button variant="ghost" size="sm" asChild><Link to="/patients"><Users className="mr-2 h-4 w-4" />Patients</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/analytics"><BarChart3 className="mr-2 h-4 w-4" />Analytics</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/records"><Database className="mr-2 h-4 w-4" />Records</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/audit"><ScrollText className="mr-2 h-4 w-4" />Audit</Link></Button>
            {userRole === "admin" && (
              <Button variant="ghost" size="sm" asChild><Link to="/admin"><Settings className="mr-2 h-4 w-4" />Admin</Link></Button>
            )}
            <Button variant="ghost" size="sm" asChild><Link to="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></Button>
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="hidden text-foreground sm:inline">{profile?.full_name || user?.email}</span>
              <span className="rounded bg-secondary/20 px-1.5 py-0.5 text-xs capitalize text-secondary">{userRole?.replace("_", " ") || "user"}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">X-Ray Analysis</h1>
          <p className="mb-8 text-muted-foreground">Register the patient, upload their chest X-ray, and get a 3-class AI diagnosis with Grad-CAM explainability.</p>
        </motion.div>

        {showHistory ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Case History</h2>
            {history.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No analyses yet. Upload an X-ray to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Date</th>
                      <th className="pb-3 font-medium text-muted-foreground">File</th>
                      <th className="pb-3 font-medium text-muted-foreground">Result</th>
                      <th className="pb-3 font-medium text-muted-foreground">Confidence</th>
                      <th className="pb-3 font-medium text-muted-foreground">Model</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => {
                      const s = getResultStyle(record.prediction);
                      const Icon = s.icon;
                      return (
                        <tr key={record.id} className="border-b border-border/50 last:border-0">
                          <td className="py-3 text-foreground">{new Date(record.created_at).toLocaleDateString()}</td>
                          <td className="py-3 text-foreground">{record.original_filename}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.boxClass} ${s.iconClass}`}>
                              <Icon className="h-3 w-3" />{record.prediction}
                            </span>
                          </td>
                          <td className="py-3 text-foreground">{Number(record.confidence).toFixed(1)}%</td>
                          <td className="py-3 text-muted-foreground">{record.model_used}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left column: patient + upload */}
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-card-foreground">Patient Details</h2>
                  <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs">
                    <button
                      onClick={() => setPatientMode("existing")}
                      className={`rounded-md px-3 py-1 font-medium transition-colors ${patientMode === "existing" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                    >
                      Existing
                    </button>
                    <button
                      onClick={() => setPatientMode("new")}
                      className={`rounded-md px-3 py-1 font-medium transition-colors ${patientMode === "new" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                    >
                      <UserPlus className="mr-1 inline h-3 w-3" />New
                    </button>
                  </div>
                </div>

                {patientMode === "existing" ? (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Select patient for this scan</Label>
                    <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                      <SelectTrigger><SelectValue placeholder={patients.length ? "Choose a patient…" : "No patients yet — add one"} /></SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.patient_name}{p.age ? ` · ${p.age}${p.gender ? " " + p.gender : ""}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!patients.length && (
                      <p className="text-xs text-muted-foreground">Switch to <span className="font-medium">New</span> to register the patient inline.</p>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">Full name *</Label>
                      <Input value={newPatient.patient_name} onChange={(e) => setNewPatient({ ...newPatient, patient_name: e.target.value })} placeholder="e.g. Jane Doe" maxLength={120} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Age</Label>
                      <Input type="number" min={0} max={150} value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} placeholder="e.g. 34" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Gender</Label>
                      <Select value={newPatient.gender} onValueChange={(v) => setNewPatient({ ...newPatient, gender: v })}>
                        <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs text-muted-foreground">Clinical notes</Label>
                      <Textarea rows={2} value={newPatient.notes} onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })} placeholder="Symptoms, referring physician, prior conditions…" maxLength={1000} />
                    </div>
                  </div>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Upload X-Ray</h2>
                {!preview ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors ${dragOver ? "border-secondary bg-secondary/5" : "border-border"}`}
                  >
                    <Upload className={`mb-4 h-10 w-10 ${dragOver ? "text-secondary" : "text-muted-foreground"}`} />
                    <p className="mb-2 text-sm font-medium text-foreground">Drag & drop your X-ray image</p>
                    <p className="mb-4 text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                    <label>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                      <span className="cursor-pointer rounded-lg bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/20">Browse Files</span>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <button onClick={clearSelection} className="absolute -right-2 -top-2 z-10 rounded-full bg-destructive p-1 text-destructive-foreground shadow-md">
                      <X className="h-4 w-4" />
                    </button>
                    <div className="overflow-hidden rounded-lg border border-border">
                      <img src={preview} alt="Uploaded X-ray" className="h-64 w-full object-contain bg-foreground/5" />
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <FileImage className="h-4 w-4" />
                      <span className="truncate">{selectedFile?.name}</span>
                    </div>
                    <Button onClick={handleAnalyze} disabled={isAnalyzing} className="mt-4 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      {isAnalyzing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>) : "Analyze X-Ray"}
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right column: results */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Analysis Results</h2>
              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="mb-4 h-12 w-12 animate-spin text-secondary" />
                    <p className="mb-2 font-medium text-foreground">Processing X-Ray</p>
                    <p className="mb-4 text-sm text-muted-foreground">Running 3-class inference & Grad-CAM…</p>
                    <Progress value={66} className="w-48" />
                  </motion.div>
                ) : result ? (
                  <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                    {activePatient && (
                      <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Report for</p>
                        <p className="font-medium text-foreground">{activePatient.patient_name}
                          {activePatient.age ? <span className="text-muted-foreground"> · {activePatient.age}{activePatient.gender ? ` ${activePatient.gender}` : ""}</span> : null}
                        </p>
                      </div>
                    )}

                    {(() => {
                      const style = getResultStyle(result.prediction);
                      const StyleIcon = style.icon;
                      return (
                        <div className={`flex items-center gap-4 rounded-lg border p-4 ${style.boxClass}`}>
                          <StyleIcon className={`h-8 w-8 ${style.iconClass}`} />
                          <div>
                            <p className="font-display text-xl font-bold text-foreground">{result.prediction}</p>
                            <p className="text-sm text-muted-foreground">{result.findings}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {result.prediction !== "Invalid" && (
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Confidence Score</span>
                          <span className="font-display font-semibold text-foreground">{result.confidence}%</span>
                        </div>
                        <Progress value={result.confidence} className="h-3" />
                      </div>
                    )}

                    {result.prediction !== "Invalid" && result.classProbabilities && (
                      <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                        <p className="mb-2 text-sm font-medium text-foreground">Class Breakdown (3-class)</p>
                        {Object.entries(result.classProbabilities).map(([className, prob]) => (
                          <div key={className} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{className}</span>
                              <span className="text-foreground">{Number(prob).toFixed(1)}%</span>
                            </div>
                            <Progress value={prob} className="h-1.5" />
                          </div>
                        ))}
                      </div>
                    )}

                    {result.prediction !== "Invalid" && result.heatmapDataUrl && (
                      <div>
                        <p className="mb-2 text-sm font-medium text-foreground">Grad-CAM Heatmap</p>
                        <p className="mb-2 text-xs text-muted-foreground">Highlighted regions show what most influenced the model's prediction.</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <img src={preview ?? ""} alt="Original X-ray" className="w-full rounded-lg border border-border object-contain bg-foreground/5" />
                            <p className="mt-1 text-center text-xs text-muted-foreground">Original</p>
                          </div>
                          <div>
                            <img src={result.heatmapDataUrl} alt="Grad-CAM heatmap" className="w-full rounded-lg border border-border object-contain bg-foreground/5" />
                            <p className="mt-1 text-center text-xs text-muted-foreground">Heatmap</p>
                          </div>
                        </div>

                        {/* Explanation panel — teaches the clinician what the colors mean */}
                        <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-xs">
                          <p className="font-medium text-foreground">How to read this heatmap</p>
                          <p className="text-muted-foreground">
                            This overlay implies that the highlighted areas of the lung are the regions the AI focused on when arriving at a <span className="font-semibold text-foreground">{result.prediction}</span> diagnosis — in other words, <span className="italic">these portions are the affected / most influential parts</span> of the X-ray.
                          </p>
                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <span className="flex items-center gap-1.5">
                              <span className="inline-block h-3 w-6 rounded" style={{ background: "linear-gradient(90deg, #b91c1c, #ef4444)" }} />
                              <span className="text-foreground">Red / hot</span>
                              <span className="text-muted-foreground">— strongest evidence, most affected</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="inline-block h-3 w-6 rounded" style={{ background: "linear-gradient(90deg, #f59e0b, #fde047)" }} />
                              <span className="text-foreground">Yellow / warm</span>
                              <span className="text-muted-foreground">— moderate contribution</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="inline-block h-3 w-6 rounded" style={{ background: "linear-gradient(90deg, #1e3a8a, #3b82f6)" }} />
                              <span className="text-foreground">Blue / cool</span>
                              <span className="text-muted-foreground">— little to no influence</span>
                            </span>
                          </div>
                          {result.prediction === "Normal" ? (
                            <p className="text-muted-foreground">Because the diagnosis is <span className="font-semibold text-foreground">Normal</span>, the highlighted regions represent healthy lung fields the model verified rather than signs of disease.</p>
                          ) : (
                            <p className="text-muted-foreground">The hotter regions likely correspond to opacities, consolidations, or other patterns consistent with <span className="font-semibold text-foreground">{result.prediction}</span>. Always correlate with clinical findings.</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Model</span><span className="text-foreground">{result.modelUsed}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Timestamp</span><span className="text-foreground">{result.timestamp}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Image</span><span className="truncate text-foreground">{selectedFile?.name}</span></div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => result && generateReport({
                          prediction: result.prediction,
                          confidence: result.confidence,
                          findings: result.findings,
                          timestamp: result.timestamp,
                          filename: selectedFile?.name || "xray.jpg",
                          imageDataUrl: preview,
                          heatmapDataUrl: result.heatmapDataUrl,
                          classProbabilities: result.classProbabilities,
                          patientName: activePatient?.patient_name,
                          patientAge: activePatient?.age ?? undefined,
                          patientGender: activePatient?.gender ?? undefined,
                          patientNotes: activePatient?.notes ?? undefined,
                          practitioner: profile?.full_name || user?.email,
                          modelUsed: result.modelUsed,
                        })}
                      >
                        <Download className="mr-2 h-4 w-4" /> Download Full PDF Report
                      </Button>

                      <div className="rounded-lg border border-border bg-muted/30 p-3">
                        <p className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Share2 className="h-3.5 w-3.5" /> Share this report
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <Button size="sm" variant="secondary" onClick={shareWhatsApp} className="bg-[#25D366] text-white hover:bg-[#20b558]">
                            <MessageCircle className="mr-1 h-4 w-4" />WhatsApp
                          </Button>
                          <Button size="sm" variant="outline" onClick={shareEmail}><Mail className="mr-1 h-4 w-4" />Email</Button>
                          <Button size="sm" variant="outline" onClick={shareNative}><Share2 className="mr-1 h-4 w-4" />Share…</Button>
                          <Button size="sm" variant="outline" onClick={copyText}><Link2 className="mr-1 h-4 w-4" />Copy</Button>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">⚠️ This is an AI-assisted analysis and should not replace professional medical diagnosis.</p>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
                    <FileImage className="mb-4 h-12 w-12 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Enter patient details, upload an X-ray, and analyze to see the full report here.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
