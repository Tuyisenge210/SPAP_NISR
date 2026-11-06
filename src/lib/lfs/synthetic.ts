// Synthetic micro-dataset calibrated to NISR LFS Annual Reports 2020-2025.
// Calibration/development only. Never use for official production statistics.
import type { LfsRecord, Sex, EmploymentStatus, Area } from "./schema";
import { IS_DEVELOPMENT_MODE } from "@/lib/env";

const PROVINCES = ["Kigali City", "Southern", "Western", "Northern", "Eastern"] as const;

const PROV_SHARE: Record<(typeof PROVINCES)[number], number> = {
  "Kigali City": 0.16,
  "Southern": 0.22,
  "Western": 0.22,
  "Northern": 0.17,
  "Eastern": 0.23,
};

// Historical LFS data by year (EPR and trends, NISR series)
// Source: NISR Labour Force Survey Annual Reports 2020-2025
const YEARLY_TARGETS: Record<number, { epr: number; ur: number; wap: number }> = {
  2020: { epr: 0.51, ur: 0.16, wap: 7_800_000 },
  2021: { epr: 0.53, ur: 0.14, wap: 8_000_000 },
  2022: { epr: 0.45, ur: 0.21, wap: 8_500_000 },
  2023: { epr: 0.52, ur: 0.15, wap: 8_400_000 },
  2024: { epr: 0.54, ur: 0.14, wap: 8_600_000 },
  2025: { epr: 0.56, ur: 0.12, wap: 8_600_000 },
};

const QUARTERS: Record<1 | 2 | 3 | 4, { wap: number; employed: number; unemployed: number }> = {
  1: { wap: 8_400_000, employed: 4_700_000, unemployed: 593_000 },
  2: { wap: 8_500_000, employed: 4_500_000, unemployed: 710_000 },
  3: { wap: 8_600_000, employed: 4_900_000, unemployed: 754_000 },
  4: { wap: 8_600_000, employed: 4_900_000, unemployed: 646_000 },
};

const MALE_SHARE = 0.48;
const YOUTH_SHARE = 0.45;
const URBAN_SHARE = 0.18;

interface CellTarget {
  sex: Sex;
  ageGroup: "youth" | "adult";
  status: EmploymentStatus;
  area: Area;
  region: string;
  count: number;
  year: number;
  quarter: 1 | 2 | 3 | 4;
}

function ageFor(group: "youth" | "adult"): number {
  return group === "youth" ? 23 : 42;
}

export function generateSynthetic2025(): LfsRecord[] {
  if (!IS_DEVELOPMENT_MODE) return [];
  const records: LfsRecord[] = [];
  let pid = 0;

  for (const year of [2020, 2021, 2022, 2023, 2024, 2025]) {
    const yearly = YEARLY_TARGETS[year];
    
    for (const q of [1, 2, 3, 4] as const) {
      const tgt = QUARTERS[q];
      const scale = yearly.wap / tgt.wap;
      const yWap = tgt.wap * scale;
      const yEmp = tgt.employed * scale;
      const yUnemp = tgt.unemployed * scale;
      
      const lf = yEmp;
      const olf = yWap - lf;

      const wapM = yWap * MALE_SHARE;
      const wapF = yWap - wapM;

      const epRatio = yearly.epr;
      const urRatio = yearly.ur;
      const epM = epRatio * 1.1;
      const epF = epRatio * 0.85;
      const urM = urRatio * 0.85;
      const urF = urRatio * 1.15;
      
      let empM = wapM * epM;
      let empF = wapF * epF;
      let unempM = (empM / (1 - urM)) * urM;
      let unempF = (empF / (1 - urF)) * urF;

      const empScale = yEmp / (empM + empF);
      empM *= empScale; empF *= empScale;
      const unempScale = yUnemp / (unempM + unempF);
      unempM *= unempScale; unempF *= unempScale;
      const olfM = wapM - empM - unempM;
      const olfF = wapF - empF - unempF;

      const youthUR = 0.147, adultUR = 0.108;
      const lfYouth = lf * YOUTH_SHARE;
      const lfAdult = lf - lfYouth;
      const unempYouth = lfYouth * youthUR;
      const unempAdult = lfAdult * adultUR;
      const totalUnempByAge = unempYouth + unempAdult;
      const ageUnempScale = yUnemp / totalUnempByAge;
      const finalUnempY = unempYouth * ageUnempScale;
      const finalUnempA = unempAdult * ageUnempScale;
      const finalEmpY = (lfYouth - unempYouth) * (yEmp / (lfYouth - unempYouth + lfAdult - unempAdult));
      const finalEmpA = yEmp - finalEmpY;

      const wapYouth = yWap * YOUTH_SHARE;
      const wapAdult = yWap - wapYouth;
      const olfYouth = wapYouth - (finalEmpY + finalUnempY);
      const olfAdult = wapAdult - (finalEmpA + finalUnempA);

      const baseCells: Array<{ status: EmploymentStatus; ageGroup: "youth" | "adult"; count: number }> = [
        { status: "employed",   ageGroup: "youth", count: finalEmpY },
        { status: "employed",   ageGroup: "adult", count: finalEmpA },
        { status: "unemployed", ageGroup: "youth", count: finalUnempY },
        { status: "unemployed", ageGroup: "adult", count: finalUnempA },
        { status: "outside_lf", ageGroup: "youth", count: olfYouth },
        { status: "outside_lf", ageGroup: "adult", count: olfAdult },
      ];

      for (const cell of baseCells) {
        const sexShare = (() => {
          if (cell.status === "employed")   return { male: empM / (empM + empF), female: empF / (empM + empF) };
          if (cell.status === "unemployed") return { male: unempM / (unempM + unempF), female: unempF / (unempM + unempF) };
          return { male: olfM / (olfM + olfF), female: olfF / (olfM + olfF) };
        })();

        for (const sex of ["male", "female"] as const) {
          const sexCount = cell.count * sexShare[sex];
          for (const area of ["urban", "rural"] as const) {
            const areaCount = sexCount * (area === "urban" ? URBAN_SHARE : 1 - URBAN_SHARE);
            for (const region of PROVINCES) {
              const w = areaCount * PROV_SHARE[region];
              if (w <= 0) continue;
              records.push({
                person_id: `S${++pid}`,
                year,
                quarter: q,
                age: ageFor(cell.ageGroup),
                sex,
                employment_status: cell.status,
                urban_rural: area,
                region,
                weight: w,
              });
            }
          }
        }
      }

      records.push({
        person_id: `S${++pid}`, year, quarter: q, age: 10,
        sex: "male", employment_status: "outside_lf", urban_rural: "rural",
        region: "Eastern", weight: yWap * 0.0,
      });
    }
  }

  return records;
}
