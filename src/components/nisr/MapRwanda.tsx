import { useMemo } from "react";
import type { LfsRecord } from "@/lib/lfs/schema";
import { RWANDA_PROVINCES_GEOJSON, RWANDA_DISTRICTS_GEOJSON } from "@/lib/rwanda-geojson";

interface MapRwandaProps {
  data?: Array<{ region: string; value: number; label: string }>;
  onRegionClick?: (region: string) => void;
  selectedRegion?: string;
  showDistricts?: boolean;
  title?: string;
  description?: string;
}

// Simplified Rwanda map projection (lon/lat to x/y)
const PROJECT_SCALE = 80;
const PROJECT_OFFSET_X = 30;
const PROJECT_OFFSET_Y = -1.5;

function projectCoord(lon: number, lat: number): [number, number] {
  const x = (lon - PROJECT_OFFSET_X) * PROJECT_SCALE + 140;
  const y = (-lat + PROJECT_OFFSET_Y) * PROJECT_SCALE + 120;
  return [x, y];
}

function pathFromCoords(coords: number[][][]): string {
  const rings = coords.map(ring =>
    ring.map(([lon, lat]) => {
      const [x, y] = projectCoord(lon, lat);
      return `${x},${y}`;
    }).join(" ")
  );
  return `M ${rings[0]} L ${rings.slice(1).join(" L ")} Z`;
}

export function MapRwanda({ data, onRegionClick, selectedRegion, showDistricts = false, title, description }: MapRwandaProps) {
  const normalizedData = useMemo(() => {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    return data.map((d) => ({
      ...d,
      normalizedValue: d.value / maxVal,
    }));
  }, [data]);

  const getRegionFill = (regionName: string) => {
    if (!normalizedData) return "rgba(0, 51, 102, 0.15)";
    const found = normalizedData.find((d) => d.region === regionName || d.label === regionName);
    if (!found) return "rgba(0, 51, 102, 0.15)";
    const opacity = 0.3 + found.normalizedValue * 0.4;
    return `rgba(0, 51, 102, ${opacity})`;
  };

  const getRegionValue = (regionName: string) => {
    if (!normalizedData) return null;
    return normalizedData.find((d) => d.region === regionName) || null;
  };

  return (
    <div className="rounded-xl border bg-card p-5" style={{ borderColor: "var(--color-border)" }}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-base font-bold" style={{ color: "var(--color-primary)" }}>{title}</h3>}
          {description && <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>{description}</p>}
        </div>
      )}

      <div className="overflow-x-auto">
        <svg viewBox="0 0 280 300" className="w-full max-w-lg mx-auto h-auto">
          {/* Background */}
          <rect x="0" y="0" width="280" height="300" fill="transparent" />

          {/* Province polygons from GeoJSON */}
          {RWANDA_PROVINCES_GEOJSON.features.map((feature) => {
            const provName = feature.properties.name;
            const isSelected = selectedRegion === provName;
            const pathData = pathFromCoords(feature.geometry.coordinates as number[][][]);

            return (
              <g key={provName}>
                <path
                  d={pathData}
                  fill={getRegionFill(provName)}
                  stroke={isSelected ? "#003366" : "#009639"}
                  strokeWidth={isSelected ? 2.5 : 1}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onClick={() => onRegionClick?.(provName)}
                />
                <text
                  x={140}
                  y={150}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[10px] font-semibold pointer-events-none"
                  style={{ fill: "var(--color-foreground)" }}
                >
                  {provName.replace(" Province", "")}
                </text>
              </g>
            );
          })}

          {/* District overlays when enabled */}
          {showDistricts && RWANDA_DISTRICTS_GEOJSON.features.map((feature) => {
            const distName = feature.properties.name;
            const pathData = pathFromCoords(feature.geometry.coordinates as number[][][]);

            return (
              <path
                key={distName}
                d={pathData}
                fill="transparent"
                stroke="rgba(0, 51, 102, 0.3)"
                strokeWidth={0.5}
                className="pointer-events-none"
              >
                <title>{distName}</title>
              </path>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs" style={{ color: "var(--color-muted-foreground)" }}>
        <span>Click a province to filter by region.</span>
        {selectedRegion && <span className="font-semibold" style={{ color: "var(--color-primary)" }}>{selectedRegion} selected</span>}
      </div>

      {normalizedData && normalizedData.length > 0 && (
        <div className="mt-3 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          Values: {normalizedData.map(d => `${d.region}: ${d.value.toFixed(1)}%`).join(" · ")}
        </div>
      )}
    </div>
  );
}

// Hook to generate map data from LFS records
export function useRwandaMapData(records: LfsRecord[]) {
  return useMemo(() => {
    const regionMap = new Map<string, { wap: number; employed: number }>();
    for (const r of records) {
      if (r.age >= 16) {
        const existing = regionMap.get(r.region) || { wap: 0, employed: 0 };
        existing.wap += r.weight;
        if (r.employment_status === "employed") existing.employed += r.weight;
        regionMap.set(r.region, existing);
      }
    }
    return Array.from(regionMap.entries()).map(([region, values]) => {
      const epr = values.wap > 0 ? (values.employed / values.wap) * 100 : 0;
      return { region, value: epr, label: region };
    });
  }, [records]);
}