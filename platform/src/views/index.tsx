import { useEffect, useMemo, useState } from "react";
import type { Catalogue, Chapter, Dataset, ExportRecord, Kpi, Run, Table, ValidationResult } from "../api";
import { api } from "../api";
import { Badge, BarList, Card, CardHead, DataTable, Icon, KpiCard, Spinner, StatusBadge, Stepper, TrendChart } from "../components/ui";

/* ============================== OVERVIEW ============================== */

function when(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.toLocaleDateString([], { day: "2-digit", month: "short" })} · ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function OverviewView({
  dataset,
  year,
  catalogue,
  run,
  runs,
  validation,
  running,
  onProduce,
  onOpenRun,
}: {
  dataset?: Dataset;
  year: number;
  catalogue: Catalogue | null;
  run: Run | null;
  runs: Run[];
  validation: ValidationResult | null;
  running: boolean;
  onProduce: () => void;
  onOpenRun: (run: Run) => void;
}) {
  const [lastExport, setLastExport] = useState<ExportRecord | null>(null);
  const [exportCount, setExportCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .exports()
      .then((result) => {
        if (cancelled) return;
        setLastExport(result.exports[0] ?? null);
        setExportCount(result.count);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [run?.id]);

  const complete = run?.status === "complete";
  const blocking = validation?.summary.fail ?? 0;
  const implemented = catalogue?.implemented_tables ?? 0;
  const totalTables = catalogue?.total_tables ?? 0;
  const coverage = totalTables ? Math.round((implemented / totalTables) * 100) : 0;
  const rows = validation?.rows ?? run?.records ?? 0;

  return (
    <div className="stack">
      <Card>
        <div className="card-head">
          <h2>Production status</h2>
          <Badge tone={complete ? "ok" : blocking ? "danger" : run ? "warn" : "muted"}>
            {run ? (complete ? "complete" : blocking ? "halted" : run.status) : "no run"}
          </Badge>
          {run?.synthetic ? <Badge tone="warn">calibration sample</Badge> : run ? <Badge tone="blue">field data</Badge> : null}
          <div className="spacer" />
          <span className="tiny">{run ? `run ${run.id} · ${when(run.created_at)}` : "no run yet"}</span>
        </div>

        <div className="stat-row">
          <div className="mini-stat">
            <div className="v" style={{ fontSize: 14, paddingTop: 6 }}>{dataset?.label ?? "No survey"}</div>
            <div className="l">survey · {year}</div>
          </div>
          <div className="mini-stat"><div className="v">{rows.toLocaleString()}</div><div className="l">records in scope</div></div>
          <div className="mini-stat">
            <div className="v">{run?.tables.length ?? 0}<span style={{ fontSize: 13, color: "var(--muted)" }}> / {totalTables}</span></div>
            <div className="l">tables produced</div>
          </div>
          <div className="mini-stat"><div className="v">{run?.duration_ms ? `${Math.round(run.duration_ms)} ms` : "—"}</div><div className="l">last run duration</div></div>
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={onProduce} disabled={running}>
            {running ? <Spinner /> : <Icon name="play" size={14} />}
            {running ? "Producing…" : "Produce tables"}
          </button>
          {run && complete ? (
            <a className="btn" href={api.exportUrl(run.id, "all")}>
              <Icon name="download" size={14} /> Export all chapters
            </a>
          ) : null}
          {run ? <button className="btn btn-ghost" onClick={() => onOpenRun(run)}>Open run →</button> : null}
        </div>
      </Card>

      <div className="overview-grid">
        <Card>
          <CardHead title="Readiness" hint="what is in place, and what would stop publication" />
          <div className="status-row">
            <span className={`status-dot ${rows > 0 ? "ok" : "idle"}`} />
            <div>
              <div className="label">Microdata loaded</div>
              <div className="detail">
                {rows
                  ? `${rows.toLocaleString()} person records · fingerprint ${validation?.fingerprint ?? run?.fingerprint ?? "—"}`
                  : "no dataset resolved for this survey and year"}
              </div>
            </div>
            <Badge tone={rows ? "ok" : "muted"}>{rows ? "ready" : "missing"}</Badge>
          </div>
          <div className="status-row">
            <span className={`status-dot ${blocking ? "warn" : validation ? "ok" : "idle"}`} />
            <div>
              <div className="label">Validation</div>
              <div className="detail">
                {validation
                  ? `${validation.summary.pass} passed · ${validation.summary.warn} warnings · ${validation.summary.fail} blocking`
                  : "not yet checked for this selection"}
              </div>
            </div>
            <Badge tone={blocking ? "danger" : validation ? "ok" : "muted"}>{blocking ? "blocked" : validation ? "passed" : "pending"}</Badge>
          </div>
          <div className="status-row">
            <span className={`status-dot ${complete ? "ok" : "idle"}`} />
            <div>
              <div className="label">Chapter tables</div>
              <div className="detail">{implemented} of {totalTables} catalogue tables wired to a producer ({coverage}%)</div>
            </div>
            <Badge tone={complete ? "ok" : "muted"}>{run ? `${run.tables.length} built` : "not built"}</Badge>
          </div>
          <div className="status-row">
            <span className={`status-dot ${lastExport ? "ok" : "idle"}`} />
            <div>
              <div className="label">Publication export</div>
              <div className="detail">{lastExport ? `${lastExport.filename} · ${when(lastExport.at)}` : "no workbook exported in this session yet"}</div>
            </div>
            <Badge tone={lastExport ? "ok" : "muted"}>{lastExport ? "exported" : "not yet"}</Badge>
          </div>
        </Card>

        <Card>
          <CardHead title="Latest run" hint="nine recorded steps" />
          {run ? (
            <>
              <div className="steps">
                {run.steps.map((step, index) => (
                  <div key={step.key} className={`step ${step.status}`} style={{ animationDelay: `${index * 30}ms` }}>
                    <div className="step-top">
                      <span className="step-index">{index + 1}</span>
                      <span className="step-label">{step.label}</span>
                    </div>
                    <div className="step-ms">{step.ms} ms</div>
                  </div>
                ))}
              </div>
              <div className="tiny" style={{ marginTop: 10 }}>
                {run.records.toLocaleString()} records · {run.tables.length} tables · {Math.round(run.duration_ms ?? 0)} ms
              </div>
            </>
          ) : (
            <div className="empty">Run the pipeline to see the nine production steps here.</div>
          )}
        </Card>
      </div>

      <Card>
        <div className="card-head">
          <h2>Table coverage by chapter</h2>
          <span className="hint">{implemented}/{totalTables} implemented across {catalogue?.chapters.length ?? 0} chapters</span>
          <div className="spacer" />
          <Badge tone="blue">{exportCount} exports this session</Badge>
        </div>
        {catalogue ? (
          <div className="bars">
            {catalogue.chapters.map((chapter) => (
              <div className="bar-row" key={chapter.id} style={{ gridTemplateColumns: "minmax(90px, 1.2fr) 1fr 46px" }}>
                <span className="muted">{chapter.id}. {chapter.short}</span>
                <span className="bar-track">
                  <span className="bar-fill" style={{ width: `${(chapter.implemented / Math.max(chapter.total, 1)) * 100}%` }} />
                </span>
                <span className="val">{chapter.implemented}/{chapter.total}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">Loading catalogue…</div>
        )}
      </Card>

      <Card>
        <CardHead title="Recent runs" hint="most recent first" />
        {runs.length ? (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Survey</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th>Tables</th>
                  <th>Duration</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, 4).map((item) => (
                  <tr key={item.id}>
                    <td className="cat mono">{item.id}</td>
                    <td className="cat">{item.dataset_label ?? item.dataset}</td>
                    <td>{item.year}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>{item.tables?.length ?? item.table_count ?? 0}</td>
                    <td>{Math.round(item.duration_ms ?? 0)} ms</td>
                    <td className="tiny">{when(item.created_at)}</td>
                    <td><button className="btn btn-sm btn-ghost" onClick={() => onOpenRun(item)}>Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No runs recorded in this session.</div>
        )}
      </Card>
    </div>
  );
}

/* ============================== PRODUCE ============================== */

function TableCard({ table, run }: { table: Table; run: Run }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="table-card">
      <div className="card-head">
        <Badge tone="blue">Table {table.id}</Badge>
        <h3>{table.title}</h3>
        <div className="spacer" />
        <a className="btn btn-sm btn-ghost" href={api.exportUrl(run.id, String(table.chapter))} title={`Export chapter ${table.chapter} to Excel`}>
          <Icon name="download" size={13} /> Excel
        </a>
      </div>
      <DataTable table={table} limit={expanded ? 0 : 9} />
      <div className="row" style={{ marginTop: 10, justifyContent: "space-between" }}>
        <span className="tiny">
          {table.rows.length} rows · {table.indicators?.length ? table.indicators.join(" · ") : "share of employment"}
        </span>
        {table.rows.length > 9 ? (
          <button className="btn btn-sm btn-ghost" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Collapse" : `Show all ${table.rows.length}`}
          </button>
        ) : null}
      </div>
    </Card>
  );
}

export function ProduceView({
  run,
  running,
  chapters,
  onProduce,
  onTrace,
}: {
  run: Run | null;
  running: boolean;
  chapters: Chapter[];
  onProduce: (chapters?: number[]) => void;
  onTrace: (code: string) => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);

  if (!run) {
    return (
      <Card>
        <div className="empty">
          <Icon name="play" size={22} />
          <p style={{ margin: "10px 0 4px", color: "var(--text)", fontWeight: 600 }}>No production run yet</p>
          <p style={{ margin: 0 }}>Select a dataset and year, then produce the LFS tables.</p>
        </div>
      </Card>
    );
  }

  const toggle = (id: number) =>
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));

  const visible = selected.length ? run.tables.filter((table) => selected.includes(table.chapter)) : run.tables;
  const blocked = run.status === "blocked";

  return (
    <div className="stack">
      <Card>
        <div className="card-head">
          <h2>Production run</h2>
          <Badge tone={blocked ? "danger" : "accent"}>{blocked ? "halted" : "complete"}</Badge>
          {run.synthetic ? <Badge tone="warn">calibration sample</Badge> : <Badge tone="blue">field data</Badge>}
          <div className="spacer" />
          <span className="tiny mono">{run.id}</span>
        </div>

        <div className="row" style={{ gap: 18, marginBottom: 16 }}>
          <span className="tiny">
            <strong className="muted">{run.dataset_label ?? run.dataset}</strong> · {run.year}
          </span>
          <span className="tiny">{run.records.toLocaleString()} records</span>
          <span className="tiny">fingerprint {run.fingerprint}</span>
          <span className="tiny">{run.duration_ms?.toFixed(0)} ms</span>
          <span className="tiny">{run.table_count ?? run.tables.length} tables</span>
          <div className="spacer" />
          {!blocked ? (
            <a className="btn btn-sm" href={api.exportUrl(run.id, "all")}>
              <Icon name="download" size={13} /> Export all chapters
            </a>
          ) : null}
        </div>

        <Stepper steps={run.steps} />
      </Card>

      {blocked ? (
        <Card>
          <CardHead title="Production halted" hint="Resolve blocking validation failures before tables are produced" />
          <div className="empty">
            <Icon name="alert" size={20} />
            <p style={{ marginTop: 8 }}>{run.steps.find((step) => step.key === "validate")?.detail}</p>
          </div>
        </Card>
      ) : null}

      {!blocked ? (
        <>
          <div className="kpi-grid">
            {run.kpis.map((kpi: Kpi) => (
              <KpiCard key={kpi.code} kpi={kpi} onSelect={onTrace} />
            ))}
          </div>

          <div className="chart-grid">
            <Card>
              <CardHead title="Labour market indicators by year" hint="weighted, population 16+" />
              <TrendChart data={run.charts.trend} />
            </Card>
            <Card>
              <CardHead title="Participation by province" hint={`${run.year}`} />
              <BarList data={run.charts.by_province} />
            </Card>
          </div>
        </>
      ) : null}

      <Card>
        <div className="card-head">
          <h2>Chapter tables</h2>
          <span className="hint">select chapters to re-produce a subset</span>
          <div className="spacer" />
          <button className="btn btn-sm btn-primary" disabled={running} onClick={() => onProduce(selected.length ? selected : undefined)}>
            {running ? <Spinner /> : <Icon name="play" size={13} />}
            Produce {selected.length ? `${selected.length} chapter(s)` : "all"}
          </button>
        </div>
        <div className="row" style={{ marginBottom: 14 }}>
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              className={`chip ${selected.includes(chapter.id) ? "on" : ""}`}
              onClick={() => toggle(chapter.id)}
              title={`${chapter.implemented} of ${chapter.total} tables implemented`}
            >
              {chapter.id}. {chapter.short}
            </button>
          ))}
        </div>

        <div className="tables-grid">
          {visible.map((table) => (
            <TableCard key={table.id} table={table} run={run} />
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============================= CATALOGUE ============================= */

export function CatalogueView({ catalogue, onTrace }: { catalogue: Catalogue | null; onTrace: (code: string) => void }) {
  if (!catalogue) return <Card><div className="empty">Loading catalogue…</div></Card>;
  return (
    <div className="stack">
      <Card>
        <div className="card-head">
          <h2>Production catalogue</h2>
          <span className="hint">
            {catalogue.implemented_tables} of {catalogue.total_tables} tables wired to a producer · {catalogue.survey}
          </span>
          <div className="spacer" />
          <Badge tone="accent">population 16+</Badge>
          <Badge tone="blue">youth {catalogue.working_age_min}-{catalogue.youth_max}</Badge>
        </div>
        {catalogue.chapters.map((chapter) => (
          <div key={chapter.id} style={{ marginBottom: 18 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <div className="section-title">
                <h2>{chapter.id}. {chapter.title}</h2>
                <span className="hint">{chapter.implemented}/{chapter.total} implemented</span>
              </div>
              <div className="bar-track" style={{ width: 120 }}>
                <div className="bar-fill" style={{ width: `${(chapter.implemented / Math.max(chapter.total, 1)) * 100}%` }} />
              </div>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              {chapter.tables.map((table) => (
                <div
                  key={table.id}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="row" style={{ gap: 9 }}>
                    <span className="mono" style={{ color: "var(--accent)", minWidth: 32 }}>{table.id}</span>
                    <strong style={{ fontSize: 12.5, fontWeight: 600 }}>{table.title}</strong>
                    <div className="spacer" />
                    {table.implemented ? <Badge tone="accent">implemented</Badge> : <Badge tone="muted">planned</Badge>}
                    {table.indicators?.map((code) => (
                      <button key={code} className="chip" onClick={() => onTrace(code)} style={{ padding: "2px 8px", fontSize: 10.5 }}>
                        {code}
                      </button>
                    ))}
                  </div>
                  <div className="tiny" style={{ marginTop: 5 }}>
                    {table.implemented
                      ? `${table.rows?.length ?? 0} rows · ${table.columns?.join(" · ")}`
                      : table.notes ?? "Producer not implemented yet."}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* =========================== TRACEABILITY =========================== */

export function TraceabilityView({ catalogue, run, code, onSelect }: { catalogue: Catalogue | null; run: Run | null; code: string; onSelect: (code: string) => void }) {
  if (!catalogue) return <Card><div className="empty">Loading metadata…</div></Card>;
  const indicator = catalogue.indicators[code];
  const tables = catalogue.tables.filter((table) => table.implemented && (table.indicators ?? []).includes(code));
  const result = run?.kpis.find((kpi) => kpi.code === code);

  return (
    <div className="trace-layout">
      <Card>
        <div className="card-head">
          <h3>Indicators</h3>
          <div className="spacer" />
          <span className="tiny">{Object.keys(catalogue.indicators).length}</span>
        </div>
        <div className="trace-list">
          {Object.entries(catalogue.indicators).map(([key, meta]) => (
            <button key={key} className={`trace-item ${key === code ? "on" : ""}`} onClick={() => onSelect(key)}>
              <strong>{meta.short}</strong>
              <span>{meta.name}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="card-head">
          <h2>{indicator?.name ?? code}</h2>
          <Badge tone="accent">{indicator?.short ?? code}</Badge>
          <div className="spacer" />
          {result ? (
            <span className="num" style={{ fontSize: 22, fontWeight: 700 }}>
              {result.value?.toFixed(2)}%
            </span>
          ) : (
            <span className="tiny">run the pipeline to attach a result</span>
          )}
        </div>

        <div className="chain">
          <ChainNode label="Table" value={tables.length ? tables.map((t) => `Table ${t.id} — ${t.title}`).join(" · ") : "not referenced by an implemented table"} />
          <ChainNode label="Indicator" value={indicator?.name ?? "—"} />
          <ChainNode label="Definition" value={indicator?.definition ?? "—"} />
          <ChainNode label="Population" value={indicator?.population ?? "—"} />
          <ChainNode label="Variables" value={(indicator?.variables ?? []).join(", ")} mono />
          <ChainNode label="Derived" value={(indicator?.derived ?? []).join(", ")} mono />
          <ChainNode label="Weight" value={indicator?.weight ?? "—"} />
          <ChainNode label="Numerator" value={indicator?.numerator ?? "—"} />
          <ChainNode label="Denominator" value={indicator?.denominator ?? "—"} />
          <ChainNode label="Formula" value={indicator?.formula ?? "—"} mono />
          <ChainNode label="Function" value={indicator?.function ?? "—"} mono />
          <ChainNode
            label="Result"
            value={
              result
                ? `${result.value?.toFixed(2)}% (${result.numerator?.toLocaleString()} / ${result.denominator?.toLocaleString()}) — ${run?.year}`
                : "no run in this session"
            }
          />
        </div>
      </Card>
    </div>
  );
}

function ChainNode({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="chain-node">
      <div className="chain-key">{label}</div>
      <div className={`chain-val ${mono ? "mono" : ""}`}>{value}</div>
    </div>
  );
}

/* ============================ VALIDATION ============================ */

export function ValidationView({ validation, running }: { validation: ValidationResult | null; running: boolean }) {
  if (!validation) return <Card><div className="empty">{running ? "Validating…" : "No validation result."}</div></Card>;
  return (
    <div className="stack">
      <Card>
        <div className="card-head">
          <h2>Data validation</h2>
          <span className="hint">
            {validation.dataset_label} · {validation.year} · {validation.rows.toLocaleString()} records
          </span>
          <div className="spacer" />
          {validation.synthetic ? <Badge tone="warn">calibration sample</Badge> : <Badge tone="blue">field data</Badge>}
        </div>
        <div className="stat-row">
          <div className="mini-stat"><div className="v" style={{ color: "var(--accent)" }}>{validation.summary.pass}</div><div className="l">passed</div></div>
          <div className="mini-stat"><div className="v" style={{ color: "var(--warn)" }}>{validation.summary.warn}</div><div className="l">warnings</div></div>
          <div className="mini-stat"><div className="v" style={{ color: "var(--danger)" }}>{validation.summary.fail}</div><div className="l">blocking</div></div>
          <div className="mini-stat"><div className="v mono" style={{ fontSize: 14, paddingTop: 6 }}>{validation.fingerprint ?? "—"}</div><div className="l">dataset fingerprint</div></div>
        </div>
      </Card>

      <Card>
        <CardHead title="Checks" hint="structural, completeness and consistency" />
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Check</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Affected</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {validation.checks.map((check) => (
                <tr key={check.id}>
                  <td className="cat">
                    {check.label}
                    <span className="basis">{check.detail || check.description}</span>
                  </td>
                  <td><span className="tiny">{check.severity === "blocking" ? "blocking" : "warning"}</span></td>
                  <td><StatusBadge status={check.status} /></td>
                  <td>{check.affected.toLocaleString()}</td>
                  <td>{check.share.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* =============================== RUNS =============================== */

export function RunsView({ runs, onOpen }: { runs: Run[]; onOpen: (run: Run) => void }) {
  return (
    <Card>
      <CardHead title="Production history" hint="every run keeps its dataset, year and fingerprint" />
      {!runs.length ? (
        <div className="empty">No runs recorded in this session.</div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Run</th>
                <th>Dataset</th>
                <th>Year</th>
                <th>Status</th>
                <th>Tables</th>
                <th>Duration</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td className="cat mono">{run.id}</td>
                  <td className="cat">{run.dataset_label ?? run.dataset}</td>
                  <td>{run.year}</td>
                  <td><StatusBadge status={run.status} /></td>
                  <td>{run.table_count ?? 0}</td>
                  <td>{run.duration_ms?.toFixed(0)} ms</td>
                  <td className="tiny">{run.created_at.replace("T", " ").replace("+00:00", "Z")}</td>
                  <td>
                    <button className="btn btn-sm btn-ghost" onClick={() => onOpen(run)}>Open</button>
                    <a className="btn btn-sm btn-ghost" href={api.exportUrl(run.id, "all")}>
                      <Icon name="download" size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
