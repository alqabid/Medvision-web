import { motion } from "framer-motion";
import { Upload, ScanLine, Eye, FileCheck } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Select Modality & Patient",
    description: "Choose Chest X-ray or Chest CT, link a patient profile, and drop in the thoracic scan.",
  },
  {
    icon: ScanLine,
    step: "02",
    title: "Instant Clinical Assessment",
    description: "Evaluates the scan for pneumonia patterns on X-ray or pulmonary nodule subtypes on CT.",
  },
  {
    icon: Eye,
    step: "03",
    title: "Review Visual Attention",
    description: "Adjust the smooth visual overlay to inspect the anatomical regions that informed the finding.",
  },
  {
    icon: FileCheck,
    step: "04",
    title: "Share Clinical Summary",
    description: "Export a clean diagnostic PDF report or share structured notes directly with the care team.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            Effortless Workflow
          </span>
          <h2 className="mt-2 mb-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            From Scan to Clinical Summary in Seconds
          </h2>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:text-base">
            A calm, four-step diagnostic flow built around the rhythm of a clinical consultation.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="rounded-[30px] border border-border/60 bg-card p-7 shadow-card transition-all hover:border-secondary/40 hover:shadow-elevated"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#07221e] text-[#72f6d5]">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="font-display text-2xl font-bold text-muted-foreground/25">{s.step}</span>
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
