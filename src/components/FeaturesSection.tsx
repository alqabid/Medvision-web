import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Eye, FileText, ShieldCheck, Lock, BarChart3 } from "lucide-react";
import lungsHero from "@/assets/thoracic-lungs-hero.jpg";

const features = [
  {
    icon: Layers,
    title: "Dual-Modality Neural Engine",
    description: "Dedicated MobileNetV2 classifiers for Chest X-ray (3-class pneumonia) and Chest CT (4-class lung-cancer subtypes).",
  },
  {
    icon: Eye,
    title: "Grad-CAM Activation Mapping",
    description: "Pixel-level visual explanations highlighting lobar consolidations on X-ray or pulmonary nodules and masses on CT.",
  },
  {
    icon: FileText,
    title: "One-Click Clinical PDF Reports",
    description: "Export structured diagnostic PDFs with patient demographics, class probability bars, and side-by-side Grad-CAM imagery.",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access & Audit Trail",
    description: "Granular permissions for Admins, Medical Practitioners, and Authorized Users with complete diagnostic audit logging.",
  },
  {
    icon: Lock,
    title: "Zero-EXIF Anonymization",
    description: "Device and camera EXIF metadata are stripped in the browser before upload to encrypted Supabase storage.",
  },
  {
    icon: BarChart3,
    title: "Longitudinal Patient Cohorts",
    description: "Track patient histories across both X-ray and CT modalities, filter cohorts, and export structured CSV datasets.",
  },
];

const CALIBRATION_STEPS = [
  { label: "100%", active: false },
  { label: "94.2%", active: true },
  { label: "75%", active: false },
  { label: "50%", active: false },
  { label: "25%", active: false },
];

