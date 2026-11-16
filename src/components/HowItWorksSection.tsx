import { motion } from "framer-motion";
import { Upload, Cpu, FileCheck, History } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Select Modality & Patient",
    description: "Choose Chest X-ray or Chest CT, link an existing or new patient record, and drop in the scan.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "Real-Time Neural Inference",
    description: "The modality-specific MobileNetV2 bundle runs 3-class pneumonia or 4-class CT oncology scoring.",
  },
  {
    icon: FileCheck,
    step: "03",
    title: "Inspect Grad-CAM Blend",
    description: "Scrub the interactive Grad-CAM overlay slider to inspect parenchymal opacities or nodules.",
  },
  {
    icon: History,
    step: "04",
    title: "Export Clinical Report",
    description: "Download a formatted diagnostic PDF or share instant summaries via WhatsApp and email.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="bg-muted/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Streamlined 4-Step Diagnostic Flow
          </h2>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:text-base">
            From patient intake to explainable Grad-CAM visualization and PDF reporting in under three seconds.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-[28px] border border-border/60 bg-card p-7 shadow-card"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-2xl font-bold text-muted-foreground/30">{s.step}</span>
              </div>
              <h3 className="mb-2 font-display text-lg font-bold text-foreground">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
