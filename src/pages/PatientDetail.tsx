import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, CheckCircle2, FileImage } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ClinicalShell from "@/components/ClinicalShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [patient, setPatient] = useState<Patient | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchPatientAndHistory(id);
  }, [id]);

  const fetchPatientAndHistory = async (patientId: string) => {
    setLoading(true);

    const { data: patientData, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .maybeSingle();

    if (patientError || !patientData) {
      toast.error("Could not load this patient record");
      setLoading(false);
      return;
    }
    setPatient(patientData);

    const { data: analysesData } = await supabase
      .from("analyses")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (analysesData) setAnalyses(analysesData);
    setLoading(false);
  };

  return (
    <ClinicalShell
      headerRight={
        <Button variant="outline" size="sm" asChild className="rounded-full">
          <Link to="/patients"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" />All Patients</Link>
        </Button>
      }
    >
      {loading ? (
        <p className="py-12 text-center text-muted-foreground">Loading...</p>
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
              <p className="mt-2 max-w-2xl text-sm text-white/85">Notes: {patient.notes}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="clinical-surface p-6"
          >
            <h2 className="mb-4 font-display text-lg font-bold text-card-foreground">Scan History</h2>
            {analyses.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                No scans recorded for this patient yet. Run an analysis from the Dashboard and select this patient to see it here.
              </p>
            ) : (
              <div className="space-y-3">
                {analyses.map((a) => {
                  const isCt = a.modality === "ct";
                  return (
                    <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40">
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
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${resultBadgeClass(a.prediction)}`}>
                              {a.prediction === "Normal" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                              {a.prediction}
                            </span>
                            <span className="font-mono text-sm font-semibold text-foreground">{a.confidence}% confidence</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{a.original_filename} · {new Date(a.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{a.model_used}</span>
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
