import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useLfsStore } from "@/store/lfs-store";
import { applyFilter, uniqueRegions } from "@/lib/lfs/filters";
import { computeIndicators } from "@/lib/lfs/indicators";
import { ChartCard } from "@/components/lfs/chart-card";
import { RwandaMap, useRwandaMapData } from "@/components/lfs/rwanda-map";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";

export const Route = createFileRoute("/dashboard/geographic")({
  component: GeographicDashboard,
});

function GeographicDashboard() {
  const records = useLfsStore((s) => s.dataset.records);
  const filters = useLfsStore((s) => s.filters);
  const setFilters = useLfsStore((s) => s.setFilters);
  const rows = useMemo(() => applyFilter(records, filters), [records, filters]);

  const mapData = useRwandaMapData(rows);

  const regional = useMemo(() => {
    const regs = uniqueRegions(rows);
    return regs.map((reg) => {
      const i = computeIndicators(rows.filter((r) => r.region === reg));
      return {
        region: reg,
        EPR: +(i.epr * 100).toFixed(1),
        UR: +(i.unemploymentRate * 100).toFixed(1),
        LFPR: +(i.lfpr * 100).toFixed(1),
      };
    }).sort((a, b) => b.EPR - a.EPR);
  }, [rows]);

  const handleRegionClick = (region: string) => {
    setFilters({ region });
  };

  const area = useMemo(() => {
    return (["urban", "rural"] as const).map((a) => {
      const i = computeIndicators(rows.filter((r) => r.urban_rural === a));
      return {
        area: a === "urban" ? "Urban" : "Rural",
        EPR: +(i.epr * 100).toFixed(1),
        UR: +(i.unemploymentRate * 100).toFixed(1),
        LFPR: +(i.lfpr * 100).toFixed(1),
      };
    });
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <ChartCard title="Rwanda Province Map" description="Employment-to-Population Rate by Province (click to filter)">
          <RwandaMap data={mapData} onRegionClick={handleRegionClick} selectedRegion={filters.region} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Employment-to-Population by Province" description="Ranked by EPR (%)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regional} layout="vertical" margin={{ left: 100, right: 20, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="region" stroke="var(--color-muted-foreground)" fontSize={11} width={120} />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="EPR" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Urban vs Rural Employment" description="Weighted % by residence">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={area} margin={{ left: 12, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="area" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="EPR" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} name="EPR" />
              <Bar dataKey="UR" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} name="Unemployment" />
              <Bar dataKey="LFPR" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} name="LFPR" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
