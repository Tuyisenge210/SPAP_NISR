import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useLfsStore } from "@/store/lfs-store";
import { applyFilter } from "@/lib/lfs/filters";
import { allStandardTables } from "@/lib/lfs/crosstabs";
import { downloadCsv, downloadExcel } from "@/lib/lfs/export-excel";
import { AppShell } from "@/components/lfs/app-shell";
import { FilterBar } from "@/components/lfs/filter-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/tables")({
  head: () => ({
    meta: [
      { title: "Tables — SPAP" },
      { name: "description", content: "Standard weighted LFS cross-tabulations with Excel and CSV export." },
      { property: "og:title", content: "Statistical tables — SPAP" },
      { property: "og:description", content: "Weighted cross-tabulations for NISR Labour Force Survey." },
    ],
  }),
  component: TablesPage,
});

function TablesPage() {
  const records = useLfsStore((s) => s.dataset.records);
  const filters = useLfsStore((s) => s.filters);
  const rows = useMemo(() => applyFilter(records, filters), [records, filters]);
  const tables = useMemo(() => allStandardTables(rows), [rows]);

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Standard LFS tables</h1>
          <p className="mt-1 text-sm text-muted-foreground">Weighted cross-tabulations. Use filters to scope; export to Excel or CSV.</p>
        </div>
        <Button onClick={() => downloadExcel(tables, "rwanda-lfs-tables.xlsx")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />Export all (Excel)
        </Button>
      </div>

      <div className="mb-5">
        <FilterBar />
      </div>

      <div className="space-y-4">
        {tables.map((t) => (
          <Card key={t.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">{t.name}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => downloadCsv(t)}>
                <Download className="mr-1.5 h-3.5 w-3.5" />CSV
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    {t.headers.map((h) => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {t.rows.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {r.map((c, j) => (
                        <td key={j} className={"py-2 pr-4 tabular-nums " + (j === 0 ? "font-medium" : "")}>{String(c)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
