import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity, Users, Database, BarChart3, ScrollText, Settings,
  Shield, LogOut, User, Cpu,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

interface ClinicalShellProps {
  children: ReactNode;
  practitionerName?: string;
  hospitalName?: string | null;
  headerRight?: ReactNode;
}

const NAV_ITEMS = [
  { label: "Overview", path: "/dashboard", icon: Activity },
  { label: "Patients", path: "/patients", icon: Users },
  { label: "Records", path: "/records", icon: Database },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Audit", path: "/audit", icon: ScrollText },
  { label: "Settings", path: "/settings", icon: Settings },
];

const ClinicalShell = ({
  children,
  practitionerName,
  hospitalName,
  headerRight,
}: ClinicalShellProps) => {
  const { user, userRole, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const items = userRole === "admin"
    ? [...NAV_ITEMS, { label: "Admin", path: "/admin", icon: Cpu }]
    : NAV_ITEMS;

  const isActive = (path: string) =>
    location.pathname === path || (path === "/patients" && location.pathname.startsWith("/patients/"));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1480px] gap-6 px-4 py-5 sm:px-6 lg:px-8">
        {/* Left Vertical Icon Dock (Medikals-inspired) */}
        <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-[72px] shrink-0 flex-col items-center justify-between rounded-[28px] border border-border/60 bg-card py-6 shadow-card lg:flex">
          <Link
            to="/"
            title="MedVision Home"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-accent shadow-sm transition-transform hover:scale-105"
          >
            <Shield className="h-6 w-6" />
          </Link>

          <nav className="flex flex-col items-center gap-2.5" aria-label="Primary Sidebar">
            {items.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${
                    active
                      ? "bg-[#2563eb] text-white shadow-md shadow-[#2563eb]/25"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="pointer-events-none absolute left-14 z-50 hidden whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-xs font-medium text-background shadow-md group-hover:block">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-col items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </aside>

        {/* Main Workspace Column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Navigation Bar (ProHealth + Medikals pill bar) */}
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[26px] border border-border/60 bg-card/90 px-5 py-3 shadow-card backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5 lg:hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-accent">
                  <Shield className="h-5 w-5" />
                </div>
                <span className="font-display text-lg font-bold tracking-tight text-foreground">
                  MedVision
                </span>
              </Link>
              <div className="hidden items-center gap-2 lg:flex">
                <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
                <span className="font-display text-base font-bold tracking-tight text-foreground">
                  MedVision
                </span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Thoracic AI Suite
                </span>
              </div>
            </div>

            {/* Centered Pill Switcher (ProHealth style) */}
            <nav
              aria-label="Workspace Sections"
              className="flex items-center gap-1 overflow-x-auto rounded-full bg-muted/70 p-1 text-xs"
            >
              {items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative rounded-full px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="clinical-shell-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="absolute inset-0 rounded-full bg-card shadow-sm"
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Practitioner Profile Pill (Medikals Dr. Jahn Billoq style) */}
            <div className="flex items-center gap-2.5">
              {headerRight}
              <div className="flex items-center gap-3 rounded-full border border-border/70 bg-muted/40 py-1.5 pl-2 pr-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563eb] text-xs font-bold text-white shadow-sm">
                  {(practitionerName || user?.email || "DR").slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden leading-tight sm:block">
                  <div className="text-xs font-bold text-foreground">
                    {practitionerName || user?.email || "Clinician"}
                  </div>
                  <div className="text-[11px] text-muted-foreground capitalize">
                    {hospitalName || userRole?.replace("_", " ") || "Practitioner"}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground transition-colors hover:text-destructive lg:hidden"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalShell;
