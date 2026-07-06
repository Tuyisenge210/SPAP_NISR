// Core ILO / NISR labour-market indicators, all weighted.
import type { LfsRecord } from "./schema";
import { WORKING_AGE, YOUTH_RANGE } from "./schema";
import { weightedCount, weightedProportion } from "./weights";

export const isWAP = (r: LfsRecord) => r.age >= WORKING_AGE;
export const isEmployed = (r: LfsRecord) => r.employment_status === "employed";
export const isUnemployed = (r: LfsRecord) => r.employment_status === "unemployed";
export const isInLF = (r: LfsRecord) => isEmployed(r) || isUnemployed(r);
export const isYouth = (r: LfsRecord) => r.age >= YOUTH_RANGE[0] && r.age <= YOUTH_RANGE[1];
export const isAdult = (r: LfsRecord) => r.age > YOUTH_RANGE[1];

export interface IndicatorBundle {
  wap: number;
  labourForce: number;
  employed: number;
  unemployed: number;
  outsideLF: number;
  lfpr: number;          // Labour Force Participation Rate
  epr: number;           // Employment-to-Population Ratio
  unemploymentRate: number;
  youthUnemploymentRate: number;
  adultUnemploymentRate: number;
  youthEPR: number;
  maleEPR: number;
  femaleEPR: number;
  maleUR: number;
  femaleUR: number;
  femaleLFPR: number;
  maleLFPR: number;
  genderEmploymentGap: number;   // male EPR − female EPR (percentage points)
}

export function computeIndicators(rows: LfsRecord[]): IndicatorBundle {
  const wap = weightedCount(rows, isWAP);
  const employed = weightedCount(rows, (r) => isWAP(r) && isEmployed(r));
  const unemployed = weightedCount(rows, (r) => isWAP(r) && isUnemployed(r));
  const labourForce = employed + unemployed;
  const outsideLF = wap - labourForce;

  const lfpr = wap > 0 ? labourForce / wap : 0;
  const epr = wap > 0 ? employed / wap : 0;
  const unemploymentRate = labourForce > 0 ? unemployed / labourForce : 0;

  const youthUnemploymentRate = weightedProportion(
    rows,
    (r) => isUnemployed(r),
    (r) => isWAP(r) && isYouth(r) && isInLF(r),
  );
  const adultUnemploymentRate = weightedProportion(
    rows,
    (r) => isUnemployed(r),
    (r) => isWAP(r) && isAdult(r) && isInLF(r),
  );
  const youthEPR = weightedProportion(
    rows,
    (r) => isEmployed(r),
    (r) => isWAP(r) && isYouth(r),
  );

  const maleEPR = weightedProportion(rows, isEmployed, (r) => isWAP(r) && r.sex === "male");
  const femaleEPR = weightedProportion(rows, isEmployed, (r) => isWAP(r) && r.sex === "female");
  const maleUR = weightedProportion(
    rows, isUnemployed,
    (r) => isWAP(r) && r.sex === "male" && isInLF(r),
  );
  const femaleUR = weightedProportion(
    rows, isUnemployed,
    (r) => isWAP(r) && r.sex === "female" && isInLF(r),
  );
  const maleLFPR = weightedProportion(rows, isInLF, (r) => isWAP(r) && r.sex === "male");
  const femaleLFPR = weightedProportion(rows, isInLF, (r) => isWAP(r) && r.sex === "female");

  return {
    wap, labourForce, employed, unemployed, outsideLF,
    lfpr, epr, unemploymentRate,
    youthUnemploymentRate, adultUnemploymentRate, youthEPR,
    maleEPR, femaleEPR, maleUR, femaleUR, femaleLFPR, maleLFPR,
    genderEmploymentGap: maleEPR - femaleEPR,
  };
}

export function pct(x: number, digits = 1): string {
  return `${(x * 100).toFixed(digits)} %`;
}

export function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return n.toFixed(0);
}
