import * as XLSX from "xlsx";
import type { NamedTable } from "./crosstabs";

export function downloadExcel(tables: NamedTable[], filename = "lfs-tables.xlsx") {
  const wb = XLSX.utils.book_new();
  for (const t of tables) {
    const aoa = [t.headers, ...t.rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, t.name.slice(0, 31));
  }
  XLSX.writeFile(wb, filename);
}

export function downloadCsv(table: NamedTable, filename?: string) {
  const aoa = [table.headers, ...table.rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `${table.name.replace(/\s+/g, "-").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
