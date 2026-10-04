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
  youth_population: number;
  youth_unemployment_rate: number;
  lu2: number | null;
  lu3: number | null;
  luur: number | null;
  informality_rate: number | null;
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

interface DashboardEnvelope {
  success: boolean;
  data?: DashboardPayload;
  error?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function getDashboardSummary(
  filters: DashboardFilters,
  signal?: AbortSignal,
): Promise<DashboardPayload> {
  const url = new URL("/api/v1/indicators/dashboard", API_BASE);
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Dashboard data request failed (${response.status}).`);
  const payload = (await response.json()) as DashboardEnvelope;
  if (!payload.success || !payload.data) {
    throw new Error(payload.error ?? "The API returned no dashboard data.");
  }
  return payload.data;
}