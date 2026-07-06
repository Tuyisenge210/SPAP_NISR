import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/lfs/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLfsStore } from "@/store/lfs-store";
import { useCallback, useState } from "react";
import {
  type RawTable, parseFile, autoMap, applyMapping,
} from "@/lib/lfs/parse";
import { CANONICAL_FIELDS, REQUIRED_FIELDS, type CanonicalField, type SurveyFormat } from "@/lib/lfs/schema";
import { CheckCircle2, FileSpreadsheet, UploadCloud, RotateCcw, Database, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Data — SPAP" },
      { name: "description", content: "Upload LFS datasets in CSV, Excel (.xlsx, .xls) or Stata (.dta) format." },
      { property: "og:title", content: "Data upload — SPAP" },
      { property: "og:description", content: "Statistical data import for NISR Labour Force Survey analysis." },
    ],
  }),
  component: UploadPage,
});

const NONE = "__none__";

function UploadPage() {
  const setDataset = useLfsStore((s) => s.setDataset);
  const dataset = useLfsStore((s) => s.dataset);
  const reset = useLfsStore((s) => s.resetToSynthetic);
  const [table, setTable] = useState<RawTable | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<CanonicalField, string>> | null>(null);
  const [mappingResult, setMappingResult] = useState<{ warnings: string[] } | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: number; warnings: string[]; harmonizationNotes: Record<string, string> } | null>(null);

  const onFile = useCallback(async (f: File) => {
    setError(null); setResult(null); setTable(null); setMappingResult(null);
    try {
      const t = await parseFile(f);
      setTable(t);
      const auto = autoMap(t.columns);
      setMapping(auto.mapping);
      setMappingResult({ warnings: auto.warnings });
      setFileName(f.name);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const finalize = () => {
    if (!table || !mapping) return;
    const res = applyMapping(table, mapping, { year: 2025, format: fileName?.split('.').pop()?.toLowerCase() as SurveyFormat | undefined });
    if (res.missing.length) {
      setError(`Missing required mappings: ${res.missing.join(", ")}`);
      return;
    }
    if (!res.records.length) {
      setError("No valid rows after mapping. Check sex / status / weight columns.");
      return;
    }
    
    // Check validation warnings for critical issues
    const criticalWarnings = Object.entries(res.validationWarnings).filter(([_, w]) => w);
    if (criticalWarnings.length > 0) {
      const warnText = criticalWarnings.map(([f]) => `${f}: ${res.validationWarnings[f]}`).join("; ");
      if (!confirm(`Validation warnings detected: ${warnText}. Continue anyway?`)) return;
    }
    
    setDataset({
      source: "uploaded",
      label: fileName || "Uploaded dataset",
      uploadedAt: new Date().toISOString(),
      records: res.records,
    });
    setResult({ ok: res.records.length, warnings: [...res.warnings, ...criticalWarnings.map(([, w]) => w)], harmonizationNotes: res.harmonizationNotes });
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Data ingestion</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            CSV, Excel (.xlsx/.xls) or Stata (.dta). Map columns to the canonical schema, then publish to the engine.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" />Reset to synthetic
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Upload file</CardTitle>
        </CardHeader>
        <CardContent>
          <label
            htmlFor="lfs-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 p-8 text-center transition-colors hover:border-primary/60"
          >
            <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
            <div className="text-sm font-medium">Drop a file or click to browse</div>
            <div className="mt-1 text-xs text-muted-foreground">.csv · .xlsx · .xls · .dta — processed locally</div>
            <input
              id="lfs-upload"
              type="file"
              accept=".csv,.txt,.xlsx,.xls,.dta"
              className="sr-only"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </label>
          {fileName && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{fileName}</span>
              <span className="text-muted-foreground">· {table?.rows.length.toLocaleString()} rows · {table?.columns.length} columns</span>
            </div>
          )}
{mappingResult?.warnings && mappingResult.warnings.length > 0 && (
           <Alert variant="default" className="mt-3 border-warning/30 bg-warning/5">
             <AlertTriangle className="h-4 w-4 text-warning" />
             <AlertDescription>
               {mappingResult.warnings.map((w, i) => <div key={i}>{w}</div>)}
             </AlertDescription>
           </Alert>
         )}
         {error && (
           <Alert variant="destructive" className="mt-3">
             <AlertDescription>{error}</AlertDescription>
           </Alert>
         )}
        </CardContent>
      </Card>

      {table && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">2. Map columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {CANONICAL_FIELDS.map((f) => {
                const req = REQUIRED_FIELDS.includes(f);
                return (
                  <div key={f}>
                    <Label className="text-xs">
                      {f}
                      {req && <span className="ml-1 text-destructive">*</span>}
                    </Label>
                    <Select
                      value={mapping[f] ?? NONE}
                      onValueChange={(v) => setMapping((m) => ({ ...m, [f]: v === NONE ? undefined : v }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="— not mapped —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>— not mapped —</SelectItem>
                        {table.columns.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Button onClick={finalize}>Publish to engine</Button>
              <span className="text-xs text-muted-foreground">Required: {REQUIRED_FIELDS.join(", ")}</span>
            </div>
{result && (
               <Alert className="mt-4 border-success/30 bg-success/5">
                 <CheckCircle2 className="h-4 w-4 text-success" />
                 <AlertDescription>
                   Loaded <strong>{result.ok.toLocaleString()}</strong> records into the engine.
                   {result.warnings.map((w, i) => <div key={i} className="mt-1 text-xs text-muted-foreground">{w}</div>)}
                   {Object.keys(result.harmonizationNotes).length > 0 && (
                     <div className="mt-2 text-xs" style={{ color: "var(--color-primary)" }}>
                       <strong>Harmonization notes:</strong>
                       <ul className="mt-1 list-disc pl-4 space-y-0.5">
                         {Object.entries(result.harmonizationNotes).map(([field, note]) => (
                           <li key={field}><strong>{field}:</strong> {note}</li>
                         ))}
                       </ul>
                     </div>
                   )}
                 </AlertDescription>
               </Alert>
             )}
           </CardContent>
         </Card>
       )}

       <Card className="mt-4">
         <CardHeader>
           <CardTitle className="text-base">3. Stata / R users</CardTitle>
         </CardHeader>
         <CardContent className="space-y-2 text-sm text-muted-foreground">
           <p>Export Stata .dta to CSV (STATA):</p>
           <pre className="overflow-x-auto rounded-md bg-secondary p-3 text-xs text-foreground">
             export delimited using "lfs_data.csv", replace
           </pre>
           <p>R users can use haven package:</p>
           <pre className="overflow-x-auto rounded-md bg-secondary p-3 text-xs text-foreground">
             write.csv(read_dta("lfs_data.dta"), "lfs_data.csv", row.names = FALSE)
           </pre>
         </CardContent>
       </Card>

      <div className="mt-6 text-xs text-muted-foreground">
        Active dataset: <strong className="text-foreground">{dataset.label}</strong> · {dataset.records.length.toLocaleString()} rows
      </div>
    </AppShell>
  );
}
