import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileImage, AlertTriangle, CheckCircle2, Loader2, X,
  History, Download, Share2, MessageCircle, Mail, Link2, UserPlus,
  Info, Stethoscope, Layers, Activity, Sliders, Columns, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ClinicalShell from "@/components/ClinicalShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateReport, type ScanModality } from "@/lib/report";
import { stripImageMetadata } from "@/lib/stripImageMetadata";
import lungsClinical from "@/assets/thoracic-lungs-clinical.jpg";

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
  const { user } = useAuth();
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

  // Interactive Grad-CAM viewer mode
  const [heatmapView, setHeatmapView] = useState<"split" | "blend">("split");
  const [blendOpacity, setBlendOpacity] = useState<number>(65);
  const [backendModalities, setBackendModalities] = useState<{ xray: boolean; ct: boolean } | null>(null);

  const scanLabel = formatModalityLabel(modality);
  const scanShortLabel = modality === "ct" ? "CT scan" : "X-ray";
  const currentPatientPreview =
    activePatient ||
    (patientMode === "existing" ? patients.find((p) => p.id === selectedPatientId) ?? null : null);

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
      // ignore offline health check
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
    if (data) {
      const list = data as PatientRow[];
      setPatients(list);
      if (!selectedPatientId && list.length > 0) {
        setSelectedPatientId(list[0].id);
      }
    }
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
      const cleanFile = await stripImageMetadata(selectedFile);

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

  const ringPercentage = result ? Math.round(result.confidence) : modality === "ct" ? 4 : 3;
  const ringStrokeDash = `${(result ? result.confidence : 75) * 1.63} 163`;

  return (
    <ClinicalShell
      practitionerName={profile?.full_name}
      hospitalName={profile?.hospital}
      headerRight={
        <Button
          variant={showHistory ? "default" : "outline"}
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className={`rounded-full px-4 ${showHistory ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8]" : ""}`}
        >
          <History className="mr-1.5 h-3.5 w-3.5" />
          History ({history.length})
        </Button>
      }
    >
      {/* ProHealth-Inspired Top Overview Row with Circular Ring Gauge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-7 flex flex-wrap items-center justify-between gap-6"
      >
        <div className="flex items-center gap-6">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Scan Analysis
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {modality === "ct"
                ? "Register the patient, upload their chest CT scan, and get a 4-class lung-cancer subtype AI classification with Grad-CAM explainability."
                : "Register the patient, upload their chest X-ray, and get a 3-class pneumonia AI diagnosis with Grad-CAM explainability."}
            </p>
          </div>

          {/* Circular Gauge Widget (ProHealth style) */}
          <div className="hidden items-center gap-3 rounded-full border border-border/70 bg-card px-4 py-2 shadow-card xl:flex">
            <div className="relative h-14 w-14">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={ringStrokeDash}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-display text-xs font-bold text-foreground">
                {result ? `${ringPercentage}%` : `${ringPercentage}C`}
              </div>
            </div>
            <div className="pr-2 text-xs">
              <div className="font-bold text-foreground">
                {result ? "Model Confidence" : `${scanLabel} Mode`}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {result ? result.prediction : `${ringPercentage}-class MobileNetV2`}
              </div>
            </div>
          </div>
        </div>

        {/* Engine Readiness Status Pill */}
        {backendModalities && (
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-xs shadow-card">
            <span className="font-medium text-muted-foreground">Engine:</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold ${backendModalities.xray ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${backendModalities.xray ? "bg-success" : "bg-warning"}`} />
              X-ray {backendModalities.xray ? "Ready" : "Offline"}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold ${backendModalities.ct ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${backendModalities.ct ? "bg-success" : "bg-warning"}`} />
              CT {backendModalities.ct ? "Ready" : "Not Deployed"}
            </span>
          </div>
        )}
      </motion.div>

      {showHistory ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="clinical-surface p-7"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-card-foreground">Case History</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)} className="rounded-full">
              Back to Workstation
            </Button>
          </div>
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
                        <td className="py-3.5 text-foreground">{new Date(record.created_at).toLocaleDateString()}</td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              isCt ? "bg-info/10 text-info" : "bg-secondary/10 text-secondary"
                            }`}
                          >
                            {formatModalityLabel(record.modality)}
                          </span>
                        </td>
                        <td className="py-3.5 text-foreground">{record.original_filename}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.boxClass} ${s.iconClass}`}>
                            <Icon className="h-3 w-3" />{record.prediction}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono text-foreground">{Number(record.confidence).toFixed(1)}%</td>
                        <td className="py-3.5 text-muted-foreground">{record.model_used}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="grid gap-7 lg:grid-cols-12">
          {/* LEFT COLUMN (5 cols): ProHealth 3D Anatomical Lungs & Upload Stage */}
          <div className="space-y-6 lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="clinical-surface p-6"
            >
              {/* Top of Upload Card: Scan-Type Segmented Control */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-card-foreground">Upload Scan</h2>
                <div role="group" aria-label="Scan type selector" className="inline-flex rounded-full bg-muted p-1 text-xs">
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => handleModalityChange("xray")}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                      modality === "xray"
                        ? "bg-[#2563eb] text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    Chest X-ray
                  </button>
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => handleModalityChange("ct")}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                      modality === "ct"
                        ? "bg-[#2563eb] text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Chest CT
                  </button>
                </div>
              </div>

              {/* Required CT Clinical Scope Notice */}
              {modality === "ct" && (
                <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-info/30 bg-info/10 p-3.5 text-xs text-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                  <p>
                    The CT model classifies lung-cancer subtypes (Adenocarcinoma, Large Cell, Squamous Cell) vs Normal. It does not detect pneumonia on CT.
                  </p>
                </div>
              )}

              {/* Interactive Anatomical Lungs / Scan Preview Stage */}
              {!preview ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative overflow-hidden rounded-[24px] border-2 border-dashed p-6 text-center transition-all ${
                    dragOver
                      ? "border-[#2563eb] bg-[#2563eb]/5"
                      : "border-border/80 bg-[#f5f8fc] dark:bg-muted/25"
                  }`}
                >
                  {/* ProHealth Vertical Calibration Ruler on Left */}
                  <div className="pointer-events-none absolute left-3.5 top-1/2 hidden -translate-y-1/2 flex-col items-start gap-2 font-mono text-[10px] text-muted-foreground/60 sm:flex">
                    <span>100% —</span>
                    <span>87% ━━</span>
                    <span>50% —</span>
                    <span>25% —</span>
                  </div>

                  {/* Floating Glass Callout Badge (ProHealth style) */}
                  <div className="pointer-events-none absolute right-3.5 top-3.5 rounded-2xl border border-white/80 bg-white/90 px-3 py-1.5 text-left text-[11px] shadow-sm backdrop-blur-md dark:border-border dark:bg-card/90">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
                      {modality === "ct" ? "4-Class NSCLC CT" : "3-Class X-Ray"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">224×224 RGB · [0, 1]</div>
                  </div>

                  <img
                    src={lungsClinical}
                    alt="3D Thoracic Lungs Reference"
                    className="mx-auto mb-3 h-52 w-auto object-contain animate-lung-breathe"
                  />

                  <div className="mx-auto max-w-xs">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#2563eb]/10 text-[#2563eb]">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="mb-1 text-sm font-bold text-foreground">
                      Drag &amp; drop your {scanLabel.toLowerCase()} image
                    </p>
                    <p className="mb-4 text-xs text-muted-foreground">
                      PNG, JPG up to 10MB · EXIF metadata stripped automatically
                    </p>
                    <label>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                      />
                      <span className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#2563eb] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-[#1d4ed8]">
                        Browse Files
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={clearSelection}
                    title="Clear scan"
                    className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 text-foreground shadow-md backdrop-blur-md transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="relative overflow-hidden rounded-[24px] border border-border bg-foreground/5">
                    <img
                      src={preview}
                      alt={`Uploaded ${scanLabel}`}
                      className="h-72 w-full object-contain"
                    />
                    {isAnalyzing && (
                      <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#72f6d5] to-transparent shadow-[0_0_20px_#72f6d5] animate-scan-sweep" />
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-muted/50 px-3.5 py-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 truncate">
                      <FileImage className="h-4 w-4 shrink-0 text-[#2563eb]" />
                      <span className="truncate font-medium text-foreground">{selectedFile?.name}</span>
                    </div>
                    <span className="ml-2 shrink-0 rounded-full bg-card px-2.5 py-0.5 font-semibold text-foreground">
                      {scanLabel}
                    </span>
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="mt-4 h-12 w-full rounded-full bg-[#2563eb] text-sm font-bold text-white shadow-md shadow-[#2563eb]/20 hover:bg-[#1d4ed8]"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      `Analyze ${scanLabel}`
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT COLUMN (7 cols): Medikals Patient Info Card + ProHealth Diagnostic Results */}
          <div className="space-y-6 lg:col-span-7">
            {/* Medikals-Inspired Split Patient Info + Modality Target Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="clinical-surface p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-card-foreground">Patient Info</h2>
                <div className="flex gap-1 rounded-full bg-muted p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setPatientMode("existing")}
                    className={`rounded-full px-3.5 py-1 font-semibold transition-all ${
                      patientMode === "existing"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientMode("new")}
                    className={`rounded-full px-3.5 py-1 font-semibold transition-all ${
                      patientMode === "new"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    <UserPlus className="mr-1 inline h-3 w-3" />
                    New
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-12">
                {/* Medikals Royal-Blue Patient Card */}
                <div className="flex flex-col justify-between rounded-[22px] bg-[#2563eb] p-5 text-white shadow-md md:col-span-7">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold">
                        {currentPatientPreview?.age ? `${currentPatientPreview.age} yrs` : "Age —"}
                      </span>
                      <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold">
                        {currentPatientPreview?.gender || "Gender —"}
                      </span>
                      <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold">
                        {scanLabel}
                      </span>
                    </div>

                    {patientMode === "existing" ? (
                      <div className="space-y-2">
                        <div className="font-display text-xl font-bold leading-tight">
                          {currentPatientPreview?.patient_name || "Select a Patient"}
                        </div>
                        <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                          <SelectTrigger className="mt-2 border-white/25 bg-white/15 text-white placeholder:text-white/70">
                            <SelectValue placeholder={patients.length ? "Choose a patient…" : "No patients yet — add one"} />
                          </SelectTrigger>
                          <SelectContent>
                            {patients.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.patient_name}{p.age ? ` · ${p.age}${p.gender ? " " + p.gender : ""}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!patients.length && (
                          <p className="text-[11px] text-white/80">
                            Switch to <span className="font-bold underline">New</span> to register a patient inline.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Input
                            value={newPatient.patient_name}
                            onChange={(e) => setNewPatient({ ...newPatient, patient_name: e.target.value })}
                            placeholder="Patient full name *"
                            maxLength={120}
                            className="border-white/25 bg-white/15 text-white placeholder:text-white/70"
                          />
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={150}
                          value={newPatient.age}
                          onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                          placeholder="Age"
                          className="border-white/25 bg-white/15 text-white placeholder:text-white/70"
                        />
                        <Select value={newPatient.gender} onValueChange={(v) => setNewPatient({ ...newPatient, gender: v })}>
                          <SelectTrigger className="border-white/25 bg-white/15 text-white">
                            <SelectValue placeholder="Gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="sm:col-span-2">
                          <Textarea
                            rows={2}
                            value={newPatient.notes}
                            onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })}
                            placeholder="Clinical notes, symptoms, referring physician…"
                            maxLength={1000}
                            className="border-white/25 bg-white/15 text-white placeholder:text-white/70"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medikals Right Diagnosis / Protocol Summary Tile */}
                <div className="flex flex-col justify-between rounded-[22px] bg-muted/50 p-5 md:col-span-5">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Active Protocol :</span>
                    <h3 className="mt-1 font-display text-base font-bold text-foreground">
                      {modality === "ct" ? "Lung-Cancer CT (4-Class)" : "Pneumonia X-Ray (3-Class)"}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(modality === "ct"
                        ? ["Adenocarcinoma", "Large Cell", "Squamous Cell", "Normal"]
                        : ["Bacterial", "Viral", "Normal"]
                      ).map((c) => (
                        <span
                          key={c}
                          className="rounded-full border border-border/80 bg-card px-2.5 py-0.5 text-[11px] font-medium text-foreground"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
                    Grad-CAM Layer: <span className="font-mono font-semibold text-foreground">out_relu</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Analysis Results Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="clinical-surface p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-card-foreground">Analysis Results</h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    (result?.modality ?? modality) === "ct"
                      ? "bg-info/10 text-info"
                      : "bg-secondary/10 text-secondary"
                  }`}
                >
                  {(result?.modality ?? modality) === "ct" ? <Layers className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
                  {formatModalityLabel(result?.modality ?? modality)}
                </span>
              </div>

              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16"
                  >
                    <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#2563eb]" />
                    <p className="mb-1 font-display text-base font-bold text-foreground">
                      Processing {scanLabel}
                    </p>
                    <p className="mb-4 text-xs text-muted-foreground">
                      Running {modality === "ct" ? "4-class CT" : "3-class X-ray"} inference &amp; Grad-CAM…
                    </p>
                    <Progress value={66} className="w-48" />
                  </motion.div>
                ) : result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    {activePatient && (
                      <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3 text-sm">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Report for</p>
                          <p className="font-bold text-foreground">
                            {activePatient.patient_name}
                            {activePatient.age ? (
                              <span className="font-normal text-muted-foreground">
                                {" "}· {activePatient.age}{activePatient.gender ? ` ${activePatient.gender}` : ""}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">{result.timestamp}</span>
                      </div>
                    )}

                    {/* Result Banner: Normal green, Invalid amber, every other class red */}
                    {(() => {
                      const style = getResultStyle(result.prediction);
                      const StyleIcon = style.icon;
                      return (
                        <div className={`flex items-center gap-4 rounded-2xl border p-4 ${style.boxClass}`}>
                          <StyleIcon className={`h-8 w-8 shrink-0 ${style.iconClass}`} />
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
                          <span className="font-display text-lg font-bold text-foreground">{result.confidence}%</span>
                        </div>
                        <Progress value={result.confidence} className="h-3" />
                      </div>
                    )}

                    {result.prediction !== "Invalid" && result.classProbabilities && (
                      <div className="space-y-2.5 rounded-2xl bg-muted/40 p-4">
                        <p className="mb-1 text-sm font-bold text-foreground">
                          Class Breakdown ({Object.keys(result.classProbabilities).length}-class)
                        </p>
                        {Object.entries(result.classProbabilities).map(([className, prob]) => (
                          <div key={className} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-muted-foreground">{className}</span>
                              <span className="font-mono font-semibold text-foreground">{Number(prob).toFixed(1)}%</span>
                            </div>
                            <Progress value={prob} className="h-2" />
                          </div>
                        ))}
                      </div>
                    )}

                    {result.prediction !== "Invalid" && result.heatmapDataUrl && (
                      <div>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-foreground">Grad-CAM Heatmap</p>
                            <p className="text-xs text-muted-foreground">
                              Highlighted regions show what most influenced the model's prediction.
                            </p>
                          </div>
                          <div className="inline-flex rounded-full bg-muted p-1 text-xs">
                            <button
                              type="button"
                              onClick={() => setHeatmapView("split")}
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition-all ${
                                heatmapView === "split" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                              }`}
                            >
                              <Columns className="h-3 w-3" /> Side-by-Side
                            </button>
                            <button
                              type="button"
                              onClick={() => setHeatmapView("blend")}
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition-all ${
                                heatmapView === "blend" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                              }`}
                            >
                              <Sliders className="h-3 w-3" /> Interactive Blend
                            </button>
                          </div>
                        </div>

                        {heatmapView === "split" ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <img
                                src={preview ?? ""}
                                alt={`Original ${formatModalityLabel(result.modality)}`}
                                className="w-full rounded-2xl border border-border object-contain bg-foreground/5"
                              />
                              <p className="mt-1 text-center text-xs text-muted-foreground">Original</p>
                            </div>
                            <div>
                              <img
                                src={result.heatmapDataUrl}
                                alt="Grad-CAM heatmap"
                                className="w-full rounded-2xl border border-border object-contain bg-foreground/5"
                              />
                              <p className="mt-1 text-center text-xs text-muted-foreground">Heatmap</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 rounded-2xl border border-border bg-foreground/5 p-3">
                            <div className="relative mx-auto h-64 w-full overflow-hidden rounded-xl">
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
                            <div className="flex items-center gap-3 px-2 pt-1 text-xs">
                              <span className="text-muted-foreground">Original</span>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={blendOpacity}
                                onChange={(e) => setBlendOpacity(Number(e.target.value))}
                                aria-label="Grad-CAM overlay opacity"
                                className="h-1.5 flex-1 cursor-pointer accent-[#2563eb]"
                              />
                              <span className="w-24 text-right font-mono text-foreground">{blendOpacity}% Heatmap</span>
                            </div>
                          </div>
                        )}

                        {/* Heatmap Explanation Panel */}
                        <div className="mt-3 space-y-2 rounded-2xl border border-border bg-muted/40 p-4 text-xs">
                          <p className="font-bold text-foreground">How to read this heatmap</p>
                          <p className="text-muted-foreground">
                            This overlay implies that the highlighted areas of the lung are the regions the AI focused on when arriving at a{" "}
                            <span className="font-semibold text-foreground">{result.prediction}</span> diagnosis — in other words,{" "}
                            <span className="italic">these portions are the affected / most influential parts</span> of the{" "}
                            {result.modality === "ct" ? "CT scan" : "X-ray"}.
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
                            <p className="text-muted-foreground">
                              Because the diagnosis is <span className="font-semibold text-foreground">Normal</span>, the highlighted regions represent healthy lung fields the model verified rather than signs of disease.
                            </p>
                          ) : result.modality === "ct" ? (
                            <p className="text-muted-foreground">
                              The hotter regions likely correspond to nodules, masses, or other tissue patterns consistent with{" "}
                              <span className="font-semibold text-foreground">{result.prediction}</span>. Correlate with clinical findings and refer for radiologist review.
                            </p>
                          ) : (
                            <p className="text-muted-foreground">
                              The hotter regions likely correspond to opacities, consolidations, or other patterns consistent with{" "}
                              <span className="font-semibold text-foreground">{result.prediction}</span>. Always correlate with clinical findings.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Clinical Interpretation & Next Steps */}
                    {CLINICAL_GUIDANCE[result.prediction] && (
                      <div className="rounded-2xl border border-border bg-muted/30 p-4 text-xs">
                        <p className="mb-1 flex items-center gap-1.5 font-bold text-foreground">
                          <Stethoscope className="h-3.5 w-3.5 text-[#2563eb]" />
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

                    <div className="space-y-2 rounded-2xl bg-muted/50 p-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Scan Type</span>
                        <span className="font-medium text-foreground">{formatModalityLabel(result.modality)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model</span>
                        <span className="text-foreground">{result.modelUsed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Timestamp</span>
                        <span className="text-foreground">{result.timestamp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Image</span>
                        <span className="truncate text-foreground">{selectedFile?.name}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="h-11 w-full rounded-full font-semibold"
                        onClick={() =>
                          result &&
                          generateReport({
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
                          })
                        }
                      >
                        <Download className="mr-2 h-4 w-4" /> Download Full PDF Report
                      </Button>

                      <div className="rounded-2xl border border-border bg-muted/30 p-3.5">
                        <p className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                          <Share2 className="h-3.5 w-3.5" /> Share this report
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <Button size="sm" variant="secondary" onClick={shareWhatsApp} className="rounded-full bg-[#25D366] text-white hover:bg-[#20b558]">
                            <MessageCircle className="mr-1 h-4 w-4" />WhatsApp
                          </Button>
                          <Button size="sm" variant="outline" onClick={shareEmail} className="rounded-full">
                            <Mail className="mr-1 h-4 w-4" />Email
                          </Button>
                          <Button size="sm" variant="outline" onClick={shareNative} className="rounded-full">
                            <Share2 className="mr-1 h-4 w-4" />Share…
                          </Button>
                          <Button size="sm" variant="outline" onClick={copyText} className="rounded-full">
                            <Link2 className="mr-1 h-4 w-4" />Copy
                          </Button>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      ⚠️ This is an AI-assisted analysis and should not replace professional medical diagnosis.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-14 text-center"
                  >
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563eb]/10 text-[#2563eb]">
                      <FileImage className="h-7 w-7" />
                    </div>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Enter patient details, upload a {scanShortLabel}, and analyze to see the full report here.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      )}
    </ClinicalShell>
  );
};

export default Dashboard;
