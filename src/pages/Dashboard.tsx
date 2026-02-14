import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Upload, LogOut, FileImage, AlertTriangle, CheckCircle2, Loader2, BarChart3, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface AnalysisResult {
  prediction: "Pneumonia" | "Normal";
  confidence: number;
  timestamp: string;
}

const Dashboard = () => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
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

  const handleAnalyze = () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    // Simulate AI analysis (will be replaced with real API call)
    setTimeout(() => {
      const isPneumonia = Math.random() > 0.4;
      setResult({
        prediction: isPneumonia ? "Pneumonia" : "Normal",
        confidence: Math.round((85 + Math.random() * 14) * 10) / 10,
        timestamp: new Date().toLocaleString(),
      });
      setIsAnalyzing(false);
    }, 2500);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-secondary" />
            <span className="font-display text-lg font-bold text-foreground">MedVision</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">X-Ray Analysis</h1>
          <p className="mb-8 text-muted-foreground">Upload a chest X-ray image to detect pneumonia using AI.</p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Upload area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Upload Image</h2>

            {!preview ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                  dragOver ? "border-secondary bg-secondary/5" : "border-border"
                }`}
              >
                <Upload className={`mb-4 h-10 w-10 ${dragOver ? "text-secondary" : "text-muted-foreground"}`} />
                <p className="mb-2 text-sm font-medium text-foreground">Drag & drop your X-ray image</p>
                <p className="mb-4 text-xs text-muted-foreground">PNG, JPG, DICOM up to 10MB</p>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  <span className="cursor-pointer rounded-lg bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/20">
                    Browse Files
                  </span>
                </label>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={clearSelection}
                  className="absolute -right-2 -top-2 z-10 rounded-full bg-destructive p-1 text-destructive-foreground shadow-md"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="overflow-hidden rounded-lg border border-border">
                  <img src={preview} alt="Uploaded X-ray" className="h-64 w-full object-contain bg-foreground/5" />
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileImage className="h-4 w-4" />
                  <span className="truncate">{selectedFile?.name}</span>
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="mt-4 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze X-Ray"
                  )}
                </Button>
              </div>
            )}
          </motion.div>

          {/* Results area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground">Analysis Results</h2>

            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <Loader2 className="mb-4 h-12 w-12 animate-spin text-secondary" />
                  <p className="mb-2 font-medium text-foreground">Processing X-Ray</p>
                  <p className="mb-4 text-sm text-muted-foreground">Running AI inference...</p>
                  <Progress value={66} className="w-48" />
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className={`flex items-center gap-4 rounded-lg p-4 ${
                    result.prediction === "Pneumonia"
                      ? "bg-destructive/10 border border-destructive/20"
                      : "bg-success/10 border border-success/20"
                  }`}>
                    {result.prediction === "Pneumonia" ? (
                      <AlertTriangle className="h-8 w-8 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-8 w-8 text-success" />
                    )}
                    <div>
                      <p className="font-display text-xl font-bold text-foreground">{result.prediction}</p>
                      <p className="text-sm text-muted-foreground">
                        {result.prediction === "Pneumonia" ? "Pneumonia indicators detected" : "No pneumonia indicators found"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Confidence Score</span>
                      <span className="font-display font-semibold text-foreground">{result.confidence}%</span>
                    </div>
                    <Progress value={result.confidence} className="h-3" />
                  </div>

                  <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model</span>
                      <span className="text-foreground">MobileNetV2</span>
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

                  <p className="text-xs text-muted-foreground">
                    ⚠️ This is an AI-assisted analysis and should not replace professional medical diagnosis.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <FileImage className="mb-4 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Upload and analyze an X-ray to see results here</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
