import { useLfsStore } from "@/store/lfs-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { uniqueQuarters, uniqueRegions, uniqueYears, uniqueDistricts } from "@/lib/lfs/filters";
import { useMemo } from "react";
import { X } from "lucide-react";

const ALL = "__all__";

export function FilterBar() {
  const records = useLfsStore((s) => s.dataset.records);
  const filters = useLfsStore((s) => s.filters);
  const setFilters = useLfsStore((s) => s.setFilters);
  const clear = useLfsStore((s) => s.clearFilters);

  const years = useMemo(() => uniqueYears(records), [records]);
  const quarters = useMemo(() => uniqueQuarters(records), [records]);
  const regions = useMemo(() => uniqueRegions(records), [records]);
  const districts = useMemo(() => uniqueDistricts(records, filters.region), [records, filters.region]);

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-card p-3">
      <FilterSelect label="Year" value={filters.year?.toString()} onChange={(v) => setFilters({ year: v ? Number(v) : undefined })}
        options={years.map((y) => ({ value: String(y), label: String(y) }))} />
      <FilterSelect label="Quarter" value={filters.quarter?.toString()} onChange={(v) => setFilters({ quarter: v ? (Number(v) as 1 | 2 | 3 | 4) : undefined })}
        options={quarters.map((q) => ({ value: String(q), label: `Q${q}` }))} />
      <FilterSelect label="Sex" value={filters.sex} onChange={(v) => setFilters({ sex: v as "male" | "female" | undefined })}
        options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      <FilterSelect label="Age group" value={filters.ageGroup} onChange={(v) => setFilters({ ageGroup: v as "youth" | "adult" | undefined })}
        options={[{ value: "youth", label: "Youth (16-30)" }, { value: "adult", label: "Adult (31+)" }]} />
      <FilterSelect label="Area" value={filters.area} onChange={(v) => setFilters({ area: v as "urban" | "rural" | undefined })}
        options={[{ value: "urban", label: "Urban" }, { value: "rural", label: "Rural" }]} />
      <FilterSelect label="Region" value={filters.region} onChange={(v) => setFilters({ region: v || undefined, district: undefined })}
        options={regions.map((r) => ({ value: r, label: r }))} />
      {districts.length > 0 && (
        <FilterSelect label="District" value={filters.district} onChange={(v) => setFilters({ district: v || undefined })}
          options={districts.map((d) => ({ value: d, label: d }))}
        />
      )}
      <Button variant="ghost" size="sm" className="ml-auto" onClick={clear}>
        <X className="mr-1 h-3 w-3" />Reset
      </Button>
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="min-w-[140px]">
      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
        <SelectTrigger className="h-8 w-full">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
