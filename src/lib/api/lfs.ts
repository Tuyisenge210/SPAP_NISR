export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardFilters {
  year?: number;
  sex?: "male" | "female";
  area?: "urban" | "rural";
  age_group?: "youth" | "adult";
  province?: string;
}

export interface DashboardMetrics {
  wap: number;
  labour_force: number;
  employed: number;
  unemployed: number;
  outside_lf: number;
  lfpr: number;
  epr: number;
  unemployment_rate: number;
  youth_population?: number;
  youth_unemployment_rate?: number;
  lu2?: number | null;
  lu3?: number | null;
  luur?: number | null;
  informality_rate?: number | null;
}

export interface DashboardGroup extends DashboardMetrics {
  label: string;
}

export interface DashboardTrend extends DashboardMetrics {
  year: number;
}

export interface DashboardPayload {
  dataset: string;
  mode: "production" | "calibration";
  source: string;
  years: number[];
  selected_year: number | null;
  source_records: number;
  weight_variable: string | null;
  filters: DashboardFilters;
  summary: DashboardMetrics;
  trends: DashboardTrend[];
  by_sex: DashboardGroup[];
  by_area: DashboardGroup[];
  by_age_group: DashboardGroup[];
  by_province: DashboardGroup[];
  employment_by_sector: DashboardGroup[];
}

export interface TableCatalogueItem {
  table_id: string;
  output_key: string;
  chapter?: string;
  chapter_number?: number;
  chapter_title?: string;
  title: string;
  output_sheet?: string;
  source_variables?: string[];
  formula?: string;
}

export interface TablesPayload {
  tables: Record<string, Array<Record<string, unknown>>>;
  year?: number | null;
  years?: number[];
  source_records?: number;
  weight_column?: string | null;
}

export interface IngestionJob {
  job_id: string;
  status: string;
  progress?: number;
  message?: string;
  filename?: string;
  checksum?: string;
  manifest_path?: string;
  validation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    weight_column?: string | null;
    detected_year?: number | null;
    detected_quarter?: number | null;
    row_count?: number;
    column_count?: number;
  };
}

export interface IngestionUploadResponse {
  job_id: string;
  status: string;
  filename: string;
  sha256: string;
  manifest_path: string;
  stored_path?: string;
  validation?: IngestionJob["validation"];
  preview?: Array<Record<string, unknown>>;
}

export const SPAP_ENV_MODE =
  String(import.meta.env.VITE_SPAP_MODE ?? (import.meta.env.DEV ? "development" : "production")).toLowerCase();

export const IS_DEVELOPMENT_MODE =
  import.meta.env.DEV ||
  SPAP_ENV_MODE === "development" ||
  import.meta.env.VITE_SPAP_DEVELOPMENT_MODE === "true";

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(new URL(path, API_BASE), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const error = payload?.error || payload?.message || `Request failed (${response.status}) for ${path}.`;
    throw new Error(error);
  }
  if (payload && payload.success === false) {
    throw new Error(payload.error || payload.message || `API returned an error for ${path}.`);
  }
  return (payload?.data ?? (payload as unknown as T)) as T;
}

export async function getDashboardSummary(filters: DashboardFilters, signal?: AbortSignal): Promise<DashboardPayload> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  return apiFetch<DashboardPayload>(`/api/v1/indicators/dashboard${query ? `?${query}` : ""}`, { signal });
}

export async function getStandardTables(year?: number, signal?: AbortSignal): Promise<TablesPayload> {
  const query = year ? `?year=${encodeURIComponent(String(year))}` : "";
  return apiFetch<TablesPayload>(`/api/v1/standard${query}`, { signal });
}

export async function getPublicationTables(year?: number, signal?: AbortSignal): Promise<TablesPayload> {
  const query = year ? `?year=${encodeURIComponent(String(year))}` : "";
  return apiFetch<TablesPayload>(`/api/v1/publication${query}`, { signal });
}

export async function getMetadata(signal?: AbortSignal): Promise<{ years?: number[]; table_catalogue?: TableCatalogueItem[]; [k: string]: unknown }> {
  return apiFetch(`/api/v1/metadata`, { signal });
}

export async function uploadDataset(file: File, runPipeline = true): Promise<IngestionUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("run_pipeline", runPipeline ? "true" : "false");
  const response = await fetch(new URL("/api/v1/dataset", API_BASE), {
    method: "POST",
    body: form,
    headers: { Accept: "application/json" },
  });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<IngestionUploadResponse> | null;
  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(payload?.error || payload?.message || `Upload failed (${response.status}).`);
  }
  return payload.data;
}

export async function getIngestionJob(jobId: string, signal?: AbortSignal): Promise<IngestionJob> {
  return apiFetch<IngestionJob>(`/api/v1/ingestion-jobs/${encodeURIComponent(jobId)}`, { signal });
}
