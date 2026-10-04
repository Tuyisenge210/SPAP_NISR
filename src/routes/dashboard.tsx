import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/lfs/app-shell";
import { cn } from "@/lib/utils";
import { ExecutiveDashboardContent } from "./dashboard.index";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboards — SPAP" },
      { name: "description", content: "Executive, Labour Market, Youth, Gender and Geographic dashboards from weighted LFS data." },
      { property: "og:title", content: "SPAP Dashboards" },
      { property: "og:description", content: "All dashboard views from weighted LFS data for National Institute of Statistics of Rwanda." },
    ],
  }),
  component: DashboardLayout,
});

const TABS = [
  { to: "/dashboard", label: "Executive", exact: true },
  { to: "/dashboard/labour", label: "Labour market" },
  { to: "/dashboard/youth", label: "Youth" },
  { to: "/dashboard/gender", label: "Gender" },
  { to: "/dashboard/geographic", label: "Geographic" },
] as const;

function DashboardLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <AppShell>
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#16814b]">Rwanda Labour Force Survey</div>
          <h1 className="mt-1 text-xl font-bold text-[#0b4778]">Statistical dashboards</h1>
          <p className="mt-1 text-xs text-slate-600">Executive indicators use the production API. Other views remain calibration previews until connected.</p>
        </div>
        <span className="inline-flex items-center gap-2 self-start border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-950 sm:self-auto">Calibration preview on non-executive tabs</span>
      </div>

      <div className="mb-4 border-b">
        <nav className="-mb-px flex flex-wrap gap-1">
          {TABS.map((t) => {
            const active = t.to === "/dashboard" ? path === "/dashboard" : path.startsWith(t.to);

            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {path === "/dashboard" || path === "/dashboard/" ? (
        <ExecutiveDashboardContent />
      ) : (
        <Outlet />
      )}
    </AppShell>
  );
}
