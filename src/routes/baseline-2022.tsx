import { createFileRoute } from "@tanstack/react-router";
import baseline from "@/lib/lfs/baseline-2022.json";
import { KpiCard } from "@/components/lfs/kpi-card";
import { ChartCard } from "@/components/lfs/chart-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import { AppShell } from "@/components/lfs/app-shell";

export const Route = createFileRoute("/baseline-2022")({
  component: Baseline2022Page,
  head: () => ({
    meta: [
      { title: "2022 Baseline — SPAP" },
      { name: "description", content: "Weighted 2022 labour-market indicators from NISR Labour Force Survey microdata." },
    ],
  }),
});

const fmt1 = (v: number) => `${v.toFixed(1)} %`;
const compact = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(2)} M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)} k` : n.toFixed(0);

function Baseline2022Page() {
  const h = baseline.headline;
  const t = baseline.totals;
  const sex = baseline.by_sex as Record<string, { EPR: number; UR: number; LFPR: number }>;
  const area = baseline.by_area as Record<string, { EPR: number; UR: number; LFPR: number }>;
  const age = baseline.by_age as Record<string, { EPR: number; UR: number; LFPR: number }>;
  const prov = baseline.by_province as Record<string, { EPR: number; UR: number; LFPR: number; wap: number }>;
  const lu = baseline.underutilization as Record<string, number>;

  const sexData = [
    { name: "Male", EPR: +sex.male.EPR.toFixed(1), UR: +sex.male.UR.toFixed(1), LFPR: +sex.male.LFPR.toFixed(1) },
    { name: "Female", EPR: +sex.female.EPR.toFixed(1), UR: +sex.female.UR.toFixed(1), LFPR: +sex.female.LFPR.toFixed(1) },
  ];
  const areaData = [
    { name: "Urban", EPR: +area.urban.EPR.toFixed(1), UR: +area.urban.UR.toFixed(1) },
    { name: "Rural", EPR: +area.rural.EPR.toFixed(1), UR: +area.rural.UR.toFixed(1) },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Historical baseline — NISR LFS 2022
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            2022 Labour-Market Indicators
          </h1>
          <p className="text-sm text-muted-foreground">
            Computed from NISR microdata — {baseline.n_records.toLocaleString()} person records,
            weighted by <code>weight2</code> (annual).
          </p>
        </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Employment-to-Population" value={fmt1(h.EPR)} hint="Working-age 16+" />
        <KpiCard label="Unemployment Rate" value={fmt1(h.UR)} hint="ILO definition" invertColor />
        <KpiCard label="Labour Force Participation" value={fmt1(h.LFPR)} />
        <KpiCard label="Labour Underutilization (LU4)" value={fmt1(lu.LU4)} invertColor />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Working-age pop." value={compact(t.working_age)} />
        <KpiCard label="Labour force" value={compact(t.labour_force)} />
        <KpiCard label="Employed" value={compact(t.employed)} />
        <KpiCard label="Unemployed" value={compact(t.unemployed)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="By sex" description="EPR, UR, LFPR — weighted %">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sexData} margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="EPR" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="UR" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="LFPR" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Urban vs Rural" description="EPR & UR — weighted %">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={areaData} margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Age groups</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Group</TableHead><TableHead className="text-right">EPR</TableHead><TableHead className="text-right">UR</TableHead><TableHead className="text-right">LFPR</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(age).map(([k, v]) => (
                  <TableRow key={k}>
                    <TableCell className="font-medium">{k.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt1(v.EPR)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt1(v.UR)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt1(v.LFPR)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Labour underutilization</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Indicator</TableHead><TableHead className="text-right">Rate</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ["LU1 — Unemployment rate", h.UR],
                  ["LU2 — Unemployment + time-related underemployment", lu.LU2],
                  ["LU3 — Unemployment + potential labour force", lu.LU3],
                  ["LU4 — Composite (all forms)", lu.LU4],
                  ["TRUR — Time-related underemployment rate", lu.TRUR],
                ].map(([label, v]) => (
                  <TableRow key={label as string}>
                    <TableCell className="font-medium">{label}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt1(v as number)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">By province</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Province</TableHead>
                <TableHead className="text-right">WAP (16+)</TableHead>
                <TableHead className="text-right">EPR</TableHead>
                <TableHead className="text-right">UR</TableHead>
                <TableHead className="text-right">LFPR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(prov).map(([name, v]) => (
                <TableRow key={name}>
                  <TableCell className="font-medium">{name}</TableCell>
                  <TableCell className="text-right tabular-nums">{compact(v.wap)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt1(v.EPR)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt1(v.UR)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt1(v.LFPR)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
</Table>
           </CardContent>
         </Card>
       </div>
     </AppShell>
   );
}
