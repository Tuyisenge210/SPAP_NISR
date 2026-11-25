import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { Catalogue, Dataset, Run, ValidationResult } from "./api";
import { Badge, Icon, Spinner } from "./components/ui";
import { CatalogueView, OverviewView, ProduceView, RunsView, TraceabilityView, ValidationView } from "./views";

type View = "overview" | "produce" | "catalogue" | "trace" | "validation" | "runs";

// Module scope so React StrictMode's double-mounted effect cannot run the
// initial production twice.
let hasBootstrapped = false;

const NAV: { key: View; label: string; icon: string }[] = [
  { key: "overview", label: "Overview", icon: "grid" },
  { key: "produce", label: "Produce", icon: "cog" },
  { key: "catalogue", label: "Catalogue", icon: "book" },
  { key: "trace", label: "Traceability", icon: "route" },
  { key: "validation", label: "Validation", icon: "shield" },
  { key: "runs", label: "Runs", icon: "history" },
];

export default function App() {
  const [view, setView] = useState<View>("overview");
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [dataset, setDataset] = useState("LFS_CALIBRATION");
  const [year, setYear] = useState(2025);
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [traceCode, setTraceCode] = useState("LFPR");
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const notify = useCallback((message: string, error = false) => {
    setToast({ message, error });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const produce = useCallback(
    async (chapters?: number[], nextDataset = dataset, nextYear = year) => {
      setRunning(true);
      try {
        const result = await api.produce(nextDataset, nextYear, chapters);
        setRun(result);
        setValidation(result.validation ?? null);
        if (result.status === "blocked") notify("Production halted by validation failures", true);
        else notify(`Run ${result.id} produced ${result.tables.length} tables in ${Math.round(result.duration_ms ?? 0)} ms`);
        setRuns((current) => [result, ...current.filter((item) => item.id !== result.id)].slice(0, 20));
      } catch (error) {
        notify((error as Error).message, true);
      } finally {
        setRunning(false);
      }
    },
    [dataset, year, notify],
  );

  useEffect(() => {
    (async () => {
      try {
        const [datasetResponse, catalogueResponse, runResponse] = await Promise.all([
          api.datasets(),
          api.catalogue(),
          api.runs(),
        ]);
        setDatasets(datasetResponse.datasets);
        setCatalogue(catalogueResponse);
        setRuns(runResponse.runs as Run[]);
        const first = datasetResponse.datasets[0];
        if (first) {
          const initialYear = first.years[first.years.length - 1] ?? 2025;
          setDataset(first.id);
          setYear(initialYear);
          if (!hasBootstrapped) {
            hasBootstrapped = true;
            produce(undefined, first.id, initialYear);
          }
        }
      } catch (error) {
        notify(`Cannot reach the SPAP API: ${(error as Error).message}`, true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dataset) return;
    let cancelled = false;
    api
      .validation(dataset, year)
      .then((result) => {
        if (!cancelled) setValidation(result);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [dataset, year]);

  const activeDataset = datasets.find((item) => item.id === dataset);
  const years = activeDataset?.years ?? [2025];

  const onUpload = async (file: File) => {
    const name = file.name.replace(/\.csv$/i, "").toUpperCase().replace(/[^A-Z0-9_-]+/g, "_").slice(0, 28) || "UPLOAD";
    try {
      const result = await api.upload(name, year, file);
      setDatasets(result.datasets);
      setDataset(result.dataset);
      notify(`${file.name} uploaded as ${result.dataset} (${year})`);
      produce(undefined, result.dataset, year);
    } catch (error) {
      notify((error as Error).message, true);
    }
  };

  const openTrace = (code: string) => {
    setTraceCode(code);
    setView("trace");
  };

  const openRun = (selected: Run) => {
    setRun(selected);
    setValidation(selected.validation ?? null);
    setDataset(selected.dataset);
    setYear(selected.year);
    setView("produce");
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div className="brand-text">
            <strong>SPAP</strong>
            <span>NISR · LFS production</span>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-label">Workspace</div>
          {NAV.map((item) => (
            <button key={item.key} className={`nav-item ${view === item.key ? "active" : ""}`} onClick={() => setView(item.key)}>
              <Icon name={item.icon} />
              <span className="nav-text">{item.label}</span>
              {item.key === "catalogue" && catalogue ? <span className="count">{catalogue.implemented_tables}/{catalogue.total_tables}</span> : null}
              {item.key === "runs" && runs.length ? <span className="count">{runs.length}</span> : null}
              {item.key === "validation" && validation ? (
                <span className="count">{validation.summary.fail > 0 ? `${validation.summary.fail}!` : validation.summary.warn > 0 ? `${validation.summary.warn}~` : "ok"}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="dataset-card">
            <strong>{activeDataset?.label ?? "No dataset"}</strong>
            {activeDataset?.badge === "Calibration" ? (
              <Badge tone="warn">calibration sample</Badge>
            ) : (
              <Badge tone="blue">field data</Badge>
            )}
            <div style={{ marginTop: 7, lineHeight: 1.45 }}>{activeDataset?.note ?? "Select a dataset to begin."}</div>
          </div>
          <div className="sidebar-note">
            One dataset. One analytical engine. Reproducible tables — every figure keeps its numerator, denominator and producing function.
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>Statistical Production &amp; Analytics Platform</h1>
            <div className="sub">
              {view === "overview" && "Survey context, validation state, table coverage and the latest production run"}
              {view === "produce" && "Ingestion → validation → weighted indicators → chapter tables → export"}
              {view === "catalogue" && "Production catalogue mapped to the LFS report chapters"}
              {view === "trace" && "Where did this figure come from, and how was it calculated?"}
              {view === "validation" && "Structural, completeness and consistency checks"}
              {view === "runs" && "Reproducibility record of every production run"}
            </div>
          </div>

          <div className="topbar-spacer" />

          <div className="control">
            <label>Dataset</label>
            <select value={dataset} onChange={(event) => setDataset(event.target.value)}>
              {datasets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} ({item.badge})
                </option>
              ))}
            </select>
          </div>

          <div className="control">
            <label>Survey year</label>
            <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.target.value = "";
            }}
          />
          <button className="btn" onClick={() => fileInput.current?.click()} title="Upload a CSV microdata extract">
            <Icon name="upload" size={14} /> Upload
          </button>

          <button className="btn btn-primary" onClick={() => produce()} disabled={running}>
            {running ? <Spinner /> : <Icon name="play" size={14} />}
            {running ? "Producing…" : "Produce tables"}
          </button>
        </header>

        <div className="content">
          {view === "overview" ? (
            <OverviewView
              dataset={activeDataset}
              year={year}
              catalogue={catalogue}
              run={run}
              runs={runs}
              validation={validation}
              running={running}
              onProduce={() => produce()}
              onOpenRun={openRun}
            />
          ) : null}
          {view === "produce" ? (
            <ProduceView run={run} running={running} chapters={catalogue?.chapters ?? []} onProduce={produce} onTrace={openTrace} />
          ) : null}
          {view === "catalogue" ? <CatalogueView catalogue={catalogue} onTrace={openTrace} /> : null}
          {view === "trace" ? <TraceabilityView catalogue={catalogue} run={run} code={traceCode} onSelect={setTraceCode} /> : null}
          {view === "validation" ? <ValidationView validation={validation} running={running} /> : null}
          {view === "runs" ? <RunsView runs={runs} onOpen={openRun} /> : null}
        </div>
      </main>

      {toast ? <div className={`toast ${toast.error ? "error" : ""}`}>{toast.message}</div> : null}
    </div>
  );
}
