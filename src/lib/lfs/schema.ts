// Canonical LFS person-level record produced after column mapping.
export type EmploymentStatus = "employed" | "unemployed" | "outside_lf";
export type Sex = "male" | "female";
export type Area = "urban" | "rural";

export type SurveyFormat = "csv" | "xlsx" | "xls" | "dta";

export interface LfsRecord {
  person_id?: string;
  household_id?: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  age: number;
  sex: Sex;
  education?: string;
  employment_status: EmploymentStatus;
  occupation?: string;
  industry?: string;
  hours_worked?: number;
  earnings?: number;
  region?: string;       // Province
  district?: string;
  urban_rural: Area;
  weight: number;        // sampling weight (per-person)
}

export const CANONICAL_FIELDS = [
  "person_id", "household_id", "year", "quarter",
  "age", "sex", "education", "employment_status",
  "occupation", "industry", "hours_worked", "earnings",
  "region", "district", "urban_rural", "weight",
] as const;

export type CanonicalField = (typeof CANONICAL_FIELDS)[number];

export const REQUIRED_FIELDS: CanonicalField[] = [
  "year", "quarter", "age", "sex", "employment_status", "weight",
];

// Working-age threshold used by NISR (16+)
export const WORKING_AGE = 16;
// Youth window used by NISR for the 2025 report
export const YOUTH_RANGE: [number, number] = [16, 30];

// Heuristic value coercion for free-form input.
export function coerceSex(v: unknown): Sex | undefined {
  if (v == null) return undefined;
  const s = String(v).trim().toLowerCase();
  if (["m", "male", "1", "homme"].includes(s)) return "male";
  if (["f", "female", "2", "femme"].includes(s)) return "female";
  return undefined;
}

export function coerceEmployment(v: unknown): EmploymentStatus | undefined {
  if (v == null) return undefined;
  const s = String(v).trim().toLowerCase();
  if (["employed", "1", "emp", "e", "working"].includes(s)) return "employed";
  if (["unemployed", "2", "unemp", "u"].includes(s)) return "unemployed";
  if (["outside_lf", "olf", "out", "inactive", "3", "0"].includes(s)) return "outside_lf";
  return undefined;
}

export function coerceArea(v: unknown): Area | undefined {
  if (v == null) return undefined;
  const s = String(v).trim().toLowerCase();
  if (["urban", "u", "1"].includes(s)) return "urban";
  if (["rural", "r", "2"].includes(s)) return "rural";
  return undefined;
}
