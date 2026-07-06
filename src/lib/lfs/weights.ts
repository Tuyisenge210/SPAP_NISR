// Weighted statistical primitives. All indicators in the system go through these.
import type { LfsRecord } from "./schema";

export type Pred<T = LfsRecord> = (r: T) => boolean;

export function weightedCount(rows: LfsRecord[], pred?: Pred): number {
  let s = 0;
  for (const r of rows) {
    if (!pred || pred(r)) s += r.weight;
  }
  return s;
}

export function weightedSum(rows: LfsRecord[], get: (r: LfsRecord) => number, pred?: Pred) {
  let s = 0;
  for (const r of rows) {
    if (pred && !pred(r)) continue;
    const v = get(r);
    if (Number.isFinite(v)) s += r.weight * v;
  }
  return s;
}

export function weightedMean(rows: LfsRecord[], get: (r: LfsRecord) => number, pred?: Pred) {
  let num = 0, den = 0;
  for (const r of rows) {
    if (pred && !pred(r)) continue;
    const v = get(r);
    if (Number.isFinite(v)) {
      num += r.weight * v;
      den += r.weight;
    }
  }
  return den > 0 ? num / den : 0;
}

export function weightedProportion(rows: LfsRecord[], numPred: Pred, denPred: Pred) {
  const num = weightedCount(rows, (r) => denPred(r) && numPred(r));
  const den = weightedCount(rows, denPred);
  return den > 0 ? num / den : 0;
}

export function weightedCrossTab(
  rows: LfsRecord[],
  rowKey: (r: LfsRecord) => string,
  colKey: (r: LfsRecord) => string,
  pred?: Pred,
): { rows: string[]; cols: string[]; matrix: number[][]; totals: { row: number[]; col: number[]; grand: number } } {
  const rowSet = new Set<string>();
  const colSet = new Set<string>();
  const map = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (pred && !pred(r)) continue;
    const rk = rowKey(r);
    const ck = colKey(r);
    rowSet.add(rk);
    colSet.add(ck);
    if (!map.has(rk)) map.set(rk, new Map());
    const m = map.get(rk)!;
    m.set(ck, (m.get(ck) ?? 0) + r.weight);
  }
  const rowKeys = [...rowSet].sort();
  const colKeys = [...colSet].sort();
  const matrix = rowKeys.map((rk) => colKeys.map((ck) => map.get(rk)?.get(ck) ?? 0));
  const rowTotals = matrix.map((r) => r.reduce((a, b) => a + b, 0));
  const colTotals = colKeys.map((_, j) => matrix.reduce((s, r) => s + r[j], 0));
  const grand = rowTotals.reduce((a, b) => a + b, 0);
  return { rows: rowKeys, cols: colKeys, matrix, totals: { row: rowTotals, col: colTotals, grand } };
}
