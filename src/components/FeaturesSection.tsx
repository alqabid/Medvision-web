import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Layers,
  Eye,
  FileText,
  ShieldCheck,
  HeartPulse,
  ArrowRight,
  Stethoscope,
  ScanLine,
  CheckCircle2,
} from "lucide-react";
import lungsHero from "@/assets/thoracic-lungs-hero.jpg";
import { useAuth } from "@/hooks/useAuth";

interface FindingNode {
  id: string;
  name: string;
  region: string;
  summary: string;
  clinicalNote: string;
  icon: typeof Layers;
  pillPosition: string;
  glowPosition: { x: string; y: string };
}

const CT_FINDINGS: FindingNode[] = [
  {
    id: "adeno",
    name: "Adenocarcinoma",
    region: "Outer Parenchymal Zone",
    summary: "Surfaces subtle peripheral nodules and ground-glass tissue densities along the outer lung fields.",
    clinicalNote: "Visual attention highlights subpleural and peripheral parenchymal zones for targeted radiologist review.",
    icon: ScanLine,
    pillPosition: "lg:left-[4%] lg:top-[24%]",
    glowPosition: { x: "35%", y: "38%" },
  },
  {
    id: "squamous",
    name: "Squamous Cell",
    region: "Central Bronchial Airway",
    summary: "Identifies central hilar and major bronchial tissue patterns near the primary airway branches.",
    clinicalNote: "Focuses visual weight along the central mediastinal and perihilar bronchial tree.",
    icon: Stethoscope,
    pillPosition: "lg:left-[4%] lg:top-[62%]",
    glowPosition: { x: "48%", y: "48%" },
  },
  {
    id: "large-cell",
    name: "Large Cell",
    region: "Lateral Parenchymal Tissue",
    summary: "Detects well-defined peripheral parenchymal mass formations across axial thoracic slices.",
    clinicalNote: "Guides attention to focal tissue asymmetry across middle and lower parenchymal lobes.",
    icon: Layers,
    pillPosition: "lg:right-[4%] lg:top-[24%]",
    glowPosition: { x: "65%", y: "58%" },
  },
  {
    id: "ct-normal",
    name: "Healthy Parenchyma",
    region: "Bilateral Clear Lung Fields",
    summary: "Confirms symmetrical lung parenchyma, unobstructed bronchial airways, and preserved vascular markings.",
    clinicalNote: "Balanced bilateral distribution with no focal nodular or mass-like attention hotspots.",
    icon: HeartPulse,
    pillPosition: "lg:right-[4%] lg:top-[62%]",
    glowPosition: { x: "50%", y: "50%" },
  },
];

const XRAY_FINDINGS: FindingNode[] = [
  {
    id: "bacterial",
    name: "Bacterial Pneumonia",
    region: "Focal Lobar Airspace",
    summary: "Highlights dense, localized lobar airspace consolidation and air bronchogram patterns.",
    clinicalNote: "Concentrates visual highlight over the affected pulmonary lobe to support rapid triage.",
    icon: Activity,
    pillPosition: "lg:left-[5%] lg:top-[38%]",
    glowPosition: { x: "36%", y: "60%" },
  },
  {
    id: "viral",
    name: "Viral Pneumonia",
    region: "Bilateral Interstitial",
    summary: "Captures diffuse perihilar and bilateral interstitial markings across both lung fields.",
    clinicalNote: "Maps subtle bilateral interstitial patterns that can be challenging to spot on initial inspection.",
    icon: ScanLine,
    pillPosition: "lg:right-[5%] lg:top-[26%]",
    glowPosition: { x: "62%", y: "46%" },
  },
  {
    id: "xray-normal",
    name: "Clear Lung Fields",
    region: "Unobstructed Radiograph",
    summary: "Verifies clear cardiophrenic and costophrenic angles with normal pulmonary vascularity.",
    clinicalNote: "Uniform lung transparency without focal consolidation or pleural effusion.",
    icon: HeartPulse,
    pillPosition: "lg:right-[5%] lg:top-[62%]",
    glowPosition: { x: "50%", y: "50%" },
  },
];

