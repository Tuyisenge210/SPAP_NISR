import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useLfsStore } from "@/store/lfs-store";
import { applyFilter } from "@/lib/lfs/filters";
import { computeIndicators, pct } from "@/lib/lfs/indicators";
import { ChartCard } from "@/components/lfs/chart-card";
import { KpiCard } from "@/components/lfs/kpi-card";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";

export const Route = createFileRoute("/dashboard/labour")({
  component: LabourDashboard,
});

function LabourDashboard() {
  const records = useLfsStore((s) => s.dataset.records);
  const filters = useLfsStore((s) => s.filters);
  const rows = useMemo(() => applyFilter(records, { ...filters, quarter: undefined }), [records, filters]);
  const ind = useMemo(() => computeIndicators(rows), [rows]);

  const trend = useMemo(() => {
    const periods = [...new Set(rows.map((r) => `${r.year}-Q${r.quarter}`))].sort();
    return periods.map((p) => {
      const [y, q] = [Number(p.slice(0, 4)), Number(p.slice(-1)) as 1 | 2 | 3 | 4];
      const sub = applyFilter(rows, { year: y, quarter: q });
      const i = computeIndicators(sub);
      return {
        period: p,
        EPR: +(i.epr * 100).toFixed(2),
        UR: +(i.unemploymentRate * 100).toFixed(2),
        LFPR: +(i.lfpr * 100).toFixed(2),
      };
    });
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Labour Force Participation Rate" value={pct(ind.lfpr)} hint="WAP in labour force" variant="labour" />
        <KpiCard label="Employment-to-Population Ratio" value={pct(ind.epr)} hint="All employed persons" variant="employment" />
        <KpiCard label="Unemployment Rate" value={pct(ind.unemploymentRate)} hint="ILO definition" variant="unemployment" invertDelta />
      </div>

      <ChartCard title="Quarterly trend analysis" description="Weighted % of working-age population (16+)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="period" stroke="var(--color-muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="EPR" stroke="var(--color-chart-1)" strokeWidth={2} dot />
            <Line type="monotone" dataKey="UR" stroke="var(--color-chart-3)" strokeWidth={2} dot />
            <Line type="monotone" dataKey="LFPR" stroke="var(--color-chart-2)" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
