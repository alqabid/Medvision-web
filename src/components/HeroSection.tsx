import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Scan, ShieldCheck, Layers, Activity, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-hero">
      {/* Background image overlay */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="h-full w-full object-cover opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-glow" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 pb-16 pt-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5 text-sm text-secondary-foreground/80">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span className="text-accent">Dual-Modality Thoracic AI · Chest X-Ray &amp; Chest CT</span>
          </div>

          <h1 className="mb-6 font-display text-5xl font-bold leading-tight tracking-tight text-primary-foreground md:text-7xl">
            AI-Powered{" "}
            <span className="text-gradient">Thoracic Imaging</span>{" "}
            Diagnostics
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-primary-foreground/75">
            Analyze <span className="font-medium text-primary-foreground">Chest X-rays</span> for 3-class pneumonia differentiation and{" "}
            <span className="font-medium text-primary-foreground">Chest CT scans</span> for 4-class lung-cancer subtype classification — complete with Grad-CAM visual explainability and clinical PDF reporting.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="h-12 gap-2 bg-secondary px-8 text-secondary-foreground shadow-glow hover:bg-secondary/90"
            >
              <Link to="/signup">
                <Scan className="h-5 w-5" />
                Start Analyzing Scans
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 border-2 border-primary-foreground/80 bg-primary-foreground/5 px-8 text-base font-medium text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
            >
              <a href="#how-it-works">Explore Clinical Workflow</a>
            </Button>
          </div>
        </motion.div>

        {/* Dual-Modality Preview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-14 grid w-full max-w-4xl gap-4 text-left sm:grid-cols-2"
        >
          <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-5 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/25 px-3 py-1 text-xs font-semibold text-accent">
                <Activity className="h-3.5 w-3.5" /> Modality 01 · Chest X-Ray
              </span>
              <span className="font-mono text-xs text-primary-foreground/60">3-Class MobileNetV2</span>
            </div>
            <h3 className="font-display text-lg font-bold text-primary-foreground">Pneumonia Differentiation</h3>
            <p className="mt-1 text-xs leading-relaxed text-primary-foreground/70">
              Distinguishes bacterial and viral pneumonia infiltrates from healthy lung fields on anterior-posterior and posterior-anterior radiographs.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Bacterial Pneumonia", "Viral Pneumonia", "Normal"].map((c) => (
                <span key={c} className="rounded-md border border-primary-foreground/15 bg-primary-foreground/10 px-2 py-0.5 text-[11px] text-primary-foreground/90">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-accent/30 bg-primary-foreground/5 p-5 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">
                <Layers className="h-3.5 w-3.5" /> Modality 02 · Chest CT
              </span>
              <span className="font-mono text-xs text-primary-foreground/60">4-Class MobileNetV2</span>
            </div>
            <h3 className="font-display text-lg font-bold text-primary-foreground">Lung-Cancer Subtype Classification</h3>
            <p className="mt-1 text-xs leading-relaxed text-primary-foreground/70">
              Classifies axial thoracic CT slices across major non-small cell carcinoma subtypes vs. normal parenchyma with Grad-CAM nodule localization.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Adenocarcinoma", "Large Cell Carcinoma", "Squamous Cell Carcinoma", "Normal"].map((c) => (
                <span key={c} className="rounded-md border border-primary-foreground/15 bg-primary-foreground/10 px-2 py-0.5 text-[11px] text-primary-foreground/90">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-12 grid w-full max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4"
        >
          {[
            { value: "2 Modalities", label: "Chest X-Ray & CT" },
            { value: "7 Classes", label: "Pneumonia & Oncology" },
            { value: "Grad-CAM", label: "Visual Explainability" },
            { value: "<3s", label: "Real-Time Inference" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-2xl font-bold text-accent md:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs text-primary-foreground/60">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
