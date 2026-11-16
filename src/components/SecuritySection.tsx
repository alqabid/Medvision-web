import { motion } from "framer-motion";
import { Shield, Lock, Eye, Key, CheckCircle2 } from "lucide-react";

const pillars = [
  {
    icon: Shield,
    title: "Care-Team Access Controls",
    description: "Dedicated permissions for practitioners keep patient studies restricted to authorized care teams.",
  },
  {
    icon: Lock,
    title: "Automatic Privacy Scrubbing",
    description: "Embedded device and camera identifiers are automatically stripped in the browser before any scan is stored.",
  },
  {
    icon: Eye,
    title: "Transparent Clinical Audit",
    description: "Every diagnostic review and report export is logged to support clinical governance and quality assurance.",
  },
  {
    icon: Key,
    title: "Optional Two-Step Verification",
    description: "Clinicians can enable one-time email verification codes alongside password sign-in for sensitive workstations.",
  },
];

const SecuritySection = () => {
  return (
    <section id="security" className="bg-background px-3 py-10 sm:px-6">
      <div className="mx-auto max-w-[1440px] rounded-[36px] bg-[#07221e] px-6 py-16 text-white shadow-elevated sm:px-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-5 lg:col-span-5"
            >
              <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                Built Around <span className="text-[#72f6d5]">Patient Trust</span>
              </h2>
              <p className="text-sm leading-relaxed text-white/75 sm:text-base">
                Sensitive thoracic studies deserve quiet, dependable protection. MedVision safeguards patient identity from the moment a scan is selected.
              </p>
              <div className="space-y-2.5 pt-2">
                {[
                  "Private encrypted clinical storage",
                  "Isolated patient records per practitioner",
                  "Human-in-the-loop radiologist correlation",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-xs font-medium text-white/85">
                    <CheckCircle2 className="h-4 w-4 text-[#72f6d5]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              {pillars.map((pillar, i) => (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="glass-pill rounded-[28px] p-6 transition-transform hover:-translate-y-0.5"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#72f6d5] text-[#06221e]">
                    <pillar.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-bold text-white">{pillar.title}</h3>
                  <p className="text-xs leading-relaxed text-white/75 sm:text-sm">{pillar.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
