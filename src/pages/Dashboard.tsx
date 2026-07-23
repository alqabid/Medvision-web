import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Upload, LogOut, FileImage, AlertTriangle, CheckCircle2, Loader2, X, History, Settings, User, Users, BarChart3, Download, Database, ScrollText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
}

interface AnalysisRecord {
  id: string;
  prediction: string;
  confidence: number;
  original_filename: string;
  model_used: string;
  created_at: string;
}

const getResultStyle = (prediction: string) => {
  if (prediction === "Normal") {
    return { icon: CheckCircle2, iconClass: "text-success", boxClass: "border-success/20 bg-success/10" };
  }
  if (prediction === "Invalid") {
    return { icon: AlertTriangle, iconClass: "text-warning", boxClass: "border-warning/20 bg-warning/10" };
  }
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

  useEffect(() => {
    fetchHistory();
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("full_name, email").eq("user_id", user.id).maybeSingle();
    if (data) setProfile(data);
  };

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setHistory(data);
  };

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
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

  const handleAnalyze = async () => {
    if (!selectedFile || !user) return;
    setIsAnalyzing(true);

    try {
      // Upload image to storage
      const filePath = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("xray-images")
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw new Error("Failed to upload image: " + uploadError.message);
      }

      // Call the FastAPI backend directly
      const apiUrl = import.meta.env.VITE_MEDVISION_API_URL || "http://localhost:8000";
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${apiUrl}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Model analysis failed. Is the backend server running?");
      }

      const modelResult = await response.json();
      // modelResult: { prediction, confidence, class_probabilities, heatmap_base64, model_used }

      const findings = `Model classified this scan as ${modelResult.prediction} with ${modelResult.confidence}% confidence.`;

      // Save the analysis record directly (allowed by the "Users can insert own analyses" policy)
      const { error: insertError } = await supabase.from("analyses").insert({
        user_id: user.id,
        image_path: filePath,
        original_filename: selectedFile.name,
        prediction: modelResult.prediction,
        confidence: modelResult.confidence,
        findings,
        model_used: modelResult.model_used || "MobileNetV2 (3-class, fine-tuned)",
      });

      if (insertError) {
        console.error("DB insert error:", insertError);
      }

      setResult({
        prediction: modelResult.prediction,
        confidence: modelResult.confidence,
        findings,
        timestamp: new Date().toLocaleString(),
        classProbabilities: modelResult.class_probabilities,
        heatmapDataUrl: modelResult.heatmap_base64
          ? `data:image/png;base64,${modelResult.heatmap_base64}`
          : undefined,
      });

      fetchHistory(); // Refresh history
      toast.success("Analysis complete");
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast.error(err.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
            <Button
              variant={showHistory ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className={showHistory ? "bg-secondary text-secondary-foreground" : ""}
            >
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/patients"><Users className="mr-2 h-4 w-4" />Patients</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/analytics"><BarChart3 className="mr-2 h-4 w-4" />Analytics</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/records"><Database className="mr-2 h-4 w-4" />Records</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/audit"><ScrollText className="mr-2 h-4 w-4" />Audit</Link>
            </Button>
            {userRole === "admin" && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  Admin
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link to="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
            </Button>
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="hidden text-foreground sm:inline">{profile?.full_name || user?.email}</span>
              <span className="rounded bg-secondary/20 px-1.5 py-0.5 text-xs capitalize text-secondary">
                {userRole?.replace("_", " ") || "user"}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">X-Ray Analysis</h1>
          <p className="mb-8 text-muted-foreground">Upload a chest X-ray image to detect pneumonia using AI.</p>
        </motion.div>

        {showHistory ? (
          /* Case History View */
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
                    {history.map((record) => (
                      <tr key={record.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 text-foreground">{new Date(record.created_at).toLocaleDateString()}</td>
                        <td className="py-3 text-foreground">{record.original_filename}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            record.prediction === "Normal"
                              ? "bg-success/10 text-success"
                              : record.prediction === "Invalid"
                              ? "bg-warning/10 text-warning"
                              : "bg-destructive/10 text-destructive"
                          }`}>
                            {record.prediction === "Normal" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                            {record.prediction}
                          </span>
                        </td>
                        <td className="py-3 text-foreground">{Number(record.confidence).toFixed(1)}%</td>
                        <td className="py-3 text-muted-foreground">{record.model_used}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : (
          /* Analysis View */
          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Upload Image</h2>
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

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Analysis Results</h2>
              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="mb-4 h-12 w-12 animate-spin text-secondary" />
                    <p className="mb-2 font-medium text-foreground">Processing X-Ray</p>
                    <p className="mb-4 text-sm text-muted-foreground">Running AI inference...</p>
                    <Progress value={66} className="w-48" />
                  </motion.div>
                ) : result ? (
                  <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
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
                        <p className="mb-2 text-sm font-medium text-foreground">Class Breakdown</p>
                        {Object.entries(result.classProbabilities).map(([className, prob]) => (
                          <div key={className} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{className}</span>
                              <span className="text-foreground">{prob}%</span>
                            </div>
                            <Progress value={prob} className="h-1.5" />
                          </div>
                        ))}
                      </div>
                    )}

                    {result.prediction !== "Invalid" && result.heatmapDataUrl && (
                      <div>
                        <p className="mb-2 text-sm font-medium text-foreground">Grad-CAM Heatmap</p>
                        <p className="mb-2 text-xs text-muted-foreground">
                          Highlighted regions show what most influenced the model's prediction.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <img
                              src={preview ?? ""}
                              alt="Original X-ray"
                              className="w-full rounded-lg border border-border object-contain bg-foreground/5"
                            />
                            <p className="mt-1 text-center text-xs text-muted-foreground">Original</p>
                          </div>
                          <div>
                            <img
                              src={result.heatmapDataUrl}
                              alt="Grad-CAM heatmap"
                              className="w-full rounded-lg border border-border object-contain bg-foreground/5"
                            />
                            <p className="mt-1 text-center text-xs text-muted-foreground">Heatmap</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model</span>
                        <span className="text-foreground">MobileNetV2 (3-class, fine-tuned)</span>
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

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => result && generateReport({
                          prediction: result.prediction,
                          confidence: result.confidence,
                          findings: result.findings,
                          timestamp: result.timestamp,
                          filename: selectedFile?.name || "xray.jpg",
                          imageDataUrl: preview,
                          practitioner: profile?.full_name || user?.email,
                        })}
                      >
                        <Download className="mr-2 h-4 w-4" /> Download PDF Report
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">⚠️ This is an AI-assisted analysis and should not replace professional medical diagnosis.</p>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
                    <FileImage className="mb-4 h-12 w-12 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Upload and analyze an X-ray to see results here</p>
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
