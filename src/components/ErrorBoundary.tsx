import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || "Unexpected rendering error" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("MedVision UI ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Workstation Display Error
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.state.message}
            </p>
            <Button
              onClick={() => window.location.assign("/dashboard")}
              className="mt-6 rounded-full bg-[#07221e] px-6 text-[#72f6d5] hover:bg-[#0b352e]"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reload Workstation
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
