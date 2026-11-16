import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, Eye, FileText, ShieldCheck, Lock, BarChart3, Activity, CheckCircle2 } from "lucide-react";
import lungsClinical from "@/assets/thoracic-lungs-clinical.jpg";

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

const FeaturesSection = () => {
  const [previewModality, setPreviewModality] = useState<"xray" | "ct">("ct");

  return (
    <section id="modalities" className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* ProHealth / Medikals-Inspired Interactive Clinical Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24 grid items-center gap-8 rounded-[36px] border border-border/70 bg-card p-6 shadow-elevated sm:p-10 lg:grid-cols-12"
        >
          {/* Left: 3D Anatomical Lungs Interactive Preview (ProHealth style) */}
          <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-[28px] bg-[#f4f7fb] p-6 dark:bg-muted/30 lg:col-span-5">
            {/* Vertical Calibration Scale on Left (ProHealth detail) */}
            <div className="pointer-events-none absolute left-4 top-1/2 hidden -translate-y-1/2 flex-col items-start gap-2.5 text-[10px] font-mono text-muted-foreground/60 sm:flex">
              <span>100% —</span>
              <span>75% —</span>
              <span className="font-bold text-[#2563eb]">91.4% ━━</span>
              <span>50% —</span>
              <span>25% —</span>
            </div>

            <img
              src={lungsClinical}
              alt="3D Anatomical Lungs & Bronchial Tree"
              className="h-80 w-auto object-contain animate-lung-breathe"
            />

            {/* Floating Glass Callout Badges */}
            <div className="absolute left-5 top-6 rounded-2xl border border-white/80 bg-white/90 px-3.5 py-2 text-xs shadow-card backdrop-blur-md dark:border-border dark:bg-card/90">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
                {previewModality === "ct" ? "Parenchymal Nodule" : "Lobar Consolidation"}
              </div>
              <div className="text-[11px] text-muted-foreground">Grad-CAM layer: out_relu</div>
            </div>

            <div className="absolute bottom-5 right-5 rounded-2xl border border-white/80 bg-white/90 px-4 py-2.5 text-xs shadow-card backdrop-blur-md dark:border-border dark:bg-card/90">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Input Pipeline</div>
              <div className="font-mono text-sm font-bold text-foreground">224×224 RGB · [0, 1]</div>
            </div>
          </div>

          {/* Right: Interactive Dual-Modality Explorer (Medikals / ProHealth cards) */}
          <div className="space-y-6 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563eb]">
                  Dual-Modality Clinical Architecture
                </span>
                <h2 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
                  Two Specialized Thoracic Models
                </h2>
              </div>

              <div className="inline-flex rounded-full bg-muted p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewModality("xray")}
                  className={`rounded-full px-4 py-2 font-semibold transition-all ${
                    previewModality === "xray"
                      ? "bg-[#2563eb] text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Chest X-Ray (3-Class)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModality("ct")}
                  className={`rounded-full px-4 py-2 font-semibold transition-all ${
                    previewModality === "ct"
                      ? "bg-[#2563eb] text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Chest CT (4-Class)
                </button>
              </div>
            </div>

            {previewModality === "ct" ? (
              <motion.div
                key="ct-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="rounded-3xl bg-[#2563eb] p-6 text-white shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                      model/ct_mobilenetv2_4class.h5
                    </span>
                    <span className="text-xs text-white/80">Kaggle Chest CT-Scan Images Dataset</span>
                  </div>
                  <h3 className="mt-3 font-display text-2xl font-bold">
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
                    <div key={item.name} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm font-bold text-foreground">{item.name}</span>
                        <span className="rounded-full bg-card px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                          {item.tag}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.role}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="xray-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="rounded-3xl bg-[#0b3b34] p-6 text-white shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-[#72f6d5]">
                      model/pneumonia_mobilenetv2_3class.h5
                    </span>
                    <span className="text-xs text-white/80">Kermany Chest X-Ray Pneumonia Dataset</span>
                  </div>
                  <h3 className="mt-3 font-display text-2xl font-bold">
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
                    <div key={item.name} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm font-bold text-foreground">{item.name}</span>
                        <span className="rounded-full bg-card px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                          {item.tag}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.role}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
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
              className="group rounded-[28px] border border-border/60 bg-card p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2563eb]/10 text-[#2563eb] transition-colors group-hover:bg-[#2563eb] group-hover:text-white">
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
