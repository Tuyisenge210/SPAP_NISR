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

interface HeaderProps {
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  right?: ReactNode;
}

export function Header({ showSearch = true, onSearch, right }: HeaderProps) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, prefix?: string) =>
    prefix ? path.startsWith(prefix) : path === to;

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 dark:bg-card backdrop-blur" style={{ borderBottomColor: "var(--color-border)" }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/nisr-logo.jpg"
            alt="NISR Logo"
            className="h-10 w-auto object-contain"
          />
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight text-foreground">SPAP</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Statistical Production and Analytics Platform
            </div>
          </div>
        </Link>

        {showSearch && (
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search indicators, reports..."
                className="w-full rounded-md border bg-secondary pl-9 pr-3 py-1.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ borderColor: "var(--color-border)" }}
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
          </div>
        )}

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

        {right && <div className="ml-4">{right}</div>}
      </div>

      {/* Mobile search */}
      {showSearch && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              className="w-full rounded-md border bg-secondary pl-9 pr-3 py-2 text-xs"
              style={{ borderColor: "var(--color-border)" }}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>
      )}

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
  );
}