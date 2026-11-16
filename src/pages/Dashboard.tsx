import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Upload, LogOut, FileImage, AlertTriangle, CheckCircle2, Loader2, X,
  History, Settings, User, Users, BarChart3, Download, Database, ScrollText,
  Share2, MessageCircle, Mail, Link2, UserPlus, Info, Stethoscope, Layers,
  Activity, Sliders, Columns,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateReport, type ScanModality } from "@/lib/report";
import { stripImageMetadata } from "@/lib/stripImageMetadata";

interface AnalysisResult {
  modality: ScanModality;
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
  modality?: string;
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

const formatModalityLabel = (modality?: string) => (modality === "ct" ? "Chest CT" : "Chest X-ray");

const MODALITY_PROFILES: Record<
  ScanModality,
  {
    title: string;
    subtitle: string;
    architecture: string;
    classes: Array<{ name: string; detail: string }>;
  }
> = {
  xray: {
    title: "Chest X-ray · 3-Class Pneumonia Classifier",
    subtitle: "Evaluates AP/PA chest radiographs for lobar consolidation and interstitial infiltrates.",
    architecture: "MobileNetV2 (3-class · 224×224 RGB · Grad-CAM out_relu)",
    classes: [
      { name: "Bacterial", detail: "Focal lobar consolidation / air bronchograms" },
      { name: "Viral", detail: "Diffuse bilateral interstitial / perihilar pattern" },
      { name: "Normal", detail: "Clear lung fields & sharp costophrenic angles" },
    ],
  },
  ct: {
    title: "Chest CT · 4-Class Lung-Cancer Subtype Classifier",
    subtitle: "Evaluates axial thoracic CT slices for non-small cell carcinoma patterns vs. normal parenchyma.",
    architecture: "MobileNetV2 (4-class · 224×224 RGB · Grad-CAM out_relu)",
    classes: [
      { name: "Adenocarcinoma", detail: "Often peripheral nodules or ground-glass/solid masses" },
      { name: "Large Cell Carcinoma", detail: "Typically large peripheral masses with rapid growth" },
      { name: "Squamous Cell Carcinoma", detail: "Frequently central/hilar masses, may cavitate" },
      { name: "Normal", detail: "Unremarkable lung parenchyma & mediastinal contours" },
    ],
  },
};

const CLINICAL_GUIDANCE: Record<string, { summary: string; nextSteps: string[] }> = {
  Normal: {
    summary: "No high-confidence radiographic pattern of target pathology was detected in this scan.",
    nextSteps: [
      "Correlate with presenting symptoms, vital signs, and physical examination.",
      "If clinical suspicion persists despite a normal scan, consider follow-up imaging or specialist review.",
    ],
  },
  Bacterial: {
    summary: "Pattern is most consistent with bacterial pneumonia (typically focal lobar or segmental airspace consolidation).",
    nextSteps: [
      "Correlate with fever, leukocytosis, procalcitonin/CRP, and sputum Gram stain/culture.",
      "Evaluate guideline-concordant empiric antibiotic therapy and severity scoring (e.g. CURB-65 / PSI).",
    ],
  },
  Viral: {
    summary: "Pattern is most consistent with viral pneumonia (often bilateral interstitial or patchy perihilar opacities).",
    nextSteps: [
      "Correlate with viral respiratory panel (PCR/antigen) and pulse oximetry.",
      "Note: Model recall on Viral cases is lower than Bacterial due to training class imbalance; review borderline probabilities carefully.",
    ],
  },
  Adenocarcinoma: {
    summary: "CT slice features align most closely with pulmonary adenocarcinoma (the most common NSCLC subtype, frequently peripheral).",
    nextSteps: [
      "Refer for formal thoracic radiologist review and full volumetric CT / PET-CT staging.",
      "Consider tissue diagnosis (CT-guided core biopsy or bronchoscopy) and molecular profiling (EGFR, ALK, ROS1, PD-L1).",
    ],
  },
  "Large Cell Carcinoma": {
    summary: "CT slice features align most closely with large cell carcinoma (an undifferentiated NSCLC subtype often presenting as a bulky peripheral mass).",
    nextSteps: [
      "Arrange urgent multidisciplinary thoracic oncology and radiology evaluation.",
      "Correlate with contrast-enhanced staging imaging and histopathologic/immunohistochemical confirmation.",
    ],
  },
  "Squamous Cell Carcinoma": {
    summary: "CT slice features align most closely with squamous cell carcinoma (NSCLC subtype frequently arising centrally near major bronchi).",
    nextSteps: [
      "Recommend formal radiologist interpretation, bronchoscopy/biopsy evaluation, and complete TNM staging.",
      "Assess airway patency, smoking history, and multidisciplinary oncology workup.",
    ],
  },
  Invalid: {
    summary: "The uploaded file did not pass the grayscale medical scan pre-check and was not scored by the neural network.",
    nextSteps: [
      "Upload an uncolored, standard grayscale Chest X-ray or axial Chest CT slice in PNG or JPEG format.",
    ],
  },
};

const Dashboard = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [modality, setModality] = useState<ScanModality>("xray");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; email: string; hospital: string | null } | null>(null);

  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [newPatient, setNewPatient] = useState<PatientDraft>(emptyPatient);
  const [activePatient, setActivePatient] = useState<PatientRow | null>(null);

  // Interactive Grad-CAM viewer mode: side-by-side vs overlay blend
  const [heatmapView, setHeatmapView] = useState<"split" | "blend">("split");
  const [blendOpacity, setBlendOpacity] = useState<number>(65);

  // Backend health status per modality
  const [backendModalities, setBackendModalities] = useState<{ xray: boolean; ct: boolean } | null>(null);

  const scanLabel = formatModalityLabel(modality);
  const scanShortLabel = modality === "ct" ? "CT scan" : "X-ray";
  const modalityProfile = MODALITY_PROFILES[modality];

  useEffect(() => {
    fetchHistory();
    fetchProfile();
    fetchPatients();
    checkBackendHealth();
  }, [user]);

  const checkBackendHealth = async () => {
    try {
      const apiUrl = import.meta.env.VITE_MEDVISION_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/health`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.modalities) {
        setBackendModalities({
          xray: Boolean(data.modalities.xray),
          ct: Boolean(data.modalities.ct),
        });
      }
    } catch {
      // ignore offline health check on initial load
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("full_name, email, hospital").eq("user_id", user.id).maybeSingle();
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

  const handleModalityChange = (next: ScanModality) => {
    if (isAnalyzing || next === modality) return;
    setModality(next);
    setResult(null);
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
      // Strip any camera/EXIF metadata before uploading
      const cleanFile = await stripImageMetadata(selectedFile);

      // Upload image to storage
      const filePath = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("xray-images")
        .upload(filePath, cleanFile);
      if (uploadError) throw new Error("Failed to upload image: " + uploadError.message);

      const apiUrl = import.meta.env.VITE_MEDVISION_API_URL || "http://localhost:8000";
      const formData = new FormData();
      formData.append("file", cleanFile);
      formData.append("modality", modality);
      const response = await fetch(`${apiUrl}/predict`, { method: "POST", body: formData });
      if (!response.ok) {
        let detailMessage = "";
        try {
          const errPayload = await response.json();
          if (errPayload && typeof errPayload.detail === "string") {
            detailMessage = errPayload.detail;
          }
        } catch {
          // ignore JSON parse failure
        }
        throw new Error(detailMessage || "Model analysis failed. Is the backend server running?");
      }

      const modelResult = await response.json();
      const resolvedModality: ScanModality = modelResult.modality === "ct" ? "ct" : modality;
      const resolvedScanLabel = formatModalityLabel(resolvedModality);
      const findings = `Model classified this ${resolvedScanLabel.toLowerCase()} as ${modelResult.prediction} with ${modelResult.confidence}% confidence for patient ${patient.patient_name}.`;
      const modelUsed =
        modelResult.model_used ||
        (resolvedModality === "ct"
          ? "MobileNetV2 (4-class CT: Adenocarcinoma/Large Cell/Normal/Squamous Cell, fine-tuned)"
          : "MobileNetV2 (3-class: Bacterial/Normal/Viral, fine-tuned)");

      const { error: insertError } = await supabase.from("analyses").insert({
        user_id: user.id,
        patient_id: patient.id,
        image_path: filePath,
        original_filename: selectedFile.name,
        modality: resolvedModality,
        prediction: modelResult.prediction,
        confidence: modelResult.confidence,
        findings,
        model_used: modelUsed,
      });
      if (insertError) console.error("DB insert error:", insertError);

      setResult({
        modality: resolvedModality,
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
    const resultScanLabel = formatModalityLabel(result.modality);
    const probs = result.classProbabilities
      ? "\n" + Object.entries(result.classProbabilities).map(([k, v]) => `• ${k}: ${Number(v).toFixed(1)}%`).join("\n")
      : "";
    return `🩺 *MedVision Diagnostic Report (${resultScanLabel})*
Patient: ${activePatient.patient_name}${activePatient.age ? ` (${activePatient.age}${activePatient.gender ? ", " + activePatient.gender : ""})` : ""}
Scan Type: ${resultScanLabel}
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
    const resultScanLabel = formatModalityLabel(result?.modality ?? modality);
    const subject = encodeURIComponent(`MedVision ${resultScanLabel} Report — ${activePatient?.patient_name || "Patient"}`);
    const body = encodeURIComponent(buildShareText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareNative = async () => {
    const text = buildShareText();
    const resultScanLabel = formatModalityLabel(result?.modality ?? modality);
    if (navigator.share) {
      try { await navigator.share({ title: `MedVision ${resultScanLabel} Report`, text }); } catch { /* cancelled */ }
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
              <div className="hidden leading-tight sm:block">
                <div className="text-foreground">{profile?.full_name || user?.email}</div>
                {profile?.hospital && (
                  <div className="text-xs text-muted-foreground">{profile.hospital}</div>
                )}
              </div>
              <span className="rounded bg-secondary/20 px-1.5 py-0.5 text-xs capitalize text-secondary">{userRole?.replace("_", " ") || "user"}</span>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Scan Analysis</h1>
            <p className="text-muted-foreground">
              {modality === "ct"
                ? "Register the patient, upload their chest CT scan, and get a 4-class lung-cancer subtype AI classification with Grad-CAM explainability."
                : "Register the patient, upload their chest X-ray, and get a 3-class pneumonia AI diagnosis with Grad-CAM explainability."}
            </p>
          </div>
          {backendModalities && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
              <span className="font-medium text-muted-foreground">Inference Engine:</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${backendModalities.xray ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${backendModalities.xray ? "bg-success" : "bg-warning"}`} />
                X-ray {backendModalities.xray ? "Ready" : "Offline"}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${backendModalities.ct ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${backendModalities.ct ? "bg-success" : "bg-warning"}`} />
                CT {backendModalities.ct ? "Ready" : "Not Deployed"}
              </span>
            </div>
          )}
        </motion.div>

        {showHistory ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Case History</h2>
            {history.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No analyses yet. Upload a chest X-ray or CT scan to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Date</th>
                      <th className="pb-3 font-medium text-muted-foreground">Scan Type</th>
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
                      const isCt = record.modality === "ct";
                      return (
                        <tr key={record.id} className="border-b border-border/50 last:border-0">
                          <td className="py-3 text-foreground">{new Date(record.created_at).toLocaleDateString()}</td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                isCt ? "bg-info/10 text-info" : "bg-secondary/10 text-secondary"
                              }`}
                            >
                              {formatModalityLabel(record.modality)}
                            </span>
                          </td>
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
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold text-card-foreground">Upload Scan</h2>
                  <div role="group" aria-label="Scan type selector" className="inline-flex rounded-lg bg-muted p-1 text-xs">
                    <button
                      type="button"
                      disabled={isAnalyzing}
                      onClick={() => handleModalityChange("xray")}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        modality === "xray" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Activity className="h-3.5 w-3.5 text-secondary" />
                      Chest X-ray
                    </button>
                    <button
                      type="button"
                      disabled={isAnalyzing}
                      onClick={() => handleModalityChange("ct")}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        modality === "ct" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5 text-info" />
                      Chest CT
                    </button>
                  </div>
                </div>

                {/* Modality Diagnostic Scope & Target Classes Panel */}
                <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3.5 text-xs">
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{modalityProfile.title}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{modalityProfile.architecture}</span>
                  </div>
                  <p className="mb-2.5 text-muted-foreground">{modalityProfile.subtitle}</p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {modalityProfile.classes.map((cls) => (
                      <div key={cls.name} className="rounded border border-border/60 bg-card/70 px-2.5 py-1.5">
                        <span className="font-medium text-foreground">{cls.name}</span>
                        <p className="text-[11px] text-muted-foreground">{cls.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {modality === "ct" && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-info/30 bg-info/10 p-3 text-xs text-foreground">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                    <p>
                      The CT model classifies lung-cancer subtypes (Adenocarcinoma, Large Cell, Squamous Cell) vs Normal. It does not detect pneumonia on CT.
                    </p>
                  </div>
                )}

                {!preview ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors ${dragOver ? "border-secondary bg-secondary/5" : "border-border"}`}
                  >
                    <Upload className={`mb-4 h-10 w-10 ${dragOver ? "text-secondary" : "text-muted-foreground"}`} />
                    <p className="mb-2 text-sm font-medium text-foreground">Drag & drop your {scanLabel.toLowerCase()} image</p>
                    <p className="mb-4 text-xs text-muted-foreground">PNG, JPG up to 10MB · EXIF metadata stripped client-side</p>
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
                      <img src={preview} alt={`Uploaded ${scanLabel}`} className="h-64 w-full object-contain bg-foreground/5" />
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <FileImage className="h-4 w-4" />
                      <span className="truncate">{selectedFile?.name}</span>
                    </div>
                    <Button onClick={handleAnalyze} disabled={isAnalyzing} className="mt-4 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      {isAnalyzing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>) : `Analyze ${scanLabel}`}
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right column: results */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-card-foreground">Analysis Results</h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    (result?.modality ?? modality) === "ct"
                      ? "bg-info/10 text-info"
                      : "bg-secondary/10 text-secondary"
                  }`}
                >
                  {(result?.modality ?? modality) === "ct" ? <Layers className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                  {formatModalityLabel(result?.modality ?? modality)}
                </span>
              </div>
              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="mb-4 h-12 w-12 animate-spin text-secondary" />
                    <p className="mb-2 font-medium text-foreground">Processing {scanLabel}</p>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Running {modality === "ct" ? "4-class CT" : "3-class X-ray"} inference & Grad-CAM…
                    </p>
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
                          <StyleIcon className={`h-8 w-8 shrink-0 ${style.iconClass}`} />
                          <div>
                            <p className="font-display text-xl font-bold text-foreground">{result.prediction}</p>
                            <p className="text-sm text-muted-foreground">{result.findings}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Clinical Interpretation & Next Steps Card */}
                    {CLINICAL_GUIDANCE[result.prediction] && (
                      <div className="rounded-lg border border-border bg-muted/30 p-3.5 text-xs">
                        <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
                          <Stethoscope className="h-3.5 w-3.5 text-secondary" />
                          Clinical Interpretation &amp; Suggested Workup
                        </p>
                        <p className="mb-2 text-muted-foreground">
                          {CLINICAL_GUIDANCE[result.prediction].summary}
                        </p>
                        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                          {CLINICAL_GUIDANCE[result.prediction].nextSteps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}

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
                        <p className="mb-2 text-sm font-medium text-foreground">
                          Class Breakdown ({Object.keys(result.classProbabilities).length}-class)
                        </p>
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
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">Grad-CAM Heatmap</p>
                            <p className="text-xs text-muted-foreground">Highlighted regions show what most influenced the model's prediction.</p>
                          </div>
                          <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs">
                            <button
                              type="button"
                              onClick={() => setHeatmapView("split")}
                              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
                                heatmapView === "split" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                              }`}
                            >
                              <Columns className="h-3 w-3" /> Side-by-Side
                            </button>
                            <button
                              type="button"
                              onClick={() => setHeatmapView("blend")}
                              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
                                heatmapView === "blend" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                              }`}
                            >
                              <Sliders className="h-3 w-3" /> Interactive Blend
                            </button>
                          </div>
                        </div>

                        {heatmapView === "split" ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <img src={preview ?? ""} alt={`Original ${formatModalityLabel(result.modality)}`} className="w-full rounded-lg border border-border object-contain bg-foreground/5" />
                              <p className="mt-1 text-center text-xs text-muted-foreground">Original</p>
                            </div>
                            <div>
                              <img src={result.heatmapDataUrl} alt="Grad-CAM heatmap" className="w-full rounded-lg border border-border object-contain bg-foreground/5" />
                              <p className="mt-1 text-center text-xs text-muted-foreground">Heatmap</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 rounded-lg border border-border bg-foreground/5 p-3">
                            <div className="relative mx-auto h-64 w-full overflow-hidden rounded-md">
                              <img
                                src={preview ?? ""}
                                alt={`Original ${formatModalityLabel(result.modality)}`}
                                className="h-full w-full object-contain"
                              />
                              <img
                                src={result.heatmapDataUrl}
                                alt="Grad-CAM heatmap overlay"
                                style={{ opacity: blendOpacity / 100 }}
                                className="pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity"
                              />
                            </div>
                            <div className="flex items-center gap-3 px-1 pt-1 text-xs">
                              <span className="text-muted-foreground">Original</span>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={blendOpacity}
                                onChange={(e) => setBlendOpacity(Number(e.target.value))}
                                aria-label="Grad-CAM overlay opacity"
                                className="h-1.5 flex-1 cursor-pointer accent-secondary"
                              />
                              <span className="w-20 text-right font-mono text-foreground">{blendOpacity}% Heatmap</span>
                            </div>
                          </div>
                        )}

                        {/* Explanation panel — teaches the clinician what the colors mean */}
                        <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-xs">
                          <p className="font-medium text-foreground">How to read this heatmap</p>
                          <p className="text-muted-foreground">
                            This overlay implies that the highlighted areas of the lung are the regions the AI focused on when arriving at a <span className="font-semibold text-foreground">{result.prediction}</span> diagnosis — in other words, <span className="italic">these portions are the affected / most influential parts</span> of the {result.modality === "ct" ? "CT scan" : "X-ray"}.
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
                          ) : result.modality === "ct" ? (
                            <p className="text-muted-foreground">The hotter regions likely correspond to nodules, masses, or other tissue patterns consistent with <span className="font-semibold text-foreground">{result.prediction}</span>. Correlate with clinical findings and refer for radiologist review.</p>
                          ) : (
                            <p className="text-muted-foreground">The hotter regions likely correspond to opacities, consolidations, or other patterns consistent with <span className="font-semibold text-foreground">{result.prediction}</span>. Always correlate with clinical findings.</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Scan Type</span><span className="text-foreground">{formatModalityLabel(result.modality)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Model</span><span className="text-foreground">{result.modelUsed}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Timestamp</span><span className="text-foreground">{result.timestamp}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Image</span><span className="truncate text-foreground">{selectedFile?.name}</span></div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => result && generateReport({
                          modality: result.modality,
                          prediction: result.prediction,
                          confidence: result.confidence,
                          findings: result.findings,
                          timestamp: result.timestamp,
                          filename: selectedFile?.name || (result.modality === "ct" ? "chest-ct.jpg" : "chest-xray.jpg"),
                          imageDataUrl: preview,
                          heatmapDataUrl: result.heatmapDataUrl,
                          classProbabilities: result.classProbabilities,
                          patientName: activePatient?.patient_name,
                          patientAge: activePatient?.age ?? undefined,
                          patientGender: activePatient?.gender ?? undefined,
                          patientNotes: activePatient?.notes ?? undefined,
                          practitioner: profile?.full_name || user?.email,
                          hospital: profile?.hospital || undefined,
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
                    <p className="text-sm text-muted-foreground">
                      Enter patient details, upload a {scanShortLabel}, and analyze to see the full report here.
                    </p>
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
