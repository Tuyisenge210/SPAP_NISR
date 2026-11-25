export type Dataset = {
  id: string;
  label: string;
  years: number[];
  source: string;
  badge: string;
  note: string;
};

export type ExportRecord = {
  run_id: string;
  scope: string;
  filename: string;
  at: string;
  bytes: number;
};

export type Cell = {
  value: number | null;
  display: string;
  numerator: number | null;
  denominator: number | null;
};

export type TableRow = { label: string; cells: Cell[] };

export type Table = {
  id: string;
  chapter: number;
  title: string;
  columns: string[];
  rows: TableRow[];
  unit: string;
  notes?: string;
  implemented: boolean;
  indicators?: string[];
  filters?: Record<string, string>;
};

export type Kpi = {
  code: string;
  name: string;
  short: string;
  value: number | null;
  numerator: number;
  denominator: number;
  unit: string;
  previous: number | null;
  delta: number | null;
  definition: string;
  formula: string;
  function: string;
  population: string;
};

export type Step = {
  key: string;
  label: string;
  status: string;
  ms: number;
  detail: string;
};

export type Check = {
  id: string;
  label: string;
  description: string;
  severity: string;
  status: string;
  affected: number;
  share: number;
  detail: string;
};

export type ValidationResult = {
  checks: Check[];
  summary: { pass: number; warn: number; fail: number; blocking: boolean };
  rows: number;
  dataset?: string;
  year?: number;
  dataset_label?: string;
  synthetic?: boolean;
  fingerprint?: string;
};

export type Run = {
  id: string;
  dataset: string;
  dataset_label: string;
  year: number;
  source: string;
  synthetic: boolean;
  fingerprint: string;
  records: number;
  created_at: string;
  status: string;
  steps: Step[];
  tables: Table[];
  kpis: Kpi[];
  charts: {
    trend: { year: number; LFPR: number | null; UR1: number | null; LUUR: number | null }[];
    by_sex: { group: string; LFPR: number | null; UR1: number | null }[];
    by_province: { group: string; LFPR: number | null; UR1: number | null }[];
  };
  totals?: Record<string, number>;
  table_count?: number;
  duration_ms?: number;
  validation?: ValidationResult;
  chapters?: number[];
};

export type Chapter = {
  id: number;
  title: string;
  short: string;
  tables: Table[];
  implemented: number;
  total: number;
};

export type IndicatorMeta = {
  short: string;
  name: string;
  definition: string;
  population: string;
  variables: string[];
  derived: string[];
  weight: string;
  numerator: string;
  denominator: string;
  formula: string;
  function: string;
};

export type Catalogue = {
  survey: string;
  working_age_min: number;
  youth_max: number;
  chapters: Chapter[];
  tables: Table[];
  indicators: Record<string, IndicatorMeta>;
  implemented_tables: number;
  total_tables: number;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      /* keep statusText */
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

export const api = {
  datasets: () => request<{ datasets: Dataset[] }>("/api/datasets"),
  catalogue: () => request<Catalogue>("/api/catalogue"),
  validation: (dataset: string, year: number) =>
    request<ValidationResult>(`/api/validation?dataset=${encodeURIComponent(dataset)}&year=${year}`),
  produce: (dataset: string, year: number, chapters?: number[]) =>
    request<Run>("/api/produce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset, year, chapters: chapters ?? null }),
    }),
  runs: () => request<{ runs: Run[] }>("/api/runs"),
  exports: () => request<{ exports: ExportRecord[]; count: number }>("/api/exports"),
  run: (id: string) => request<Run>(`/api/runs/${id}`),
  trace: (code: string) => request<Record<string, unknown>>(`/api/trace/${code}`),
  upload: async (name: string, year: number, file: File) => {
    const text = await file.text();
    return request<{ ok: boolean; dataset: string; datasets: Dataset[] }>(
      `/api/datasets/upload?dataset=${encodeURIComponent(name)}&year=${year}`,
      { method: "POST", headers: { "Content-Type": "text/csv" }, body: text },
    );
  },
  exportUrl: (runId: string, scope: string) => `/api/export/${runId}?scope=${scope}`,
};

export const num = (value: number | null | undefined, digits = 1) =>
  value === null || value === undefined ? "—" : value.toFixed(digits);
