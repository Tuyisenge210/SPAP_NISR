import { useLfsStore } from "@/store/lfs-store";
import { uniqueQuarters, uniqueRegions, uniqueYears, uniqueDistricts } from "@/lib/lfs/filters";
import { useMemo } from "react";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "__all__";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

interface SidebarProps {
  title?: string;
  filters?: FilterConfig[];
  onClear?: () => void;
  className?: string;
}

export function Sidebar({ title = "Filters", filters = [], onClear, className }: SidebarProps) {
  const records = useLfsStore((s) => s.dataset.records);
  const storeFilters = useLfsStore((s) => s.filters);
  const setFilters = useLfsStore((s) => s.setFilters);
  const clear = useLfsStore((s) => s.clearFilters);

  const years = useMemo(() => uniqueYears(records), [records]);
  const quarters = useMemo(() => uniqueQuarters(records), [records]);
  const regions = useMemo(() => uniqueRegions(records), [records]);
  const districts = useMemo(() => uniqueDistricts(records, storeFilters.region), [records, storeFilters.region]);

  const defaultFilters: FilterConfig[] = [
    {
      key: "year",
      label: "Year",
      options: [{ value: NONE, label: "All" }, ...years.map((y) => ({ value: String(y), label: String(y) }))],
      onChange: (v) => setFilters({ year: v === NONE ? undefined : Number(v) }),
    },
    {
      key: "quarter",
      label: "Quarter",
      options: [{ value: NONE, label: "All" }, ...quarters.map((q) => ({ value: String(q), label: `Q${q}` }))],
      onChange: (v) => setFilters({ quarter: v === NONE ? undefined : (Number(v) as 1 | 2 | 3 | 4) }),
    },
    {
      key: "sex",
      label: "Sex",
      options: [{ value: NONE, label: "All" }, { value: "male", label: "Male" }, { value: "female", label: "Female" }],
      onChange: (v) => setFilters({ sex: v === NONE ? undefined : (v as "male" | "female") }),
    },
    {
      key: "ageGroup",
      label: "Age group",
      options: [{ value: NONE, label: "All" }, { value: "youth", label: "Youth (16-30)" }, { value: "adult", label: "Adult (31+)" }],
      onChange: (v) => setFilters({ ageGroup: v === NONE ? undefined : (v as "youth" | "adult") }),
    },
    {
      key: "area",
      label: "Area",
      options: [{ value: NONE, label: "All" }, { value: "urban", label: "Urban" }, { value: "rural", label: "Rural" }],
      onChange: (v) => setFilters({ area: v === NONE ? undefined : (v as "urban" | "rural") }),
    },
    {
      key: "region",
      label: "Region",
      options: [{ value: NONE, label: "All" }, ...regions.map((r) => ({ value: r, label: r }))],
      onChange: (v) => setFilters({ region: v === NONE ? undefined : v, district: undefined }),
    },
    ...(districts.length > 0
      ? [
          {
            key: "district",
            label: "District",
            options: [{ value: NONE, label: "All" }, ...districts.map((d) => ({ value: d, label: d }))],
            onChange: (v) => setFilters({ district: v === NONE ? undefined : v }),
          } as FilterConfig,
        ]
      : []),
  ];

  const allFilters = filters.length > 0 ? filters : defaultFilters;

  return (
    <aside className={cn("rounded-xl border bg-card p-5", className)} style={{ borderColor: "var(--color-border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--color-primary)" }}>{title}</h3>
        <button
          onClick={onClear || clear}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-secondary"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          <X className="h-3 w-3" />
          Reset
        </button>
      </div>

      <div className="space-y-4">
        {allFilters.map((filter) => (
          <div key={filter.key}>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-muted-foreground)" }}>
              {filter.label}
            </label>
            <Select value={undefined} onValueChange={filter.onChange}>
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </aside>
  );
}