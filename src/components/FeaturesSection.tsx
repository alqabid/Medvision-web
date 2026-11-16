import { motion } from "framer-motion";
import { Brain, ShieldCheck, Eye, Clock, BarChart3, Lock, Layers, FileText } from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Dual-Modality AI Engine",
    description: "Dedicated MobileNetV2 classifiers for Chest X-ray (3-class pneumonia) and Chest CT (4-class lung-cancer subtypes) served via FastAPI.",
  },
  {
    icon: Eye,
    title: "Grad-CAM Explainability",
    description: "Every prediction includes a gradient-weighted class activation heatmap highlighting lung consolidations on X-ray or nodules and masses on CT.",
  },
  {
    icon: FileText,
    title: "Clinical PDF & Instant Sharing",
    description: "Generate structured diagnostic PDFs with patient demographics, probability bars, and side-by-side Grad-CAM overlays, or share via WhatsApp & email.",
  },
  {
    icon: ShieldCheck,
    title: "RBAC & Clinical Governance",
    description: "Role-based permissions for Admins, Medical Practitioners, and Authorized Users with a tamper-evident audit trail.",
  },
  {
    icon: Lock,
    title: "Client-Side EXIF Anonymization",
    description: "Camera and device metadata are stripped in the browser before upload, with encrypted storage and Row-Level Security in Supabase.",
  },
  {
    icon: BarChart3,
    title: "Longitudinal Patient Records",
    description: "Link both X-ray and CT analyses to individual patient profiles, filter by scan modality, export CSV cohorts, and monitor multi-class trends.",
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
            Built for <span className="text-secondary">Thoracic Clinical Workflows</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Combining multi-modality deep learning, visual model interpretability, and patient-centric record management.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
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

        {/* Clinical Model Reference Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        >
          <div className="border-b border-border bg-muted/40 px-6 py-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Supported Imaging Modalities &amp; Diagnostic Scope</h3>
            <p className="text-xs text-muted-foreground">
              Each modality uses a specialized transfer-learning pipeline trained on domain-specific thoracic datasets.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3.5 font-medium">Modality</th>
                  <th className="px-6 py-3.5 font-medium">Clinical Indication</th>
                  <th className="px-6 py-3.5 font-medium">Output Classes</th>
                  <th className="px-6 py-3.5 font-medium">Training Dataset</th>
                  <th className="px-6 py-3.5 font-medium">Explainability Focus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="px-6 py-4 font-display font-semibold text-secondary">Chest X-Ray (`xray`)</td>
                  <td className="px-6 py-4 text-foreground">Pneumonia Screening &amp; Etiology</td>
                  <td className="px-6 py-4 text-muted-foreground">Bacterial, Viral, Normal (3-class)</td>
                  <td className="px-6 py-4 text-muted-foreground">Kermany Chest X-Ray Pneumonia</td>
                  <td className="px-6 py-4 text-muted-foreground">Lobar consolidations &amp; interstitial opacities</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-display font-semibold text-info">Chest CT (`ct`)</td>
                  <td className="px-6 py-4 text-foreground">Lung-Cancer Subtype Classification</td>
                  <td className="px-6 py-4 text-muted-foreground">Adenocarcinoma, Large Cell, Squamous Cell, Normal (4-class)</td>
                  <td className="px-6 py-4 text-muted-foreground">Kaggle Chest CT-Scan Images (Oncology)</td>
                  <td className="px-6 py-4 text-muted-foreground">Pulmonary nodules, masses &amp; parenchymal lesions</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
