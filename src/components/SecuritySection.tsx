import { motion } from "framer-motion";
import { Shield, Lock, Eye, Key, Server, FileX } from "lucide-react";

const securityFeatures = [
  {
    icon: Key,
    title: "Two-Factor Email Verification",
    description: "Every sign-in requires your password plus a one-time verification code emailed directly to the clinician.",
  },
  {
    icon: Shield,
    title: "Role-Based Access Control",
    description: "Admin, Practitioner, and Authorized User roles with granular permissions and policy enforcement.",
  },
  {
    icon: Lock,
    title: "Encrypted Clinical Storage",
    description: "Chest X-rays and CT scans are stored in private buckets with encryption at rest by default.",
  },
  {
    icon: Server,
    title: "TLS Transport Security",
    description: "All inference requests and patient record queries are protected in transit via HTTPS/TLS.",
  },
  {
    icon: FileX,
    title: "Browser-Side EXIF Stripping",
    description: "Automatic removal of camera and device metadata before any image leaves the browser.",
  },
  {
    icon: Eye,
    title: "Row-Level Security (RLS)",
    description: "PostgreSQL row-level security policies ensure practitioners only access authorized patient records.",
  },
];

const SecuritySection = () => {
  return (
    <section id="security" className="bg-background px-3 py-12 sm:px-6">
      <div className="mx-auto max-w-[1440px] rounded-[36px] bg-[#07221e] px-6 py-20 text-white shadow-elevated sm:px-12">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="mb-3 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Clinical-Grade <span className="text-[#72f6d5]">Data Governance</span>
            </h2>
            <p className="mx-auto max-w-lg text-sm text-white/70 sm:text-base">
              Built from the ground up with defense-in-depth controls for sensitive thoracic imaging data.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {securityFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-pill rounded-[26px] p-6 transition-transform hover:-translate-y-0.5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#72f6d5] text-[#06221e]">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-display text-lg font-bold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-white/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
