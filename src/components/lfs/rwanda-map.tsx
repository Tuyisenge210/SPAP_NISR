import { useMemo } from "react";
import type { LfsRecord } from "@/lib/lfs/schema";

interface RwandaMapProps {
  data: Array<{ region: string; value: number; fill: string }>;
  onRegionClick?: (region: string) => void;
  selectedRegion?: string;
}

// Rwanda provinces with approximate bounds for SVG map
const PROVINCES: Array<{ name: string; x: number; y: number; width: number; height: number }> = [
  { name: "Kigali City", x: 115, y: 45, width: 70, height: 55 },
  { name: "Southern", x: 80, y: 105, width: 110, height: 125 },
  { name: "Western", x: 15, y: 110, width: 65, height: 105 },
  { name: "Northern", x: 100, y: 190, width: 85, height: 85 },
  { name: "Eastern", x: 195, y: 130, width: 110, height: 105 },
];

export function RwandaMap({ data, onRegionClick, selectedRegion }: RwandaMapProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="relative">
      <svg viewBox="0 0 340 320" className="w-full h-auto border border-border rounded-lg bg-white dark:bg-card">
        {/* Background reference shape */}
        <rect x="0" y="0" width="340" height="320" fill="none" />
        
        {/* Province shapes */}
        {PROVINCES.map((p) => {
          const regionData = data.find(d => d.region === p.name);
          const intensity = regionData ? regionData.value / maxValue : 0.1;
          const fill = regionData
            ? `rgba(0, 51, 102, ${0.4 + intensity * 0.5})`
            : "rgba(0, 51, 102, 0.2)";
          const isSelected = selectedRegion === p.name;

          return (
            <g key={p.name}>
              <rect
                x={p.x}
                y={p.y}
                width={p.width}
                height={p.height}
                rx={6}
                fill={fill}
                stroke={isSelected ? "#003366" : "#009639"}
                strokeWidth={isSelected ? 3 : 1.5}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onRegionClick?.(p.name)}
              />
              <text
                x={p.x + p.width / 2}
                y={p.y + 18}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[11px] font-semibold fill-foreground"
                style={{ pointerEvents: "none" }}
              >
                {p.name.replace(" Province", "")}
              </text>
              {regionData && (
                <text
                  x={p.x + p.width / 2}
                  y={p.y + p.height / 2 + 15}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[10px] font-medium fill-foreground"
                  style={{ pointerEvents: "none" }}
                >
                  {regionData.value.toFixed(1)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-3 text-xs text-muted-foreground">
        Click a province to filter. Color intensity shows relative EPR values.
        {selectedRegion && (
          <span className="ml-2 font-semibold text-primary"> — {selectedRegion} selected</span>
        )}
      </div>
    </div>
  );
}

// Hook to generate map data from LFS records
export function useRwandaMapData(records: LfsRecord[]) {
  return useMemo(() => {
    const regions = [...new Set(records.map(r => r.region).filter(Boolean))] as string[];
    return regions.map(region => {
      const regionRecords = records.filter(r => r.region === region);
      let wap = 0, employed = 0;
      for (const r of regionRecords) {
        if (r.age >= 16) wap += r.weight;
        if (r.employment_status === "employed") employed += r.weight;
      }
      const epr = wap > 0 ? (employed / wap) * 100 : 0;
      return { region, value: epr, fill: "#003366" };
    });
  }, [records]);
}