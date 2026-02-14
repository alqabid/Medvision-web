import { motion } from "framer-motion";
import { Shield, Lock, Eye, Key, Server, FileX } from "lucide-react";

const securityFeatures = [
  {
    icon: Key,
    title: "JWT Authentication",
    description: "Secure token-based authentication with bcrypt password hashing.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Admin, Practitioner, and Authorized User roles with granular permissions.",
  },
  {
    icon: Lock,
    title: "AES-256 Encryption",
    description: "All medical images encrypted at rest using AES-256 standard.",
  },
  {
    icon: Server,
    title: "HTTPS / TLS",
    description: "All data in transit protected with SSL/TLS encryption.",
  },
  {
    icon: FileX,
    title: "EXIF Stripping",
    description: "Automatic removal of metadata from uploaded images for anonymization.",
  },
  {
    icon: Eye,
    title: "Row-Level Security",
    description: "Database policies ensure users can only access their own data.",
  },
];

const SecuritySection = () => {
  return (
    <section id="security" className="bg-hero py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-display text-4xl font-bold text-primary-foreground">
            Enterprise <span className="text-gradient">Security</span>
          </h2>
          <p className="mx-auto max-w-lg text-primary-foreground/60">
            Multiple layers of protection designed specifically for sensitive medical data.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {securityFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-6 backdrop-blur-sm"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent/20">
                <feature.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-primary-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-primary-foreground/60">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
