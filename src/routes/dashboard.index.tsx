import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useLfsStore } from "@/store/lfs-store";
import { applyFilter } from "@/lib/lfs/filters";
import { computeIndicators, compact, pct } from "@/lib/lfs/indicators";
import { KpiCard } from "@/components/lfs/kpi-card";
import { ChartCard } from "@/components/lfs/chart-card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";

export const Route = createFileRoute("/dashboard/")({
  component: ExecutiveDashboard,
});

function ExecutiveDashboard() {
  const records = useLfsStore((s) => s.dataset.records);
  const filters = useLfsStore((s) => s.filters);
  const rows = useMemo(() => applyFilter(records, filters), [records, filters]);
  const ind = useMemo(() => computeIndicators(rows), [rows]);

  const composition = [
    { name: "Employed", value: ind.employed, fill: "var(--color-chart-1)" },
    { name: "Unemployed", value: ind.unemployed, fill: "var(--color-chart-3)" },
    { name: "Outside LF", value: ind.outsideLF, fill: "var(--color-chart-2)" },
  ];

  const sexEPR = [
    { name: "Male", EPR: +(ind.maleEPR * 100).toFixed(1), UR: +(ind.maleUR * 100).toFixed(1) },
    { name: "Female", EPR: +(ind.femaleEPR * 100).toFixed(1), UR: +(ind.femaleUR * 100).toFixed(1) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Employment-to-Population Ratio" value={pct(ind.epr)} hint="Working-age 16+" variant="employment" />
        <KpiCard label="Unemployment Rate" value={pct(ind.unemploymentRate)} hint="ILO definition" variant="unemployment" invertDelta />
        <KpiCard label="Labour Force Participation" value={pct(ind.lfpr)} hint="WAP in labour force" variant="labour" />
        <KpiCard label="Youth Unemployment (16-30)" value={pct(ind.youthUnemploymentRate)} hint="Age 16-30" variant="unemployment" invertDelta />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Working-age population" value={compact(ind.wap)} hint="Age 16+" variant="neutral" />
        <KpiCard label="Labour force" value={compact(ind.labourForce)} hint="Employed + Unemployed" variant="labour" />
        <KpiCard label="Employed" value={compact(ind.employed)} hint="All sectors" variant="employment" />
        <KpiCard label="Unemployed" value={compact(ind.unemployed)} hint="Seeking work" variant="unemployment" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Working-age population composition" description="Weighted persons (16+)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={composition} layout="vertical" margin={{ left: 80, right: 20, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => compact(Number(v))} stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} width={120} />
              <Tooltip formatter={(v) => compact(Number(v))} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Employment and unemployment by sex" description="Weighted rates, %">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sexEPR} margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="EPR" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="UR" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
