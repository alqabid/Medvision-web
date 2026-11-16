import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, ArrowRight, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-4 left-0 right-0 z-50 mx-auto max-w-7xl px-6"
    >
      <div className="flex h-16 items-center justify-between rounded-full border border-white/15 bg-[#092924]/85 px-6 text-white shadow-elevated backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#72f6d5] text-[#06221e]">
            <Shield className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            MedVision
          </span>
        </Link>

        <div className="hidden items-center gap-9 md:flex">
          <a href="#modalities" className="text-sm font-medium text-white/75 transition-colors hover:text-white">
            Modalities
          </a>
          <a href="#features" className="text-sm font-medium text-white/75 transition-colors hover:text-white">
            Capabilities
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-white/75 transition-colors hover:text-white">
            Workflow
          </a>
          <a href="#security" className="text-sm font-medium text-white/75 transition-colors hover:text-white">
            Governance
          </a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#06221e] shadow-sm transition-transform hover:scale-[1.02]"
            >
              Open Workstation
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#06221e] shadow-sm transition-transform hover:scale-[1.02]"
              >
                Start Diagnosis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle Menu"
            className="rounded-full p-2 text-white/90 hover:bg-white/10"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 rounded-3xl border border-white/15 bg-[#092924]/95 p-6 text-white shadow-elevated backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-4">
            <a href="#modalities" onClick={() => setIsOpen(false)} className="text-sm font-medium text-white/80">
              Modalities
            </a>
            <a href="#features" onClick={() => setIsOpen(false)} className="text-sm font-medium text-white/80">
              Capabilities
            </a>
            <a href="#how-it-works" onClick={() => setIsOpen(false)} className="text-sm font-medium text-white/80">
              Workflow
            </a>
            <a href="#security" onClick={() => setIsOpen(false)} className="text-sm font-medium text-white/80">
              Governance
            </a>
            <hr className="border-white/10" />
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#72f6d5] px-5 py-3 text-sm font-semibold text-[#06221e]"
              >
                Open Workstation <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link
                  to="/login"
                  className="rounded-full border border-white/20 py-2.5 text-center text-sm font-medium text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#72f6d5] py-2.5 text-sm font-semibold text-[#06221e]"
                >
                  Start Diagnosis <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
