import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/lfs/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Database, Loader2, UploadCloud } from "lucide-react";
import { getIngestionJob, uploadDataset, type IngestionJob, type IngestionUploadResponse } from "@/lib/api/lfs";
import { SPAP_ENV_BADGE } from "@/lib/env";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Data — SPAP" },
      { name: "description", content: "Upload LFS datasets in .dta, .csv, or .xlsx format to the backend ingestion pipeline." },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [runPipeline, setRunPipeline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [response, setResponse] = useState<IngestionUploadResponse | null>(null);
  const [job, setJob] = useState<IngestionJob | null>(null);

  useEffect(() => {
    if (!response?.job_id || !runPipeline) return;
    let active = true;
    const poll = async () => {
      try {
        const next = await getIngestionJob(response.job_id);
        if (!active) return;
        setJob(next);
        if (["completed", "failed", "rejected"].includes(next.status)) return;
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Unable to fetch ingestion job status.");
        return;
      }
      setTimeout(poll, 2000);
    };
    poll();
    return () => { active = false; };
  }, [response?.job_id, runPipeline]);

  const onSubmit = async () => {
    if (!file) return;
    setError(null); setResponse(null); setJob(null); setUploading(true);
    try {
      const result = await uploadDataset(file, runPipeline);
      setResponse(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-6">
        <div className="mb-2 inline-flex rounded border border-emerald-500 bg-emerald-50 px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-800">[{SPAP_ENV_BADGE}]</div>
        <h1 className="text-2xl font-semibold tracking-tight">Server-side data ingestion</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Uploads are sent to <code>/api/v1/dataset</code> as multipart form data. Supported formats: <code>.dta</code>, <code>.csv</code>, <code>.xlsx</code>, <code>.xls</code>.
          The backend validates the weight column, records a SHA-256 manifest, and can trigger the production pipeline asynchronously.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">1. Upload dataset file</CardTitle></CardHeader>
        <CardContent>
          <label htmlFor="lfs-upload" className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 p-8 text-center transition-colors hover:border-primary/60">
            <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
            <div className="text-sm font-medium">Drop a file or click to browse</div>
            <div className="mt-1 text-xs text-muted-foreground">.dta · .csv · .xlsx · .xls — processed by backend ingestion service</div>
            <input id="lfs-upload" type="file" accept=".csv,.txt,.xlsx,.xls,.dta" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {file && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{file.name}</span>
              <span className="text-muted-foreground">· {(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={runPipeline} onChange={(e) => setRunPipeline(e.target.checked)} />
            Trigger production pipeline after validation
          </label>
          <div className="mt-4 flex gap-2">
            <Button onClick={onSubmit} disabled={!file || uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              Upload to backend
            </Button>
          </div>
          {error && <Alert variant="destructive" className="mt-3"><AlertDescription>{error}</AlertDescription></Alert>}
        </CardContent>
      </Card>

      {response && (
        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">2. Ingestion manifest and status</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Alert className="border-emerald-300 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              <AlertDescription>
                Job <strong>{response.job_id}</strong> accepted for <strong>{response.filename}</strong>. SHA-256: <code className="break-all">{response.sha256}</code>
              </AlertDescription>
            </Alert>
            <div className="grid gap-2 md:grid-cols-2">
              <div><span className="text-muted-foreground">Status:</span> <strong>{job?.status ?? response.status}</strong></div>
              <div><span className="text-muted-foreground">Progress:</span> <strong>{job?.progress ?? "queued/accepted"}{typeof job?.progress === "number" ? "%" : ""}</strong></div>
              <div><span className="text-muted-foreground">Manifest:</span> <code className="break-all text-xs">{response.manifest_path}</code></div>
              <div><span className="text-muted-foreground">Weight column:</span> <strong>{response.validation?.weight_column ?? job?.validation?.weight_column ?? "n/a"}</strong></div>
              <div><span className="text-muted-foreground">Detected year:</span> <strong>{response.validation?.detected_year ?? "n/a"}</strong></div>
              <div><span className="text-muted-foreground">Detected quarter:</span> <strong>{response.validation?.detected_quarter ?? "n/a"}</strong></div>
            </div>
            {job?.message && <div className="text-muted-foreground">{job.message}</div>}
            {response.validation?.warnings?.length ? (
              <Alert><AlertDescription>{response.validation.warnings.map((w, i) => <div key={i}>{w}</div>)}</AlertDescription></Alert>
            ) : null}
            {job?.error && <Alert variant="destructive"><AlertDescription>{job.error}</AlertDescription></Alert>}
            {response.preview?.length ? (
              <div className="overflow-x-auto">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview (first 5 rows)</div>
                <table className="w-full text-xs">
                  <thead><tr className="border-b">{Object.keys(response.preview[0]).slice(0, 12).map((h) => <th key={h} className="py-1 pr-2 text-left">{h}</th>)}</tr></thead>
                  <tbody>{response.preview.map((row, i) => <tr key={i} className="border-b">{Object.keys(response.preview[0]).slice(0, 12).map((h) => <td key={h} className="py-1 pr-2">{String(row[h] ?? "")}</td>)}</tr>)}</tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
