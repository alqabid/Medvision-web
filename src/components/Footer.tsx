import { Shield } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card py-12">
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-center">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-secondary" />
        <span className="font-display text-lg font-bold text-foreground">MedVision</span>
      </div>
      <p className="max-w-md text-sm text-muted-foreground">
        AI-powered pneumonia detection from chest X-rays. Built with enterprise-grade security for healthcare professionals.
      </p>
      <p className="text-xs text-muted-foreground/60">© 2026 MedVision. For research and educational purposes.</p>
    </div>
  </footer>
);

export default Footer;
