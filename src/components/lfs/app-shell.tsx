import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Database, FileText, Home, Table2, FlaskConical, BookOpen, CalendarClock, Info, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Overview", icon: Home },
  { to: "/upload", label: "Data", icon: Database },
  { to: "/dashboard", label: "Dashboards", icon: BarChart3, prefix: "/dashboard" },
  { to: "/baseline-2022", label: "2022 Baseline", icon: CalendarClock },
  { to: "/tables", label: "Tables", icon: Table2 },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/validation", label: "Validation", icon: FlaskConical },
  { to: "/methodology", label: "Methodology", icon: BookOpen },
  { to: "/about", label: "About NISR", icon: Info },
] as const;

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, prefix?: string) =>
    prefix ? path.startsWith(prefix) : path === to;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-card/95 dark:bg-card backdrop-blur" style={{ borderBottomColor: "var(--color-border)" }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/nisr-logo.jpg"
              alt="NISR Logo"
              className="h-10 w-auto object-contain"
            />
            <div className="leading-tight">
              <div className="text-lg font-extrabold tracking-tight text-primary">Statistical Production and Analytics Platform</div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-primary">
                SPAP
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search indicators, reports..."
                className="w-full rounded-md border bg-secondary pl-9 pr-3 py-1.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
          </div>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active = isActive(n.to, "prefix" in n ? n.prefix : undefined);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile nav */}
        <nav className="flex overflow-x-auto border-t md:hidden" style={{ borderTopColor: "var(--color-border)" }}>
          {NAV.map((n) => {
            const active = isActive(n.to, "prefix" in n ? n.prefix : undefined);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex-1 whitespace-nowrap px-3 py-3 text-center text-xs font-semibold",
                  active ? "border-b-2 border-primary text-primary" : "text-muted-foreground",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">{children}</main>

      <footer className="border-t py-10 relative">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: "url('/imigongo-pattern.jpg')", backgroundSize: "300px" }}></div>
        <div className="mx-auto max-w-7xl px-4 relative">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/nisr-logo.jpg" alt="NISR Logo" className="h-10 w-auto object-contain" />
                <div>
                  <div className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>NISR</div>
                  <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-muted-foreground)" }}>
                    National Institute of Statistics
                  </div>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
                The National Institute of Statistics of Rwanda (NISR) is the official agency responsible for
                collecting, analyzing, and disseminating statistical information.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-primary)" }}>Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-xs hover:underline" style={{ color: "var(--color-muted-foreground)" }}>Home</Link></li>
                <li><Link to="/dashboard" className="text-xs hover:underline" style={{ color: "var(--color-muted-foreground)" }}>Dashboards</Link></li>
                <li><Link to="/upload" className="text-xs hover:underline" style={{ color: "var(--color-muted-foreground)" }}>Data Upload</Link></li>
                <li><Link to="/methodology" className="text-xs hover:underline" style={{ color: "var(--color-muted-foreground)" }}>Methodology</Link></li>
                <li><Link to="/about" className="text-xs hover:underline" style={{ color: "var(--color-muted-foreground)" }}>About NISR</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-primary)" }}>Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  <span className="mt-0.5 text-xs" style={{ color: "var(--color-primary)" }}>📍</span>
                  <span>Kigali, Rwanda</span>
                </li>
                <li className="flex items-start gap-2 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  <span className="mt-0.5 text-xs" style={{ color: "var(--color-primary)" }}>📞</span>
                  <span>+250 788 000 000</span>
                </li>
                <li className="flex items-start gap-2 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  <span className="mt-0.5 text-xs" style={{ color: "var(--color-primary)" }}>✉️</span>
                  <span>info@nisr.gov.rw</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              © {new Date().getFullYear()} National Institute of Statistics of Rwanda. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs font-extrabold" style={{ color: "var(--color-primary)" }}>
                SPAP
              </span>
              <span className="text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>
                Statistical Production and Analytics Platform
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}