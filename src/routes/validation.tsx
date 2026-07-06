import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/lfs/app-shell";
import { useLfsStore } from "@/store/lfs-store";
import { applyFilter } from "@/lib/lfs/filters";
import { computeIndicators } from "@/lib/lfs/indicators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/validation")({
  head: () => ({
    meta: [
      { title: "Validation — SPAP" },
      { name: "description", content: "Built-in test harness validating the engine against NISR Labour Force Survey published figures." },
      { property: "og:title", content: "Validation — SPAP" },
      { property: "og:description", content: "Built-in test harness validating the engine against NISR Labour Force Survey published figures." },
    ],
  }),
  component: ValidationPage,
});

interface Check {
  name: string;
  published: number;          // expected value (decimal for rates, persons for counts)
  unit: "rate" | "count" | "pp";
  tolerance: number;          // absolute tolerance (in the same unit)
  actual: number;
}

function fmt(v: number, unit: Check["unit"]) {
  if (unit === "rate") return `${(v * 100).toFixed(2)} %`;
  if (unit === "pp") return `${v.toFixed(2)} pp`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)} M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)} k`;
  return v.toFixed(0);
}

function ValidationPage() {
  const records = useLfsStore((s) => s.dataset.records);
  // Validation always runs on full year 2025
  const annual = useMemo(() => computeIndicators(applyFilter(records, { year: 2025 })), [records]);
  const q4 = useMemo(() => computeIndicators(applyFilter(records, { year: 2025, quarter: 4 })), [records]);

  const checks: Check[] = [
    // Annual 2025 (NISR Annual Report 2025)
    { name: "EPR (annual)",                        published: 0.559,     unit: "rate",  tolerance: 0.005,  actual: annual.epr },
    { name: "Unemployment Rate (annual)",          published: 0.124,     unit: "rate",  tolerance: 0.005,  actual: annual.unemploymentRate },
    { name: "Male EPR (annual)",                   published: 0.636,     unit: "rate",  tolerance: 0.005,  actual: annual.maleEPR },
    { name: "Female EPR (annual)",                 published: 0.490,     unit: "rate",  tolerance: 0.005,  actual: annual.femaleEPR },
    { name: "Male Unemployment (annual)",          published: 0.108,     unit: "rate",  tolerance: 0.005,  actual: annual.maleUR },
    { name: "Female Unemployment (annual)",        published: 0.142,     unit: "rate",  tolerance: 0.005,  actual: annual.femaleUR },
    { name: "Youth Unemployment 16-30 (annual)",   published: 0.147,     unit: "rate",  tolerance: 0.005,  actual: annual.youthUnemploymentRate },
    { name: "Adult Unemployment 31+ (annual)",     published: 0.108,     unit: "rate",  tolerance: 0.005,  actual: annual.adultUnemploymentRate },
    { name: "Gender employment gap (annual)",      published: 0.146,     unit: "rate",  tolerance: 0.01,   actual: annual.genderEmploymentGap },
    { name: "Working-age population (annual avg)", published: 8_525_000, unit: "count", tolerance: 200_000, actual: annual.wap / 4 },
    { name: "Employed (annual avg)",               published: 4_750_000, unit: "count", tolerance: 200_000, actual: annual.employed / 4 },
    // Quarter 4 (November 2025)
    { name: "EPR Q4 2025",                         published: 0.567,     unit: "rate",  tolerance: 0.01,   actual: q4.epr },
    { name: "Unemployment Rate Q4 2025",           published: 0.117,     unit: "rate",  tolerance: 0.01,   actual: q4.unemploymentRate },
  ];

  const passed = checks.filter((c) => Math.abs(c.actual - c.published) <= c.tolerance).length;

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Validation against <span className="text-primary">NISR</span> Labour Force Survey 2025</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Runs the SPAP indicator engine against published figures from the <span className="font-semibold text-primary">NISR</span>
            Annual Report 2025. With real microdata this page validates the computation pipeline.
          </p>
        </div>
        <Badge variant={passed === checks.length ? "default" : "destructive"} className="text-sm">
          {passed} / {checks.length} checks pass
        </Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Headline indicators</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Indicator</th>
                <th className="py-2 pr-4 font-medium">Published (NISR)</th>
                <th className="py-2 pr-4 font-medium">Engine</th>
                <th className="py-2 pr-4 font-medium">Δ</th>
                <th className="py-2 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => {
                const diff = c.actual - c.published;
                const ok = Math.abs(diff) <= c.tolerance;
                return (
                  <tr key={c.name} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{c.name}</td>
                    <td className="py-2 pr-4 tabular-nums">{fmt(c.published, c.unit)}</td>
                    <td className="py-2 pr-4 tabular-nums">{fmt(c.actual, c.unit)}</td>
                    <td className={cn("py-2 pr-4 tabular-nums", ok ? "text-muted-foreground" : "text-destructive")}>
                      {diff > 0 ? "+" : ""}{fmt(diff, c.unit)}
                    </td>
                    <td className="py-2 pr-4">
                      {ok ? (
                        <span className="inline-flex items-center gap-1 text-success">
                          <CheckCircle2 className="h-4 w-4" />Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <XCircle className="h-4 w-4" />Fail
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Source · <span className="font-semibold text-primary">NISR</span> <em>Labour Force Survey – Annual Report 2025</em> and <em>November 2025 (Q4)</em> infographic.
        Synthetic dataset cells are calibrated to these aggregates; real microdata will reproduce them within tolerance.
      </p>
    </AppShell>
  );
}
