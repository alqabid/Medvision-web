import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Scan, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-hero">
      {/* Background image overlay */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="h-full w-full object-cover opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-glow" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 pt-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5 text-sm text-secondary-foreground/80">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span className="text-accent">HIPAA-Compliant AI Diagnostics</span>
          </div>

          <h1 className="mb-6 font-display text-5xl font-bold leading-tight tracking-tight text-primary-foreground md:text-7xl">
            AI-Powered{" "}
            <span className="text-gradient">Pneumonia</span>{" "}
            Detection
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-primary-foreground/70">
            Upload chest X-ray images and receive instant, accurate AI analysis.
            Built with enterprise-grade security for healthcare professionals.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="h-12 gap-2 bg-secondary px-8 text-secondary-foreground shadow-glow hover:bg-secondary/90"
            >
              <Link to="/signup">
                <Scan className="h-5 w-5" />
                Start Analyzing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 border-primary-foreground/20 px-8 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 grid w-full max-w-2xl grid-cols-3 gap-8"
        >
          {[
            { value: "96.8%", label: "Accuracy" },
            { value: "<3s", label: "Analysis Time" },
            { value: "AES-256", label: "Encryption" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl font-bold text-accent md:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm text-primary-foreground/50">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
