import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
            <Shield className="h-5 w-5 text-secondary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            Med<span className="text-secondary">Vision</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
          <a href="#security" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Security</a>
          <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How It Works</a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-foreground">
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-border bg-card px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <a href="#features" className="text-sm text-muted-foreground">Features</a>
            <a href="#security" className="text-sm text-muted-foreground">Security</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground">How It Works</a>
            <hr className="border-border" />
            {user ? (
              <Button asChild className="bg-secondary text-secondary-foreground">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link to="/login" className="text-sm text-foreground">Sign In</Link>
                <Button asChild className="bg-secondary text-secondary-foreground">
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
