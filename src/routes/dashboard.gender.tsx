import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useLfsStore } from "@/store/lfs-store";
import { applyFilter } from "@/lib/lfs/filters";
import { computeIndicators, pct } from "@/lib/lfs/indicators";
import { KpiCard } from "@/components/lfs/kpi-card";
import { ChartCard } from "@/components/lfs/chart-card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";

export const Route = createFileRoute("/dashboard/gender")({
  component: GenderDashboard,
});

function GenderDashboard() {
  const records = useLfsStore((s) => s.dataset.records);
  const filters = useLfsStore((s) => s.filters);
  const rows = useMemo(() => applyFilter(records, filters), [records, filters]);
  const ind = useMemo(() => computeIndicators(rows), [rows]);

  const data = [
    { sex: "Male",   LFPR: +(ind.maleLFPR * 100).toFixed(1), EPR: +(ind.maleEPR * 100).toFixed(1), UR: +(ind.maleUR * 100).toFixed(1) },
    { sex: "Female", LFPR: +(ind.femaleLFPR * 100).toFixed(1), EPR: +(ind.femaleEPR * 100).toFixed(1), UR: +(ind.femaleUR * 100).toFixed(1) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Male Employment-to-Population" value={pct(ind.maleEPR)} hint="Working-age males" variant="employment" />
        <KpiCard label="Female Employment-to-Population" value={pct(ind.femaleEPR)} hint="Working-age females" variant="employment" />
        <KpiCard label="Gender employment gap" value={`${(ind.genderEmploymentGap * 100).toFixed(1)} pp`} hint="Male − Female EPR" variant="trend" />
        <KpiCard label="Female Unemployment Rate" value={pct(ind.femaleUR)} hint="ILO definition" variant="unemployment" invertDelta />
      </div>

      <ChartCard title="LFPR, EPR and UR by sex" description="Weighted rates (%)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="sex" stroke="var(--color-muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="LFPR" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="EPR" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="UR" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
