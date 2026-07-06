// CSV / XLSX ingestion + column mapping into the canonical LfsRecord.
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  type LfsRecord, type CanonicalField, CANONICAL_FIELDS, REQUIRED_FIELDS,
  coerceSex, coerceEmployment, coerceArea,
} from "./schema";
import { metadataRegistry, type HarmonizationRule } from "./metadata-registry";

export interface RawTable {
  columns: string[];
  rows: Record<string, unknown>[];
}

export async function parseFile(file: File): Promise<RawTable> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt")) return parseCsv(file);
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return parseXlsx(file);
  if (name.endsWith(".dta")) return parseDta(file);
  throw new Error("Unsupported file format. Use CSV, Excel (.xlsx/.xls) or Stata (.dta).");
}

function parseCsv(file: File): Promise<RawTable> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = res.meta.fields ?? [];
        resolve({ columns: cols, rows: res.data });
      },
      error: reject,
    });
  });
}

async function parseXlsx(file: File): Promise<RawTable> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return { columns, rows };
}

// Stata (.dta) parsing - requires server-side conversion or wasm module.
// For now, guide users to export CSV from Stata/R first.
async function parseDta(_file: File): Promise<RawTable> {
  throw new Error("Stata files require conversion. Use: export delimited in STATA or write.csv in R, or install a .dta wasm parser.");
}

/**
 * Metadata-driven auto-mapping using the Metadata Registry.
 * Recognizes standard LFS variables across survey years (2020 onward) with aliases.
 */
export function autoMap(columns: string[]): { mapping: Partial<Record<CanonicalField, string>>; warnings: string[] } {
  const mapping: Partial<Record<CanonicalField, string>> = {};
  const warnings: string[] = [];
  const used = new Set<string>();

  const lowerColumns = columns.map((c) => c.toLowerCase());
  const aliasMap = metadataRegistry.getAliasMap();

  for (const field of CANONICAL_FIELDS) {
    const variable = metadataRegistry.getVariable(field);
    if (!variable) continue;

    const aliases = variable.aliases;
    for (const alias of aliases) {
      const lowerAlias = alias.toLowerCase();
      const idx = lowerColumns.findIndex((c, i) => {
        if (used.has(c)) return false;
        if (c === lowerAlias) return true;
        if (c.includes(lowerAlias) && lowerAlias.length >= 4) return true;
        if (lowerAlias.includes(c) && c.length >= 4) return true;
        return false;
      });

      if (idx >= 0) {
        const sourceCol = columns[idx];
        const lowerCol = lowerColumns[idx];

        const validation = metadataRegistry.validateMapping(sourceCol, field);
        if (!validation.valid && validation.warning) {
          warnings.push(`Ambiguous mapping: ${validation.warning}. Manual review recommended.`);
          continue;
        }

        mapping[field] = sourceCol;
        used.add(lowerCol);
        break;
      }
    }
  }

  const unmapped = columns.filter((c, i) => !used.has(lowerColumns[i]));
  if (unmapped.length > 0 && Object.keys(mapping).length < REQUIRED_FIELDS.length) {
    warnings.push(`${unmapped.length} column(s) could not be automatically mapped. Please review column mappings.`);
  }

  return { mapping, warnings };
}

/**
 * Validates a specific mapping assignment using Metadata Registry rules.
 * Prevents incorrect assignments like age mapped to "discourage" or employment_status mapped to "LFS_year".
 */
export function validateMapping(
  sourceColumn: string,
  canonicalField: CanonicalField,
  sampleValues: unknown[] = []
): { valid: boolean; warning?: string } {
  return metadataRegistry.validateMapping(sourceColumn, canonicalField);
}

export interface MappingResult {
  records: LfsRecord[];
  missing: CanonicalField[];
  warnings: string[];
  validationWarnings: Record<string, string>;
  harmonizationNotes: Record<string, string>;
}

export function applyMapping(
  table: RawTable,
  mapping: Partial<Record<CanonicalField, string>>,
  options: { year?: number; format?: string } = {}
): MappingResult {
  const missing = REQUIRED_FIELDS.filter((f) => !mapping[f]);
  const warnings: string[] = [];
  const validationWarnings: Record<string, string> = {};
  const harmonizationNotes: Record<string, string> = {};

  if (missing.length) return { records: [], missing, warnings, validationWarnings, harmonizationNotes };

  // Validate mappings before processing and collect harmonization notes
  for (const field of REQUIRED_FIELDS) {
    if (mapping[field]) {
      const colIdx = table.columns.findIndex(c => c === mapping[field]);
      if (colIdx >= 0) {
        const sample = table.rows.slice(0, 20).map(r => r[table.columns[colIdx]]);
        const v = validateMapping(mapping[field], field, sample);
        if (!v.valid && v.warning) {
          validationWarnings[field] = v.warning;
        }

        // Collect harmonization notes from registry
        if (options.year) {
          const harmRule = metadataRegistry.getHarmonization(field, options.year) as HarmonizationRule | undefined;
          if (harmRule?.notes) {
            harmonizationNotes[field] = `Year ${options.year}: ${harmRule.notes}`;
          }
        }
      }
    }
  }

  const records: LfsRecord[] = [];
  let coerceFails = 0;
  for (const row of table.rows) {
    const get = (f: CanonicalField) => row[mapping[f]!];
    const sex = coerceSex(get("sex"));
    const status = coerceEmployment(get("employment_status"));
    const area = coerceArea(get("urban_rural")) ?? "rural";
    const age = Number(get("age"));
    const weight = Number(get("weight"));
    const year = Number(get("year"));
    const quarter = Number(get("quarter"));
    if (!sex || !status || !Number.isFinite(age) || !Number.isFinite(weight) || weight < 0) {
      coerceFails++;
      continue;
    }
    records.push({
      person_id: mapping.person_id ? String(get("person_id") ?? "") : undefined,
      household_id: mapping.household_id ? String(get("household_id") ?? "") : undefined,
      year, quarter: (quarter as 1 | 2 | 3 | 4),
      age, sex, employment_status: status,
      education: mapping.education ? String(get("education") ?? "") : undefined,
      occupation: mapping.occupation ? String(get("occupation") ?? "") : undefined,
      industry: mapping.industry ? String(get("industry") ?? "") : undefined,
      hours_worked: mapping.hours_worked ? Number(get("hours_worked")) : undefined,
      earnings: mapping.earnings ? Number(get("earnings")) : undefined,
      region: mapping.region ? String(get("region") ?? "") : undefined,
      district: mapping.district ? String(get("district") ?? "") : undefined,
      urban_rural: area,
      weight,
    });
  }
  if (coerceFails) warnings.push(`${coerceFails.toLocaleString()} row(s) skipped (invalid sex / status / age / weight).`);
  return { records, missing, warnings, validationWarnings, harmonizationNotes };
}

export { CANONICAL_FIELDS };
export { metadataRegistry };