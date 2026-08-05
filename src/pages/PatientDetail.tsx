import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, LogOut, ArrowLeft, AlertTriangle, CheckCircle2, FileImage } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
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

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { signOut } = useAuth();
  const navigate = useNavigate();
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
              <Link to="/patients"><ArrowLeft className="mr-2 h-4 w-4" />Patients</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Loading...</p>
        ) : !patient ? (
          <p className="py-12 text-center text-muted-foreground">Patient not found.</p>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-xl border border-border bg-card p-6 shadow-card">
              <h1 className="mb-1 font-display text-2xl font-bold text-foreground">{patient.patient_name}</h1>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>Gender: {patient.gender || "—"}</span>
                <span>Age: {patient.age ?? "—"}</span>
                <span>Added: {new Date(patient.created_at).toLocaleDateString()}</span>
              </div>
              {patient.notes && (
                <p className="mt-3 text-sm text-muted-foreground">Notes: {patient.notes}</p>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Scan History</h2>
              {analyses.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">
                  No scans recorded for this patient yet. Run an analysis from the Dashboard and select this patient to see it here.
                </p>
              ) : (
                <div className="space-y-3">
                  {analyses.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                      <div className="flex items-center gap-3">
                        <FileImage className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${resultBadgeClass(a.prediction)}`}>
                              {a.prediction === "Normal" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                              {a.prediction}
                            </span>
                            <span className="text-sm text-foreground">{a.confidence}% confidence</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{a.original_filename} · {new Date(a.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{a.model_used}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
};

export default PatientDetail;
