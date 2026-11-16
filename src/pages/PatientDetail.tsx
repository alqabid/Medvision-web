import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, CheckCircle2, FileImage, Activity, Download } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ClinicalShell from "@/components/ClinicalShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getLocalPatients, getLocalAnalyses, getActiveLocalAccount } from "@/lib/localClinicalStore";
import { generateReport } from "@/lib/report";

interface Patient {
  id: string;
  patient_name: string;
  gender: string | null;
  age: number | null;
  notes: string | null;
  created_at: string;
}

interface AnalysisRecord {
  id: string;
  modality?: string;
  prediction: string;
  confidence: number;
  original_filename: string;
  model_used: string;
  findings: string | null;
  created_at: string;
}

const resultBadgeClass = (prediction: string) => {
  if (prediction === "Normal") return "bg-success/10 text-success";
  if (prediction === "Invalid") return "bg-warning/10 text-warning";
  return "bg-destructive/10 text-destructive";
};

const formatModalityLabel = (modality?: string) => (modality === "ct" ? "Chest CT" : "Chest X-ray");

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchPatientAndHistory(id);
  }, [id]);

  const fetchPatientAndHistory = async (patientId: string) => {
    setLoading(true);

    let foundPatient: Patient | null = null;
    try {
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .maybeSingle();
      if (patientData) foundPatient = patientData as Patient;
    } catch {
      // ignore
    }

    if (!foundPatient) {
      foundPatient = getLocalPatients().find((p) => p.id === patientId) ?? null;
    }

    if (!foundPatient) {
      toast.error("Could not load this patient record");
      setLoading(false);
      return;
    }
    setPatient(foundPatient);

    const localHistory = getLocalAnalyses().filter((a) => a.patient_id === patientId);
    try {
      const { data: analysesData } = await supabase
        .from("analyses")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      const remoteHistory = (analysesData as AnalysisRecord[]) || [];
      const seen = new Set(remoteHistory.map((a) => a.id));
      const merged = [...remoteHistory, ...localHistory.filter((a) => !seen.has(a.id))].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setAnalyses(merged);
    } catch {
      setAnalyses(localHistory);
    }
    setLoading(false);
  };

  const handleDownloadReport = (a: AnalysisRecord) => {
    if (!patient) return;
    const localAcct = getActiveLocalAccount();
    let parsedProbs: Record<string, number> | undefined;
    let parsedNotes = a.findings || "";
    if (a.findings) {
      try {
        const parsed = JSON.parse(a.findings);
        if (parsed?.class_probabilities) parsedProbs = parsed.class_probabilities;
        if (parsed?.notes) parsedNotes = parsed.notes;
      } catch {
        // ignore
      }
    }

    generateReport({
      modality: a.modality === "ct" ? "ct" : "xray",
      prediction: a.prediction,
      confidence: Number(a.confidence),
      findings: parsedNotes || `Predicted ${a.prediction} (${Number(a.confidence).toFixed(1)}% confidence).`,
      timestamp: new Date(a.created_at).toLocaleString(),
      filename: a.original_filename,
      classProbabilities: parsedProbs,
      patientName: patient.patient_name,
      patientAge: patient.age ?? undefined,
      patientGender: patient.gender ?? undefined,
      patientNotes: patient.notes ?? undefined,
      practitioner:
        (user?.user_metadata?.full_name as string) || localAcct?.full_name || user?.email || "Clinician",
      hospital: (user?.user_metadata?.hospital as string) || localAcct?.hospital || "Korle Bu Teaching Hospital",
      modelUsed: a.modality === "ct" ? "Chest CT Oncology Classifier" : "Chest X-Ray Pneumonia Classifier",
    });
    toast.success("Clinical PDF report downloaded");
  };

  return (
    <ClinicalShell
      headerRight={
        <div className="flex items-center gap-2">
          {patient && (
            <Button size="sm" asChild className="rounded-full bg-[#07221e] px-4 text-[#72f6d5] hover:bg-[#0b352e]">
              <Link to={`/dashboard?patient=${patient.id}`}>
                <Activity className="mr-1.5 h-3.5 w-3.5" />
                Analyze New Scan
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <Link to="/patients"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" />All Patients</Link>
          </Button>
        </div>
      }
    >
      {loading ? (
        <p className="py-12 text-center text-muted-foreground">Loading patient profile...</p>
      ) : !patient ? (
        <p className="py-12 text-center text-muted-foreground">Patient not found.</p>
      ) : (
        <div className="space-y-7">
          {/* Dentivo Deep Emerald & Bioluminescent Mint Patient Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="emerald-stage rounded-[28px] border border-[#72f6d5]/25 p-7 text-white shadow-elevated"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#72f6d5]/35 bg-[#72f6d5]/15 px-3 py-1 text-xs font-semibold text-[#72f6d5]">
                Age: {patient.age ?? "N/A"}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                Gender: {patient.gender || "Unspecified"}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                Registered: {new Date(patient.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="font-display text-3xl font-extrabold text-white">{patient.patient_name}</h1>
            {patient.notes && (
              <p className="mt-2 max-w-2xl text-sm text-white/85">Clinical Notes: {patient.notes}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="clinical-surface p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-card-foreground">
                Longitudinal Scan History ({analyses.length})
              </h2>
            </div>
            {analyses.length === 0 ? (
              <div className="py-12 text-center">
                <p className="mb-4 text-muted-foreground">
                  No scans recorded for this patient yet.
                </p>
                <Button asChild className="rounded-full bg-[#07221e] text-[#72f6d5] hover:bg-[#0b352e]">
                  <Link to={`/dashboard?patient=${patient.id}`}>
                    <Activity className="mr-2 h-4 w-4" />
                    Analyze First Scan for {patient.patient_name}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {analyses.map((a) => {
                  const isCt = a.modality === "ct";
                  return (
                    <div
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#07221e] text-[#72f6d5]">
                          <FileImage className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                isCt ? "bg-[#07221e] text-[#72f6d5]" : "bg-secondary/15 text-secondary"
                              }`}
                            >
                              {formatModalityLabel(a.modality)}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${resultBadgeClass(
                                a.prediction
                              )}`}
                            >
                              {a.prediction === "Normal" ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {a.prediction}
                            </span>
                            <span className="font-mono text-sm font-semibold text-foreground">
                              {Number(a.confidence).toFixed(1)}% confidence
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {a.original_filename} · {new Date(a.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadReport(a)}
                        className="rounded-full text-xs"
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5 text-secondary" />
                        PDF Report
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </ClinicalShell>
  );
};

export default PatientDetail;
