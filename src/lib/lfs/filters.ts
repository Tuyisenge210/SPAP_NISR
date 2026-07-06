import type { LfsRecord, Sex, Area } from "./schema";
import { YOUTH_RANGE } from "./schema";

export type AgeGroup = "all" | "youth" | "adult";

export interface FilterState {
  year?: number;
  quarter?: 1 | 2 | 3 | 4;
  sex?: Sex;
  ageGroup?: AgeGroup;
  region?: string;
  district?: string;
  area?: Area;
}

export function applyFilter(rows: LfsRecord[], f: FilterState): LfsRecord[] {
  return rows.filter((r) => {
    if (f.year != null && r.year !== f.year) return false;
    if (f.quarter != null && r.quarter !== f.quarter) return false;
    if (f.sex && r.sex !== f.sex) return false;
    if (f.region && r.region !== f.region) return false;
    if (f.district && r.district !== f.district) return false;
    if (f.area && r.urban_rural !== f.area) return false;
    if (f.ageGroup === "youth" && (r.age < YOUTH_RANGE[0] || r.age > YOUTH_RANGE[1])) return false;
    if (f.ageGroup === "adult" && r.age <= YOUTH_RANGE[1]) return false;
    return true;
  });
}

export function uniqueYears(rows: LfsRecord[]): number[] {
  return [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
}
export function uniqueQuarters(rows: LfsRecord[]): number[] {
  return [...new Set(rows.map((r) => r.quarter))].sort((a, b) => a - b);
}
export function uniqueRegions(rows: LfsRecord[]): string[] {
  return [...new Set(rows.map((r) => r.region).filter(Boolean))].sort() as string[];
}
export function uniqueDistricts(rows: LfsRecord[], region?: string): string[] {
  return [
    ...new Set(
      rows.filter(r => !region || r.region === region)
        .map((r) => r.district).filter(Boolean)
    )
  ].sort() as string[];
}