const FeaturesSection = () => {
  const [previewModality, setPreviewModality] = useState<"xray" | "ct">("ct");

  return (
    <section id="modalities" className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Dentivo-Inspired Interactive Bioluminescent Clinical Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24 grid items-center gap-8 rounded-[36px] border border-border/70 bg-card p-6 shadow-elevated sm:p-10 lg:grid-cols-12"
        >
          {/* Left: Dentivo Deep Emerald 3D Bioluminescent Lungs Stage */}
          <div className="emerald-stage relative flex min-h-[380px] flex-col items-center justify-center overflow-hidden rounded-[30px] border border-[#72f6d5]/20 p-6 shadow-elevated lg:col-span-5">
            {/* Animated Orbital Halo Rings */}
            <div className="pointer-events-none absolute h-64 w-64 rounded-full border border-[#72f6d5]/20 animate-pulse-halo" />
            <div className="pointer-events-none absolute h-80 w-80 rounded-full border border-dashed border-[#72f6d5]/15" />

            {/* Animated Laser Scan Sweep */}
            <div className="pointer-events-none absolute inset-x-6 top-12 h-16 rounded-full bg-gradient-to-b from-[#72f6d5]/20 to-transparent blur-md animate-scan-sweep" />

            {/* Vertical Calibration Scale on Left (Visual tick bars, zero dashes) */}
            <div className="pointer-events-none absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-start gap-3 text-[10px] font-mono sm:flex">
              {CALIBRATION_STEPS.map((step) => (
                <div key={step.label} className="flex items-center gap-2">
                  <span
                    className={
                      step.active
                        ? "font-bold text-[#72f6d5]"
                        : "text-white/50"
                    }
                  >
                    {step.label}
                  </span>
                  <span
                    className={
                      step.active
                        ? "h-1 w-4 rounded-full bg-[#72f6d5] shadow-[0_0_8px_rgba(114,246,213,0.9)]"
                        : "h-0.5 w-2 rounded-full bg-white/30"
                    }
                  />
                </div>
              ))}
            </div>

            <img
              src={lungsHero}
              alt="3D Translucent Bioluminescent Lungs"
              className="relative z-10 h-80 w-full rounded-2xl object-cover object-center opacity-95 mix-blend-screen animate-lung-breathe"
            />

            {/* Floating Frosted Glass Callout Badges (Dentivo Style) */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="glass-pill absolute left-5 top-5 z-20 rounded-2xl px-3.5 py-2 text-xs"
            >
              <div className="flex items-center gap-2 font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-[#72f6d5] shadow-[0_0_10px_#72f6d5]" />
                {previewModality === "ct" ? "Parenchymal Nodule" : "Lobar Consolidation"}
              </div>
              <div className="text-[11px] text-white/70">Grad-CAM layer: out_relu</div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="glass-pill absolute bottom-5 right-5 z-20 rounded-2xl px-4 py-2.5 text-xs"
            >
              <div className="text-[10px] uppercase tracking-wider text-[#72f6d5]">Input Pipeline</div>
              <div className="font-mono text-sm font-bold text-white">224×224 RGB · [0, 1]</div>
            </motion.div>
          </div>

          {/* Right: Interactive Dual-Modality Explorer (Dentivo Emerald & Seafoam Mint) */}
          <div className="space-y-6 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary">
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                  Dual-Modality Clinical Architecture
                </span>
                <h2 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
                  Two Specialized Thoracic Models
                </h2>
              </div>

              <div className="inline-flex rounded-full bg-[#07221e]/10 p-1 text-xs dark:bg-white/10">
                <button
                  type="button"
                  onClick={() => setPreviewModality("xray")}
                  className={`relative rounded-full px-4 py-2 font-semibold transition-all ${
                    previewModality === "xray"
                      ? "bg-[#07221e] text-[#72f6d5] shadow-[0_0_18px_rgba(114,246,213,0.25)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Chest X-Ray (3-Class)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModality("ct")}
                  className={`relative rounded-full px-4 py-2 font-semibold transition-all ${
                    previewModality === "ct"
                      ? "bg-[#07221e] text-[#72f6d5] shadow-[0_0_18px_rgba(114,246,213,0.25)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Chest CT (4-Class)
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {previewModality === "ct" ? (
                <motion.div
                  key="ct-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-4"
                >
                  <div className="emerald-stage relative overflow-hidden rounded-3xl border border-[#72f6d5]/25 p-6 text-white shadow-elevated">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full border border-[#72f6d5]/40 bg-[#72f6d5]/15 px-3 py-1 font-mono text-xs font-semibold text-[#72f6d5]">
                        model/ct_mobilenetv2_4class.h5
                      </span>
                      <span className="text-xs text-white/75">Kaggle Chest CT-Scan Images Dataset</span>
                    </div>
                    <h3 className="mt-3 font-display text-2xl font-bold text-white">
                      Chest CT · Lung-Cancer Subtype Classification
                    </h3>
                    <p className="mt-1 text-sm text-white/85">
                      Classifies axial chest CT slices across three non-small cell lung carcinoma (NSCLC) subtypes vs. normal lung parenchyma. Does not classify pneumonia on CT.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { name: "Adenocarcinoma", role: "Peripheral nodules / ground-glass opacities", tag: "Class 0" },
                      { name: "Large Cell Carcinoma", role: "Bulky peripheral parenchymal masses", tag: "Class 1" },
                      { name: "Normal", role: "Healthy lung parenchyma & airways", tag: "Class 2" },
                      { name: "Squamous Cell Carcinoma", role: "Central hilar / bronchial masses", tag: "Class 3" },
                    ].map((item) => (
                      <motion.div
                        key={item.name}
                        whileHover={{ y: -3 }}
                        className="rounded-2xl border border-border/70 bg-muted/40 p-4 transition-colors hover:border-secondary/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm font-bold text-foreground">{item.name}</span>
                          <span className="rounded-full bg-[#07221e] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#72f6d5]">
                            {item.tag}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{item.role}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="xray-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-4"
                >
                  <div className="emerald-stage relative overflow-hidden rounded-3xl border border-[#72f6d5]/25 p-6 text-white shadow-elevated">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full border border-[#72f6d5]/40 bg-[#72f6d5]/15 px-3 py-1 font-mono text-xs font-semibold text-[#72f6d5]">
                        model/pneumonia_mobilenetv2_3class.h5
                      </span>
                      <span className="text-xs text-white/75">Kermany Chest X-Ray Pneumonia Dataset</span>
                    </div>
                    <h3 className="mt-3 font-display text-2xl font-bold text-white">
                      Chest X-Ray · Pneumonia Etiology Differentiation
                    </h3>
                    <p className="mt-1 text-sm text-white/85">
                      Distinguishes bacterial lobar pneumonia and viral interstitial pneumonia from clear lung fields on AP/PA chest radiographs.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { name: "Bacterial", role: "Focal lobar airspace consolidation", tag: "Class 0" },
                      { name: "Normal", role: "Clear lung fields & costophrenic angles", tag: "Class 1" },
                      { name: "Viral", role: "Bilateral interstitial & perihilar infiltrates", tag: "Class 2" },
                    ].map((item) => (
                      <motion.div
                        key={item.name}
                        whileHover={{ y: -3 }}
                        className="rounded-2xl border border-border/70 bg-muted/40 p-4 transition-colors hover:border-secondary/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm font-bold text-foreground">{item.name}</span>
                          <span className="rounded-full bg-[#07221e] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#72f6d5]">
                            {item.tag}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{item.role}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Capabilities Grid */}
        <div id="features" className="mb-12 text-center">
          <h2 className="mb-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Engineered for Clinical Calm &amp; Speed
          </h2>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
            Every surface is designed to reduce cognitive load while surfacing high-confidence diagnostic evidence.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -6 }}
              className="group rounded-[28px] border border-border/60 bg-card p-7 shadow-card transition-all hover:border-secondary/40 hover:shadow-elevated"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07221e] text-[#72f6d5] shadow-sm transition-all group-hover:scale-110 group-hover:bg-[#72f6d5] group-hover:text-[#07221e] group-hover:shadow-[0_0_24px_rgba(114,246,213,0.5)]">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-display text-lg font-bold text-card-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
