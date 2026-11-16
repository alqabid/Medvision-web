import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Activity, Layers, Eye, ShieldCheck } from "lucide-react";
import lungsHero from "@/assets/thoracic-lungs-hero.jpg";
import { useAuth } from "@/hooks/useAuth";

const ORBITAL_NODES = [
  {
    id: "xray",
    icon: Activity,
    title: "Chest X-Ray",
    subtitle: "3-Class Pneumonia",
    detail: "Differentiates Bacterial & Viral Pneumonia from Normal radiographs.",
    position: "lg:left-[4%] lg:top-[52%]",
  },
  {
    id: "ct",
    icon: Layers,
    title: "Chest CT",
    subtitle: "4-Class Oncology",
    detail: "Classifies Adenocarcinoma, Large Cell & Squamous Cell vs Normal CT.",
    position: "lg:left-[23%] lg:top-[48%]",
  },
  {
    id: "gradcam",
    icon: Eye,
    title: "Grad-CAM",
    subtitle: "Visual Localization",
    detail: "Highlights lobar consolidations on X-ray & parenchymal nodules on CT.",
    position: "lg:right-[23%] lg:top-[48%]",
  },
  {
    id: "privacy",
    icon: ShieldCheck,
    title: "Zero-EXIF",
    subtitle: "Protected Records",
    detail: "Strips camera metadata client-side with RLS-secured patient history.",
    position: "lg:right-[4%] lg:top-[52%]",
  },
];

const HeroSection = () => {
  const { user } = useAuth();
  const [activeNode, setActiveNode] = useState<string>("ct");
  const currentNode = ORBITAL_NODES.find((n) => n.id === activeNode) ?? ORBITAL_NODES[1];

  return (
    <section className="relative bg-background px-3 pt-20 pb-8 sm:px-6">
      <div className="relative mx-auto min-h-[88vh] max-w-[1440px] overflow-hidden rounded-[36px] border border-white/10 bg-[#07221e] shadow-elevated">
        {/* Central 3D Translucent Lungs Backdrop (Dentivo Studio Style) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <img
            src={lungsHero}
            alt="3D Translucent Thoracic Lungs"
            className="h-full w-full object-cover object-center opacity-90 animate-lung-breathe"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07221e]/80 via-transparent to-[#07221e]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_54%,rgba(114,246,213,0.16),transparent_58%)]" />
        </div>

        {/* Animated SVG Orbital Arc connecting the 4 glass nodes */}
        <svg
          viewBox="0 0 1200 500"
          fill="none"
          className="pointer-events-none absolute inset-x-0 top-[34%] hidden w-full opacity-75 lg:block"
        >
          <path
            d="M 90 360 Q 600 40 1110 360"
            stroke="url(#orbitalGrad)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
          <motion.path
            d="M 90 360 Q 600 40 1110 360"
            stroke="#72f6d5"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0.18, pathOffset: 0, opacity: 0.2 }}
            animate={{ pathOffset: [0, 0.82, 0], opacity: [0.25, 0.9, 0.25] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="orbitalGrad" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(114,246,213,0.05)" />
              <stop offset="50%" stopColor="rgba(114,246,213,0.75)" />
              <stop offset="100%" stopColor="rgba(114,246,213,0.05)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Main Hero Content Container */}
        <div className="relative z-10 mx-auto flex min-h-[86vh] max-w-7xl flex-col justify-between px-6 py-12 sm:px-10 lg:py-14">
          {/* Top Centered Editorial Display Headline (Dentivo Typography) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mx-auto mt-2 max-w-4xl text-center"
          >
            <h1 className="font-display text-4xl font-bold leading-[1.06] tracking-[-0.035em] text-white sm:text-6xl md:text-7xl">
              Precision Thoracic
              <span className="block">
                <span className="text-[#72f6d5]">Clarity</span> in Every Scan
              </span>
            </h1>
          </motion.div>

          {/* Center Interactive Orbital Glass Pills (Dentivo 4-node layout) */}
          <div className="relative my-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:my-0 lg:block lg:h-[260px]">
            {ORBITAL_NODES.map((node, idx) => {
              const Icon = node.icon;
              const isSelected = activeNode === node.id;
              return (
                <motion.button
                  key={node.id}
                  type="button"
                  onMouseEnter={() => setActiveNode(node.id)}
                  onClick={() => setActiveNode(node.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: [0, idx % 2 === 0 ? -6 : 6, 0],
                  }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{
                    opacity: { duration: 0.55, delay: 0.15 + idx * 0.1 },
                    y: { duration: 4.5 + idx * 0.6, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className={`glass-pill group flex items-center gap-3.5 rounded-full px-5 py-3.5 text-left transition-all lg:absolute lg:w-[225px] ${
                    node.position
                  } ${
                    isSelected
                      ? "border-[#72f6d5]/70 bg-white/15 shadow-[0_0_34px_rgba(114,246,213,0.3)] scale-[1.03]"
                      : "hover:border-[#72f6d5]/40 hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${
                      isSelected
                        ? "bg-[#72f6d5] text-[#06221e] shadow-[0_0_20px_rgba(114,246,213,0.75)]"
                        : "bg-[#72f6d5]/85 text-[#06221e]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold tracking-tight text-white">{node.title}</div>
                    <div className="text-[11px] leading-snug text-white/75">{node.subtitle}</div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Bottom Split Row: Narrative & Mint CTA (Left) + Live Interactive Node Readout (Right) */}
          <div className="flex flex-col items-start justify-between gap-8 pt-6 lg:flex-row lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="max-w-sm space-y-5"
            >
              <p className="text-base leading-relaxed text-white/85 sm:text-lg">
                Dual-modality deep learning for <span className="font-semibold text-white">Chest X-ray pneumonia</span> and{" "}
                <span className="font-semibold text-[#72f6d5]">Chest CT lung-cancer</span> classification, engineered for clinical clarity.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={user ? "/dashboard" : "/signup"}
                  className="inline-flex items-center gap-3 rounded-full bg-[#72f6d5] px-7 py-3.5 text-sm font-bold text-[#06221e] shadow-[0_0_28px_rgba(114,246,213,0.45)] transition-all hover:scale-[1.02] hover:bg-[#89f9dd]"
                >
                  {user ? "Launch Workstation" : "Analyze Your First Scan"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            {/* Bottom-Right Floating Glass Readout Card */}
            <motion.div
              key={currentNode.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="glass-pill w-full max-w-md rounded-3xl p-5 text-left"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#72f6d5]">
                  <span className="h-2 w-2 rounded-full bg-[#72f6d5]" />
                  {currentNode.title} · {currentNode.subtitle}
                </span>
                <span className="font-mono text-[11px] text-white/60">MobileNetV2 · 224×224</span>
              </div>
              <p className="text-xs leading-relaxed text-white/80">{currentNode.detail}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {currentNode.id === "xray" ? (
                  ["Bacterial Pneumonia", "Viral Pneumonia", "Normal"].map((c) => (
                    <span key={c} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/90">
                      {c}
                    </span>
                  ))
                ) : (
                  ["Adenocarcinoma", "Large Cell Carcinoma", "Squamous Cell Carcinoma", "Normal"].map((c) => (
                    <span key={c} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/90">
                      {c}
                    </span>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
