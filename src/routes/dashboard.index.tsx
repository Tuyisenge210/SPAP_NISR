import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowDownToLine,
  BarChart3,
  Database,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SPAP_ENV_BADGE } from "@/lib/env";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Executive dashboard — SPAP" },
      { name: "description", content: "Production indicators from Rwanda Labour Force Survey microdata." },
    ],
  }),
  component: ExecutiveDashboardContent,
});

const BLUE = "#0b4778";
const GREEN = "#16814b";
const GOLD = "#e0ae25";
const TEAL = "#188a92";
const MUTED = "#657584";
const GRID = "#e7edf1";

const numberFormat = new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 });
const percentFormat = new Intl.NumberFormat("en-RW", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function count(value: number) {
  return numberFormat.format(Math.round(value));
}

function rate(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "Not available" : `${percentFormat.format(value)}%`;
}

function downloadDashboard(data: DashboardPayload) {
  const rows = [
    ["Dataset", data.dataset],
    ["Mode", data.mode],
    ["Selected year", data.selected_year ?? ""],
    ["Source records", data.source_records],
    ["Weight variable", data.weight_variable ?? ""],
    ["Measure", "Value"],
    ["Working-age population", data.summary.wap],
    ["Labour force", data.summary.labour_force],
    ["Employed", data.summary.employed],
    ["Unemployed", data.summary.unemployed],
    ["LFPR (%)", data.summary.lfpr],
    ["EPR (%)", data.summary.epr],
    ["Unemployment rate (%)", data.summary.unemployment_rate],
    ["Youth unemployment rate (%)", data.summary.youth_unemployment_rate],
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const objectUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `rwanda-lfs-dashboard-${data.selected_year ?? "latest"}.csv`;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export function ExecutiveDashboardContent() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const { year, sex, area, age_group, province } = filters;
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getDashboardSummary({ year, sex, area, age_group, province }, controller.signal)
      .then(setData)
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Unable to load production indicators.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [year, sex, area, age_group, province]);

  const updateFilter = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K] | undefined) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  if (loading && !data) {
    return (
      <section className="space-y-5" aria-live="polite" aria-busy="true">
        <div className="h-32 animate-pulse rounded-sm bg-slate-100" />
        <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse bg-white" />)}
        </div>
        <div className="h-[360px] animate-pulse rounded-sm bg-slate-100" />
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="border-l-4 border-red-600 bg-red-50 p-5" role="alert">
        <h2 className="font-semibold text-red-900">Production indicators could not be loaded</h2>
        <p className="mt-1 text-sm text-red-800">{error ?? "The API returned no dashboard data."}</p>
        <button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-900 underline" onClick={() => setFilters((current) => ({ ...current }))}>
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </section>
    );
  }

  const summary = data.summary;
  const latestLabel = data.selected_year == null ? "Latest available" : `Annual · ${data.selected_year}`;
  const trendData = data.trends.map((row) => ({
    year: row.year,
    LFPR: row.lfpr,
    EPR: row.epr,
    Unemployment: row.unemployment_rate,
  }));
  const composition = [
    { label: "Employed", value: summary.employed, fill: GREEN },
    { label: "Unemployed", value: summary.unemployed, fill: GOLD },
    { label: "Outside labour force", value: summary.outside_lf, fill: "#8d9aa5" },
  ];
  const sexData = data.by_sex.map((row) => ({
    label: row.label,
    LFPR: row.lfpr,
    EPR: row.epr,
    Unemployment: row.unemployment_rate,
  }));
  const areaData = data.by_area.map((row) => ({
    label: row.label,
    LFPR: row.lfpr,
    EPR: row.epr,
    Unemployment: row.unemployment_rate,
  }));
  const ageData = data.by_age_group.map((row) => ({
    label: row.label,
    LFPR: row.lfpr,
    EPR: row.epr,
    Unemployment: row.unemployment_rate,
  })).filter((row) => row.label !== "Missing");

  return (
    <main className="space-y-6 text-slate-900">
      <header className="relative overflow-hidden bg-[#0b4778] px-5 py-6 text-white sm:px-7 sm:py-7">
        <div className="absolute right-0 top-0 h-full w-2 bg-[#e0ae25]" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-100">
              <span>Rwanda Labour Force Survey</span><span className="text-[#f2c94c]">/</span><span>Executive indicators</span>
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">Labour market overview</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              National estimates and disaggregations calculated from the harmonized, survey-weighted LFS panel.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center border px-3 py-2 text-xs font-semibold ${data.mode === "calibration" ? "border-amber-300 bg-amber-100 text-amber-900" : "border-white/30 bg-white/10"}`}>
              [{data.mode === "calibration" ? "CALIBRATION" : SPAP_ENV_BADGE}]
            </span>
            <span className="inline-flex items-center gap-2 border border-white/30 bg-white/10 px-3 py-2 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-300" /> {data.mode === "calibration" ? "Non-production data" : "Production source"}
            </span>
            <button
              className="inline-flex items-center gap-2 border border-white/35 px-3 py-2 text-xs font-semibold hover:bg-white/10"
              onClick={() => downloadDashboard(data)}
              title="Download current dashboard indicators as CSV"
            >
              <ArrowDownToLine className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dataset provenance">
        <Meta label="Active source" value={data.dataset} icon={<Database className="h-4 w-4" />} />
        <Meta label="Survey period" value={`${data.years[0] ?? "—"}–${data.years.at(-1) ?? "—"}`} icon={<Activity className="h-4 w-4" />} />
        <Meta label="Source records" value={count(data.source_records)} icon={<BarChart3 className="h-4 w-4" />} />
        <Meta label="Weight variable" value={data.weight_variable ?? "Not identified"} icon={<ShieldCheck className="h-4 w-4" />} />
      </section>

      {data.mode === "calibration" && (
        <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="status">
          Calibration data is active. These values are not official production estimates.
        </div>
      )}

      <section className="flex flex-wrap items-end gap-3 border-b border-slate-200 pb-4" aria-label="Dashboard filters">
        <Filter label="Survey year" value={filters.year?.toString() ?? ""} onChange={(value) => updateFilter("year", value ? Number(value) : undefined)}>
          <option value="">Latest year ({data.years.at(-1) ?? "—"})</option>
          {data.years.map((year) => <option key={year} value={year}>{year}</option>)}
        </Filter>
        <Filter label="Sex" value={filters.sex ?? ""} onChange={(value) => updateFilter("sex", (value || undefined) as DashboardFilters["sex"])}>
          <option value="">All</option><option value="male">Male</option><option value="female">Female</option>
        </Filter>
        <Filter label="Residence" value={filters.area ?? ""} onChange={(value) => updateFilter("area", (value || undefined) as DashboardFilters["area"])}>
          <option value="">All areas</option><option value="urban">Urban</option><option value="rural">Rural</option>
        </Filter>
        <Filter label="Age group" value={filters.age_group ?? ""} onChange={(value) => updateFilter("age_group", (value || undefined) as DashboardFilters["age_group"])}>
          <option value="">All ages</option><option value="youth">Youth (16-30)</option><option value="adult">Adults (31+)</option>
        </Filter>
        {data.by_province.length > 0 && (
          <Filter label="Province code" value={filters.province ?? ""} onChange={(value) => updateFilter("province", value || undefined)}>
            <option value="">All provinces</option>
            {data.by_province.map((row) => <option key={row.label} value={row.label}>{row.label}</option>)}
          </Filter>
        )}
        <button className="ml-auto inline-flex h-10 items-center gap-2 px-3 text-xs font-semibold text-[#0b4778] hover:bg-slate-100" onClick={() => setFilters({})}>
          <RefreshCw className="h-3.5 w-3.5" /> Reset
        </button>
        <span className="basis-full text-xs text-slate-500">{latestLabel} · survey-weighted · population aged 16+</span>
      </section>

      <section className="grid divide-y divide-slate-200 border-y border-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4" aria-label="Headline indicators">
        <Kpi label="Labour force participation" value={rate(summary.lfpr)} definition="Labour force ÷ working-age population" accent={BLUE} />
        <Kpi label="Employment-to-population" value={rate(summary.epr)} definition="Employed ÷ working-age population" accent={GREEN} />
        <Kpi label="Unemployment rate (UR1)" value={rate(summary.unemployment_rate)} definition="Unemployed ÷ labour force" accent={GOLD} />
        <Kpi label="Youth unemployment" value={rate(summary.youth_unemployment_rate)} definition="Youth aged 16-30 · unemployed ÷ youth labour force" accent={TEAL} />
      </section>

      <section className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-slate-200 pb-5 md:grid-cols-4" aria-label="Population levels">
        <Level label="Working-age population" value={count(summary.wap)} />
        <Level label="Labour force" value={count(summary.labour_force)} />
        <Level label="Employed" value={count(summary.employed)} />
        <Level label="Unemployed" value={count(summary.unemployed)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <ChartPanel title="Headline labour-market rates" subtitle="Annual estimates · percent · working-age population (16+)">
          {trendData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 16, left: -10, bottom: 2 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="year" tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                <Tooltip formatter={(value) => rate(Number(value))} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line type="monotone" dataKey="LFPR" stroke={BLUE} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="EPR" stroke={GREEN} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Unemployment" stroke="#c38b06" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartPanel>

        <ChartPanel title="Working-age population composition" subtitle={`${latestLabel} · weighted persons`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={composition} layout="vertical" margin={{ top: 8, right: 18, left: 16, bottom: 4 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" tickFormatter={(value) => compact(value)} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label" width={120} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => count(Number(value))} contentStyle={tooltipStyle} />
              <Bar dataKey="value" name="Weighted persons" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <RateBars title="Labour-market indicators by sex" data={sexData} />
        <RateBars title="Labour-market indicators by residence" data={areaData} />
        <ChartPanel title="Labour-market indicators by age group" subtitle="Five-year cohorts · rates in percent">
          {ageData.length ? <RateBarsInner data={ageData} /> : <EmptyChart />}
        </ChartPanel>
        <RankBars title="Employment by economic activity" data={data.employment_by_sector} valueKey="employed" valueLabel="Weighted employed persons" />
        <RankBars title="Working-age population by province code" data={data.by_province} valueKey="wap" valueLabel="Weighted working-age population" />
        <ChartPanel title="Labour underutilization" subtitle="ILO extended measures · percent">
          <div className="grid h-full grid-cols-3 divide-x divide-slate-200">
            <Measure label="LU2" value={rate(summary.lu2)} definition="Unemployment + time-related underemployment" />
            <Measure label="LU3" value={rate(summary.lu3)} definition="Unemployment + potential labour force" />
            <Measure label="LUUR" value={rate(summary.luur)} definition="Composite labour underutilization" />
          </div>
        </ChartPanel>
      </section>

      <footer className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>Source: {data.source} · Weight: {data.weight_variable ?? "not identified"}</span>
        <span>Publication and release-specific methodological checks are still required.</span>
      </footer>
      {loading && <div className="fixed bottom-4 right-4 bg-[#0b4778] px-3 py-2 text-xs font-semibold text-white shadow-lg" role="status">Updating indicators…</div>}
    </main>
  );
}

function Meta({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex min-h-[74px] items-center gap-3 bg-white px-4 py-3">
      <span className="text-[#16814b]">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</div>
        <div className="mt-1 truncate text-sm font-semibold text-slate-800">{value}</div>
      </div>
    </div>
  );
}

function Filter({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="min-w-[140px] flex-1 sm:flex-none">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</span>
      <select className="h-10 w-full border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#0b4778] focus:ring-2 focus:ring-[#0b4778]/20" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function Kpi({ label, value, definition, accent }: { label: string; value: string; definition: string; accent: string }) {
  return (
    <article className="relative min-h-[126px] bg-white px-4 py-5 sm:px-5">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: accent }} />
      <h2 className="text-xs font-bold text-slate-600">{label}</h2>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-normal text-slate-900">{value}</p>
      <p className="mt-2 text-[11px] leading-snug text-slate-500">{definition}</p>
    </article>
  );
}

function Level({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</div><div className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{value}</div></div>;
}

function ChartPanel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <article className="min-w-0 border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>
      </header>
      <div className="h-[285px] p-3 sm:p-4">{children}</div>
    </article>
  );
}

function RateBars({ title, data }: { title: string; data: { label: string; LFPR: number; EPR: number; Unemployment: number }[] }) {
  return (
    <ChartPanel title={title} subtitle="Survey-weighted rates · percent">
      {data.length ? <RateBarsInner data={data} /> : <EmptyChart />}
    </ChartPanel>
  );
}

function RateBarsInner({ data }: { data: { label: string; LFPR: number; EPR: number; Unemployment: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={42} />
        <Tooltip formatter={(value) => rate(Number(value))} contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Bar dataKey="LFPR" fill={BLUE} radius={[2, 2, 0, 0]} />
        <Bar dataKey="EPR" fill={GREEN} radius={[2, 2, 0, 0]} />
        <Bar dataKey="Unemployment" fill={GOLD} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function RankBars({ title, data, valueKey, valueLabel }: { title: string; data: { label: string; [key: string]: number | string }[]; valueKey: string; valueLabel: string }) {
  return (
    <ChartPanel title={title} subtitle={`${valueLabel} · latest year`}>
      {data.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 6, right: 12, left: 10, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis type="number" tickFormatter={(value) => compact(value)} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" width={105} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value) => count(Number(value))} contentStyle={tooltipStyle} />
            <Bar dataKey={valueKey} name={valueLabel} fill={TEAL} radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : <EmptyChart />}
    </ChartPanel>
  );
}

function Measure({ label, value, definition }: { label: string; value: string; definition: string }) {
  return <div className="flex flex-col justify-center px-3 py-4 sm:px-4"><span className="text-xs font-bold text-[#0b4778]">{label}</span><span className="mt-2 text-xl font-semibold tabular-nums text-slate-900">{value}</span><span className="mt-2 text-[10px] leading-snug text-slate-500">{definition}</span></div>;
}

function EmptyChart() {
  return <div className="flex h-full items-center justify-center text-sm text-slate-500">No observations for this selection.</div>;
}

function compact(value: number) {
  return new Intl.NumberFormat("en-RW", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

const tooltipStyle = { backgroundColor: "#fff", border: "1px solid #dbe3e8", borderRadius: 2, fontSize: 12 };