const FeaturesSection = () => {
  const { user } = useAuth();
  const [modality, setModality] = useState<"ct" | "xray">("ct");
  const [selectedId, setSelectedId] = useState<string>("adeno");

  const activeList = modality === "ct" ? CT_FINDINGS : XRAY_FINDINGS;
  const activeFinding = activeList.find((f) => f.id === selectedId) ?? activeList[0];

  const handleSwitchModality = (next: "ct" | "xray") => {
    setModality(next);
    setSelectedId(next === "ct" ? "adeno" : "bacterial");
  };

  return (
    <section id="modalities" className="bg-background px-3 py-12 sm:px-6">
      {/* Dentivo-Style Full-Canvas Interactive Anatomical Stage */}
      <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[36px] bg-[#07221e] px-6 py-16 text-white shadow-elevated sm:px-10 lg:py-20">
        {/* Soft Ambient Seafoam Studio Lighting */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(114,246,213,0.16),transparent_60%)]" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[680px] -translate-x-1/2 rounded-full bg-[#72f6d5]/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl">
          {/* Editorial Top Header + Tactile Modality Switcher (Zero dots or bordered eyebrow badges) */}
          <div className="flex flex-col items-center text-center">
            <h2 className="max-w-3xl font-display text-3xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl">
              Two Ways to See.{" "}
              <span className="text-[#72f6d5]">One Calm Experience.</span>
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
              Switch between cross-sectional CT oncology care and chest radiography to explore how MedVision guides clinical attention across the lungs.
            </p>

            {/* Clean Soft-Glass Segmented Switcher */}
            <div className="mt-7 inline-flex rounded-full bg-white/[0.07] p-1.5 backdrop-blur-xl">
              <button
                type="button"
                onClick={() => handleSwitchModality("ct")}
                className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                  modality === "ct"
                    ? "bg-[#72f6d5] text-[#06221e] shadow-[0_0_24px_rgba(114,246,213,0.45)]"
                    : "text-white/75 hover:text-white"
                }`}
              >
                <Layers className="h-4 w-4" />
                Chest CT · Oncology Care
              </button>
              <button
                type="button"
                onClick={() => handleSwitchModality("xray")}
                className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                  modality === "xray"
                    ? "bg-[#72f6d5] text-[#06221e] shadow-[0_0_24px_rgba(114,246,213,0.45)]"
                    : "text-white/75 hover:text-white"
                }`}
              >
                <Activity className="h-4 w-4" />
                Chest X-Ray · Pneumonia Care
              </button>
            </div>
          </div>

          {/* Center Interactive Orbital Lungs Canvas (Matching Dentivo Hero Style) */}
          <div className="relative my-10 flex flex-col items-center justify-center lg:my-12 lg:min-h-[420px]">
            {/* Smooth Continuous Orbital Arc Behind the Lungs (No dashed lines) */}
            <svg
              viewBox="0 0 1100 420"
              fill="none"
              className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-65 lg:block"
            >
              <path
                d="M 140 130 Q 550 -10 960 130"
                stroke="rgba(114,246,213,0.16)"
                strokeWidth="1.25"
              />
              <path
                d="M 140 290 Q 550 420 960 290"
                stroke="rgba(114,246,213,0.16)"
                strokeWidth="1.25"
              />
              <motion.path
                d="M 140 130 Q 550 -10 960 130"
                stroke="#72f6d5"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0.22, pathOffset: 0, opacity: 0.25 }}
                animate={{ pathOffset: [0, 0.78, 0], opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
            </svg>

            {/* Central Breathing 3D Translucent Lungs with Soft Organic Bioluminescent Bloom */}
            <div className="relative mx-auto flex h-[320px] w-full max-w-[440px] items-center justify-center sm:h-[370px]">
              {/* Dynamic Soft Anatomical Light Bloom (No hard border, no dot) */}
              <motion.div
                key={activeFinding.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ left: activeFinding.glowPosition.x, top: activeFinding.glowPosition.y }}
                className="pointer-events-none absolute z-20 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#72f6d5]/30 blur-2xl"
              />

              <img
                src={lungsHero}
                alt="Interactive Thoracic Lungs"
                className="relative z-10 h-full w-full rounded-3xl object-cover object-center opacity-95 mix-blend-screen animate-lung-breathe"
              />
            </div>

            {/* Orbital Glass Finding Pills (Dentivo Circular Mint Icon + Soft Glass Pill Layout) */}
            <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-0 lg:block">
              {activeList.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = item.id === activeFinding.id;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setSelectedId(item.id)}
                    onClick={() => setSelectedId(item.id)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{
                      opacity: 1,
                      y: [0, idx % 2 === 0 ? -5 : 5, 0],
                    }}
                    whileHover={{ scale: 1.04 }}
                    transition={{
                      opacity: { duration: 0.4, delay: idx * 0.06 },
                      y: { duration: 4.5 + idx * 0.5, repeat: Infinity, ease: "easeInOut" },
                    }}
                    className={`group flex items-center gap-3.5 rounded-full px-5 py-3.5 text-left backdrop-blur-xl transition-all lg:absolute lg:w-[265px] ${
                      item.pillPosition
                    } ${
                      isSelected
                        ? "bg-white/15 shadow-[0_0_32px_rgba(114,246,213,0.28)]"
                        : "bg-white/[0.06] hover:bg-white/10"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${
                        isSelected
                          ? "bg-[#72f6d5] text-[#06221e] shadow-[0_0_18px_rgba(114,246,213,0.8)]"
                          : "bg-[#72f6d5]/80 text-[#06221e]"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold tracking-tight text-white">{item.name}</div>
                      <div className="truncate text-[11px] text-white/75">{item.region}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Bottom Unified Clinical Observation Bar */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFinding.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mx-auto flex max-w-4xl flex-col justify-between gap-6 rounded-[28px] bg-white/[0.07] p-6 backdrop-blur-xl sm:flex-row sm:items-center sm:px-8"
            >
              <div className="space-y-1.5 text-left">
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <span className="font-display text-xl font-bold text-white">{activeFinding.name}</span>
                  <span className="text-xs font-medium text-[#72f6d5]">{activeFinding.region}</span>
                </div>
                <p className="text-sm leading-relaxed text-white/85">{activeFinding.summary}</p>
                <p className="text-xs text-white/65">{activeFinding.clinicalNote}</p>
              </div>

              <Link
                to={user ? "/dashboard" : "/signup"}
                className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-full bg-[#72f6d5] px-6 py-3 text-xs font-bold text-[#06221e] shadow-[0_0_24px_rgba(114,246,213,0.4)] transition-transform hover:scale-[1.03]"
              >
                {user ? "Open in Workstation" : "Try Live Scan Review"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Calm Editorial Capabilities Showcase (3-Card Story Layout) */}
      <div id="features" className="mx-auto mt-20 max-w-7xl px-3 sm:px-6">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-secondary">
              Designed for Physicians
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Clarity Without Visual Clutter
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Every interaction is crafted to support calm clinical judgment, from transparent visual attention maps to structured patient follow-ups.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Card 1: Visual Attention Mapping */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] bg-card p-8 shadow-card transition-all hover:shadow-elevated"
          >
            <div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#07221e] text-[#72f6d5]">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Transparent Visual Attention
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Blend smooth thermal attention overlays directly over the original scan so you can inspect parenchymal nodules or lobar consolidations without losing anatomical detail.
              </p>
            </div>

            <div className="mt-8 rounded-2xl bg-[#07221e] p-4 text-white">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-white/80">Interactive Overlay Blend</span>
                <span className="font-semibold text-[#72f6d5]">Adjustable Opacity</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#72f6d5]/50 to-[#72f6d5]" />
              </div>
            </div>
          </motion.div>

          {/* Card 2: Structured Clinical Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] bg-card p-8 shadow-card transition-all hover:shadow-elevated"
          >
            <div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#07221e] text-[#72f6d5]">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Consultation-Ready Reports
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Generate clean, printable PDF reports complete with patient context, side-by-side scan views, probability breakdowns, and clinician notes in a single click.
              </p>
            </div>

            <div className="mt-8 space-y-2 rounded-2xl bg-muted/40 p-4">
              {["Side-by-side original & highlighted imagery", "Modality-specific clinical guidance", "Instant PDF & team summary sharing"].map(
                (line) => (
                  <div key={line} className="flex items-center gap-2.5 text-xs font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />
                    <span>{line}</span>
                  </div>
                )
              )}
            </div>
          </motion.div>

          {/* Card 3: Longitudinal Patient Continuity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] bg-card p-8 shadow-card transition-all hover:shadow-elevated"
          >
            <div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#07221e] text-[#72f6d5]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Longitudinal Patient Continuity
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Organize follow-up studies by patient across both Chest X-ray and Chest CT, with automatic privacy scrubbing before any image is stored.
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between rounded-2xl bg-[#07221e] px-4 py-3.5 text-xs text-white">
              <span className="font-semibold">Patient Timeline &amp; Records</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-[#72f6d5]">
                X-Ray + CT
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
