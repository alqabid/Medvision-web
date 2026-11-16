import { Shield } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card py-12">
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-center">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-secondary" />
        <span className="font-display text-lg font-bold text-foreground">MedVision</span>
      </div>
      <p className="max-w-lg text-sm text-muted-foreground">
        AI-powered thoracic diagnostics for Chest X-ray pneumonia detection and Chest CT lung-cancer subtype classification, with Grad-CAM explainability.
      </p>
      <p className="text-xs text-muted-foreground/60">
        © 2026 MedVision. For research and educational purposes · not a substitute for professional medical judgement.
      </p>
    </div>
  </footer>
);

export default Footer;
