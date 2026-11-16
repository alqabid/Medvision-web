import { motion } from "framer-motion";
import { Upload, Cpu, FileCheck, History } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Select Modality & Upload",
    description: "Register the patient, choose Chest X-ray or Chest CT, and upload the scan. EXIF metadata is stripped automatically.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "Modality-Specific Inference",
    description: "The corresponding MobileNetV2 model runs 3-class pneumonia (X-ray) or 4-class lung-cancer (CT) inference in real time.",
  },
  {
    icon: FileCheck,
    step: "03",
    title: "Inspect Grad-CAM & Probabilities",
    description: "Review per-class confidence bars and interactive Grad-CAM heatmaps highlighting influential anatomical regions.",
  },
  {
    icon: History,
    step: "04",
    title: "Export Report & Track History",
    description: "Download a clinical PDF report, share findings with colleagues, and filter longitudinal records by scan modality.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="bg-muted/50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-bold text-foreground">
            How It <span className="text-secondary">Works</span>
          </h2>
          <p className="mx-auto max-w-lg text-muted-foreground">
            From patient registration and scan selection to explainable AI diagnosis in four steps.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="mb-4 font-display text-5xl font-bold text-secondary/15">{s.step}</div>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
                <s.icon className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
