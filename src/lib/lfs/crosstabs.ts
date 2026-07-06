import type { LfsRecord } from "./schema";
import { weightedCount } from "./weights";
import { isEmployed, isInLF, isUnemployed, isWAP, isYouth, isAdult } from "./indicators";

export interface NamedTable {
  name: string;
  headers: string[];
  rows: (string | number)[][];
}

function pctRow(num: number, den: number): string {
  return den > 0 ? `${((num / den) * 100).toFixed(1)} %` : "—";
}
function k(n: number): string {
  return Math.round(n).toLocaleString();
}

// Standard LFS table: Labour force status by sex.
export function tableLFStatusBySex(rows: LfsRecord[]): NamedTable {
  const out: (string | number)[][] = [];
  for (const sex of ["male", "female", "both"] as const) {
    const pred = (r: LfsRecord) => isWAP(r) && (sex === "both" || r.sex === sex);
    const wap = weightedCount(rows, pred);
    const emp = weightedCount(rows, (r) => pred(r) && isEmployed(r));
    const unemp = weightedCount(rows, (r) => pred(r) && isUnemployed(r));
    const lf = emp + unemp;
    const olf = wap - lf;
    out.push([
      sex === "both" ? "Both sexes" : sex[0].toUpperCase() + sex.slice(1),
      k(wap), k(lf), k(emp), k(unemp), k(olf),
      pctRow(lf, wap), pctRow(emp, wap), pctRow(unemp, lf),
    ]);
  }
  return {
    name: "Labour force status by sex",
    headers: ["Sex", "Working-age pop.", "Labour force", "Employed", "Unemployed", "Outside LF", "LFPR", "EPR", "Unemp. rate"],
    rows: out,
  };
}

export function tableYouthAdult(rows: LfsRecord[]): NamedTable {
  const out: (string | number)[][] = [];
  for (const [label, age] of [
    ["Youth (16–30)", isYouth],
    ["Adult (31+)", isAdult],
  ] as const) {
    const pred = (r: LfsRecord) => isWAP(r) && age(r);
    const wap = weightedCount(rows, pred);
    const emp = weightedCount(rows, (r) => pred(r) && isEmployed(r));
    const unemp = weightedCount(rows, (r) => pred(r) && isUnemployed(r));
    const lf = emp + unemp;
    out.push([label, k(wap), k(emp), k(unemp), pctRow(lf, wap), pctRow(emp, wap), pctRow(unemp, lf)]);
  }
  return {
    name: "Labour force status by age group",
    headers: ["Age group", "Working-age pop.", "Employed", "Unemployed", "LFPR", "EPR", "Unemp. rate"],
    rows: out,
  };
}

export function tableByRegion(rows: LfsRecord[]): NamedTable {
  const regions = [...new Set(rows.map((r) => r.region).filter(Boolean))].sort() as string[];
  const out: (string | number)[][] = regions.map((reg) => {
    const pred = (r: LfsRecord) => isWAP(r) && r.region === reg;
    const wap = weightedCount(rows, pred);
    const emp = weightedCount(rows, (r) => pred(r) && isEmployed(r));
    const unemp = weightedCount(rows, (r) => pred(r) && isUnemployed(r));
    const lf = emp + unemp;
    return [reg, k(wap), k(emp), k(unemp), pctRow(lf, wap), pctRow(emp, wap), pctRow(unemp, lf)];
  });
  return {
    name: "Labour force status by region",
    headers: ["Region", "Working-age pop.", "Employed", "Unemployed", "LFPR", "EPR", "Unemp. rate"],
    rows: out,
  };
}

export function tableByArea(rows: LfsRecord[]): NamedTable {
  const out: (string | number)[][] = [];
  for (const area of ["urban", "rural"] as const) {
    const pred = (r: LfsRecord) => isWAP(r) && r.urban_rural === area;
    const wap = weightedCount(rows, pred);
    const emp = weightedCount(rows, (r) => pred(r) && isEmployed(r));
    const unemp = weightedCount(rows, (r) => pred(r) && isUnemployed(r));
    const lf = emp + unemp;
    out.push([area === "urban" ? "Urban" : "Rural", k(wap), k(emp), k(unemp), pctRow(lf, wap), pctRow(emp, wap), pctRow(unemp, lf)]);
  }
  return {
    name: "Labour force status by area",
    headers: ["Area", "Working-age pop.", "Employed", "Unemployed", "LFPR", "EPR", "Unemp. rate"],
    rows: out,
  };
}

export function tableByQuarter(rows: LfsRecord[]): NamedTable {
  const quarters = [...new Set(rows.map((r) => `${r.year}-Q${r.quarter}`))].sort();
  const out: (string | number)[][] = quarters.map((label) => {
    const [y, q] = [Number(label.slice(0, 4)), Number(label.slice(-1))];
    const pred = (r: LfsRecord) => isWAP(r) && r.year === y && r.quarter === q;
    const wap = weightedCount(rows, pred);
    const emp = weightedCount(rows, (r) => pred(r) && isEmployed(r));
    const unemp = weightedCount(rows, (r) => pred(r) && isUnemployed(r));
    const lf = emp + unemp;
    return [label, k(wap), k(emp), k(unemp), pctRow(lf, wap), pctRow(emp, wap), pctRow(unemp, lf)];
  });
  return {
    name: "Quarterly trend",
    headers: ["Period", "Working-age pop.", "Employed", "Unemployed", "LFPR", "EPR", "Unemp. rate"],
    rows: out,
  };
}

export function allStandardTables(rows: LfsRecord[]): NamedTable[] {
  return [
    tableLFStatusBySex(rows),
    tableYouthAdult(rows),
    tableByArea(rows),
    tableByRegion(rows),
    tableByQuarter(rows),
  ];
}
