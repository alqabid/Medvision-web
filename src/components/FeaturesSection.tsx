import { motion } from "framer-motion";
import { Brain, ShieldCheck, Upload, Clock, BarChart3, Lock } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Deep Learning Model",
    description: "MobileNetV2 transfer learning architecture fine-tuned on thousands of chest X-ray images.",
  },
  {
    icon: Upload,
    title: "Easy Upload",
    description: "Drag and drop chest X-ray images in standard medical formats for instant analysis.",
  },
  {
    icon: Clock,
    title: "Real-Time Results",
    description: "Get AI predictions with confidence scores in under 3 seconds.",
  },
  {
    icon: ShieldCheck,
    title: "RBAC Access Control",
    description: "Role-based permissions for admins, practitioners, and authorized users.",
  },
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "AES-256 encryption at rest, TLS in transit. EXIF metadata automatically stripped.",
  },
  {
    icon: BarChart3,
    title: "Case History Tracking",
    description: "Track patient analyses over time with structured, searchable records.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-bold text-foreground">
            Built for <span className="text-secondary">Healthcare</span>
          </h2>
          <p className="mx-auto max-w-lg text-muted-foreground">
            Enterprise-grade AI diagnostics with security measures designed for sensitive medical data.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-secondary/10">
                <feature.icon className="h-5 w-5 text-secondary" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-card-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
