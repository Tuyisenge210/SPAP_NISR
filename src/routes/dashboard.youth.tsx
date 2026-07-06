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

export const Route = createFileRoute("/dashboard/youth")({
  component: YouthDashboard,
});

function YouthDashboard() {
  const records = useLfsStore((s) => s.dataset.records);
  const filters = useLfsStore((s) => s.filters);
  const rows = useMemo(() => applyFilter(records, filters), [records, filters]);
  const ind = useMemo(() => computeIndicators(rows), [rows]);

  const data = [
    { group: "Youth (16-30)", UR: +(ind.youthUnemploymentRate * 100).toFixed(1), EPR: +(ind.youthEPR * 100).toFixed(1) },
    { group: "Adult (31+)", UR: +(ind.adultUnemploymentRate * 100).toFixed(1), EPR: +(((ind.employed - ind.youthEPR * ind.wap * 0) / Math.max(ind.wap, 1)) * 100).toFixed(1) },
  ];
  const adultRows = applyFilter(records, { ...filters, ageGroup: "adult" });
  const adultInd = computeIndicators(adultRows);
  data[1].EPR = +(adultInd.epr * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Youth Unemployment Rate (16-30)" value={pct(ind.youthUnemploymentRate)} hint="NISR youth definition" variant="unemployment" invertDelta />
        <KpiCard label="Adult Unemployment Rate (31+)" value={pct(ind.adultUnemploymentRate)} hint="NISR adult definition" variant="unemployment" invertDelta />
        <KpiCard label="Youth Employment-to-Population" value={pct(ind.youthEPR)} hint="Employed persons 16-30" variant="employment" />
      </div>

      <ChartCard title="Youth vs Adult comparison" description="Weighted rates by age group (NISR convention)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="group" stroke="var(--color-muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="UR" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="EPR" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
