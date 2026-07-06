import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/lfs/app-shell";
import { FilterBar } from "@/components/lfs/filter-bar";
import { cn } from "@/lib/utils";

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
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboards</h1>
        <p className="mt-1 text-sm text-muted-foreground">All values are survey-weighted. Filters apply across every tab.</p>
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

      <div className="mb-5">
        <FilterBar />
      </div>

      <Outlet />
    </AppShell>
  );
}
