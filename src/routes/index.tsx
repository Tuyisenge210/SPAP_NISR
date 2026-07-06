import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/lfs/app-shell";
import { NisrCard } from "@/components/nisr/ui/Card";
import { NisrButton } from "@/components/nisr/ui/Button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, FileText, BarChart3, Table2, Sigma, ShieldCheck, Lightbulb, ArrowUpRight } from "lucide-react";
import { useLfsStore } from "@/store/lfs-store";
import { computeIndicators, pct, compact } from "@/lib/lfs/indicators";
import { useMemo } from "react";
import { HeroBanner } from "@/components/nisr/HeroBanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SPAP — Statistical Production and Analytics Platform" },
      { name: "description", content: "Official statistics platform for the National Institute of Statistics of Rwanda. Labour Force Survey analytics, dashboards, tables and reports." },
      { property: "og:title", content: "SPAP — Statistical Production and Analytics Platform" },
      { property: "og:description", content: "Official NISR platform for statistical automation, visualization and reporting." },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const dataset = useLfsStore((s) => s.dataset);
  const ind = useMemo(() => computeIndicators(dataset.records), [dataset]);

  return (
    <AppShell>
      <HeroBanner
        title="Rwanda Labour Force Survey Analytics"
        subtitle="Official platform for NISR statistical production. Upload quarterly LFS data, apply survey weights, compute ILO indicators, generate standard tables and produce publication-ready reports."
        tagline="National Institute of Statistics of Rwanda — Statistical Production and Analytics Platform"
        actions={
          <>
            <Button asChild><Link to="/dashboard">Open dashboards<ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            <Button asChild variant="outline"><Link to="/upload">Upload dataset</Link></Button>
            <Button asChild variant="ghost"><Link to="/validation">Validation suite</Link></Button>
          </>
        }
      />

      <NisrCard
        title="Headline Indicators"
        description="Key labour market metrics from the latest available survey data"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Headline label="EPR" value={pct(ind.epr)} note="Employment-to-Population" tone="primary" />
          <Headline label="Unemployment" value={pct(ind.unemploymentRate)} note="ILO definition" tone="primary" />
          <Headline label="LFPR" value={pct(ind.lfpr)} note="Labour Force Participation" tone="primary" />
          <Headline label="Youth UR" value={pct(ind.youthUnemploymentRate)} note="16–30 years" tone="primary" />
          <Headline label="Employed" value={compact(ind.employed)} note="Weighted persons" tone="default" />
          <Headline label="Working-age pop." value={compact(ind.wap)} note="Age 16+" tone="default" />
        </div>
      </NisrCard>

      <div className="grid gap-4 md:grid-cols-3">
        <FeatureCard icon={Database} title="Data ingestion"
          desc="CSV / Excel upload, automatic column mapping, validation and coercion." href="/upload" />
        <FeatureCard icon={Sigma} title="Weighted indicators"
          desc="ILO definitions: LFPR, EPR, Unemployment, Youth & Gender disaggregations." href="/methodology" />
        <FeatureCard icon={BarChart3} title="Dashboards"
          desc="Executive, Labour Market, Youth, Gender and Geographic views with filters." href="/dashboard" />
        <FeatureCard icon={Table2} title="Statistical tables"
          desc="Cross-tabulation engine for NISR standard publication tables." href="/tables" />
        <FeatureCard icon={FileText} title="Reports"
          desc="Automated PDF reports with KPIs, charts and methodology." href="/reports" />
        <FeatureCard icon={ShieldCheck} title="Validation"
          desc="Built-in harness asserts the engine reproduces NISR published figures." href="/validation" />
      </div>

      <NisrCard
        title="Future Improvements"
        description="Upcoming modules and expansion plans"
        headerAction={<Lightbulb className="h-5 w-5" style={{ color: "var(--color-primary)" }} />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-secondary/20 p-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>Additional Surveys</div>
                <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  Integration of additional NISR surveys beyond LFS, including Household Living Conditions Survey (EICV),
                  Demographic and Health Survey (DHS), and Business Survey data.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-secondary/20 p-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>Enhanced Analytics</div>
                <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  Advanced statistical modeling, trend analysis, predictive indicators, and automated anomaly detection
                  for improved data quality and timeliness.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-secondary/20 p-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>API Integration</div>
                <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  RESTful API endpoints for third-party integrations, enabling automated data feeds to government portals
                  and international organizations.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-secondary/20 p-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>Mobile Application</div>
                <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  Responsive mobile interface for field data collection and offline-capable survey tools for enumerators
                  across Rwanda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </NisrCard>
    </AppShell>
  );
}

function Headline({ label, value, note, tone = "default" }: { label: string; value: string; note: string; tone?: "primary" | "default" }) {
  const valueColor = tone === "primary" ? "text-primary" : "text-foreground";
  const labelColor = tone === "primary" ? "text-primary" : "text-muted-foreground";

  return (
    <div className="text-center">
      <div className={`text-[10px] font-bold uppercase tracking-widest ${labelColor}`}>{label}</div>
      <div className={`text-2xl font-extrabold tabular-nums ${valueColor}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{note}</div>
    </div>
  );
}

function FeatureCard({
  icon: Icon, title, desc, href,
}: {
  icon: typeof Database; title: string; desc: string; href: string;
}) {
  return (
    <Link to={href} className="group">
      <NisrCard
        title={title}
        description={desc}
        className="h-full"
        headerAction={
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        }
      />
    </Link>
  );
}
