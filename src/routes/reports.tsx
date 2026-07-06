import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/lfs/app-shell";
import { useLfsStore } from "@/store/lfs-store";
import { applyFilter } from "@/lib/lfs/filters";
import { computeIndicators, pct, compact } from "@/lib/lfs/indicators";
import { allStandardTables } from "@/lib/lfs/crosstabs";
import { buildQuarterlyReport, downloadPdf } from "@/lib/lfs/export-pdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download } from "lucide-react";
import { FilterBar } from "@/components/lfs/filter-bar";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — SPAP" },
      { name: "description", content: "Generate quarterly LFS PDF reports with key indicators, tables and methodology." },
      { property: "og:title", content: "Reports — SPAP" },
      { property: "og:description", content: "Generate quarterly LFS PDF reports with key indicators, tables and methodology." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const records = useLfsStore((s) => s.dataset.records);
  const filters = useLfsStore((s) => s.filters);
  const dataset = useLfsStore((s) => s.dataset);
  const rows = useMemo(() => applyFilter(records, filters), [records, filters]);
  const ind = useMemo(() => computeIndicators(rows), [rows]);
  const tables = useMemo(() => allStandardTables(rows), [rows]);

  const [title, setTitle] = useState("Rwanda Labour Force Survey — Quarterly Report");
  const period = useMemo(() => {
    const y = filters.year ?? "All years";
    const q = filters.quarter ? `Q${filters.quarter}` : "All quarters";
    return `${y} · ${q} · ${dataset.label}`;
  }, [filters, dataset]);

  const onGenerate = () => {
    const doc = buildQuarterlyReport({ title, period, indicators: ind, tables });
    downloadPdf(doc, `lfs-report-${filters.year ?? "all"}-q${filters.quarter ?? "all"}.pdf`);
  };

  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Quarterly PDF report</h1>
        <p className="mt-1 text-sm text-muted-foreground">Headline indicators, standard tables and footer in a single PDF.</p>
      </div>

      <div className="mb-4"><FilterBar /></div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader><CardTitle className="text-sm">Preview · key indicators</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
              <Stat label="WAP (16+)" value={compact(ind.wap)} />
              <Stat label="Labour force" value={compact(ind.labourForce)} />
              <Stat label="Employed" value={compact(ind.employed)} />
              <Stat label="Unemployed" value={compact(ind.unemployed)} />
              <Stat label="LFPR" value={pct(ind.lfpr)} />
              <Stat label="EPR" value={pct(ind.epr)} />
              <Stat label="Unemployment Rate" value={pct(ind.unemploymentRate)} />
              <Stat label="Youth UR" value={pct(ind.youthUnemploymentRate)} />
              <Stat label="Gender gap" value={`${(ind.genderEmploymentGap * 100).toFixed(1)} pp`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Export</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Period</Label>
              <Input value={period} readOnly className="mt-1" />
            </div>
            <Button className="w-full" onClick={onGenerate}>
              <FileText className="mr-2 h-4 w-4" />Generate PDF
            </Button>
            <p className="text-xs text-muted-foreground">
              <Download className="mr-1 inline h-3 w-3" />
              File downloads to your machine. Rendering happens locally.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-semibold tabular-nums">{value}</div>
    </div>
  );
}
