import { motion } from "framer-motion";
import { Upload, Cpu, FileCheck, History } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload X-Ray",
    description: "Securely upload a chest X-ray image. Metadata is automatically stripped for anonymization.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Analysis",
    description: "Our MobileNetV2 model preprocesses and classifies the image in real time.",
  },
  {
    icon: FileCheck,
    step: "03",
    title: "View Results",
    description: "Receive a pneumonia/normal classification with a detailed confidence score.",
  },
  {
    icon: History,
    step: "04",
    title: "Track History",
    description: "All analyses are securely stored and searchable in your case history.",
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
            From upload to diagnosis in four simple steps.
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
