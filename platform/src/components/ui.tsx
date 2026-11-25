import type { ReactNode } from "react";
import type { Kpi, Step, Table } from "../api";

/* ------------------------------- icons ------------------------------- */

const paths: Record<string, string> = {
  cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z",
  route: "M6 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M18 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M9 16h4a3 3 0 0 0 3-3V9",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z M9 12l2 2 4-4",
  history: "M3 3v5h5 M3.05 13A9 9 0 1 0 6 5.3L3 8 M12 7v5l3 2",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
  play: "M5 3l14 9-14 9V3Z",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  check: "M20 6 9 17l-5-5",
  alert: "M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  x: "M18 6 6 18 M6 6l12 12",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  db: "M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3Z M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  layers: "M12 2 2 7l10 5 10-5-10-5Z M2 17l10 5 10-5 M2 12l10 5 10-5",
};

export function Icon({ name, size = 16 }: { name: keyof typeof paths | string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name] ?? paths.cog} />
    </svg>
  );
}

/* ----------------------------- primitives ----------------------------- */

export function Badge({ tone = "muted", children }: { tone?: "accent" | "ok" | "blue" | "warn" | "danger" | "muted"; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function CardHead({ title, hint, right }: { title: string; hint?: string; right?: ReactNode }) {
  return (
    <div className="card-head">
      <h3>{title}</h3>
      {hint ? <span className="hint">{hint}</span> : null}
      <div className="spacer" />
      {right}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  if (status === "pass" || status === "done" || status === "complete") return <Badge tone="ok">passed</Badge>;
  if (status === "warn") return <Badge tone="warn">warning</Badge>;
  if (status === "fail" || status === "failed") return <Badge tone="danger">blocked</Badge>;
  if (status === "blocked") return <Badge tone="warn">blocked</Badge>;
  return <Badge tone="muted">{status}</Badge>;
}

/* -------------------------------- KPI -------------------------------- */

export function KpiCard({ kpi, onSelect }: { kpi: Kpi; onSelect?: (code: string) => void }) {
  const delta = kpi.delta;
  const direction = delta === null ? "" : delta > 0 ? "up" : "down";
  return (
    <button className="kpi" onClick={() => onSelect?.(kpi.code)} title={`${kpi.definition}\n\n${kpi.formula}`}>
      <div className="kpi-top">
        <span className="kpi-label">{kpi.name}</span>
        <Badge tone="blue">{kpi.short}</Badge>
      </div>
      <div className="kpi-value num">
        {kpi.value === null ? "—" : kpi.value.toFixed(1)}
        <span>%</span>
      </div>
      <div className="kpi-foot">
        {delta === null ? (
          <span>no prior year</span>
        ) : (
          <>
            <span className={`delta ${direction}`}>
              {delta > 0 ? "▲" : delta < 0 ? "▼" : "■"} {Math.abs(delta).toFixed(2)} pp
            </span>
            <span>vs {kpi.previous?.toFixed(1)}%</span>
          </>
        )}
      </div>
    </button>
  );
}

/* ------------------------------ stepper ------------------------------ */

export function Stepper({ steps }: { steps: Step[] }) {
  return (
    <div className="steps">
      {steps.map((step, index) => (
        <div
          key={step.key}
          className={`step ${step.status}`}
          style={{ animationDelay: `${index * 45}ms` }}
          title={step.detail}
        >
          <div className="step-top">
            <span className="step-index">{index + 1}</span>
            <span className="step-label">{step.label}</span>
          </div>
          <div className="step-detail">{step.detail}</div>
          <div className="step-ms">{step.ms} ms</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ table -------------------------------- */

export function DataTable({ table, limit = 12 }: { table: Table; limit?: number }) {
  const rows = limit > 0 ? table.rows.slice(0, limit) : table.rows;
  if (!table.columns?.length) {
    return <div className="empty">Producer not implemented for this table yet.</div>;
  }
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Category</th>
            {table.columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="cat">{row.label}</td>
              {row.cells.map((cell, index) => (
                <td
                  key={index}
                  className="cell-hover"
                  title={
                    cell.numerator !== null
                      ? `numerator ${cell.numerator?.toLocaleString()} / denominator ${cell.denominator?.toLocaleString()}`
                      : undefined
                  }
                >
                  {cell.display}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------ charts ------------------------------- */

const SERIES = [
  { key: "LFPR", color: "#0b5fa5", label: "LFPR" },
  { key: "UR1", color: "#c9780a", label: "Unemployment (LU1)" },
  { key: "LUUR", color: "#0f8f83", label: "Underutilisation" },
] as const;

export function TrendChart({ data }: { data: { year: number; LFPR: number | null; UR1: number | null; LUUR: number | null }[] }) {
  if (!data.length) return <div className="empty">No trend data.</div>;
  const width = 620;
  const height = 210;
  const pad = { top: 14, right: 12, bottom: 26, left: 32 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const values = data.flatMap((d) => [d.LFPR, d.UR1, d.LUUR]).filter((v): v is number => v !== null);
  // Percent axis: start at zero, round the ceiling to a clean 20-point step.
  const max = Math.max(20, Math.ceil(Math.max(...values, 10) / 20) * 20);
  const min = 0;
  const x = (index: number) => pad.left + (data.length === 1 ? innerW / 2 : (index / (data.length - 1)) * innerW);
  const y = (value: number) => pad.top + innerH - ((value - min) / Math.max(max - min, 1)) * innerH;
  const ticks = 4;

  return (
    <>
      <div className="chart-legend" style={{ marginBottom: 8 }}>
        {SERIES.map((series) => (
          <span key={series.key}>
            <span className="legend-dot" style={{ background: series.color }} />
            {series.label}
          </span>
        ))}
      </div>
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Labour market indicators by year">
        {Array.from({ length: ticks + 1 }, (_, index) => {
          const value = min + ((max - min) / ticks) * index;
          return (
            <g key={index}>
              <line className="grid-line" x1={pad.left} x2={width - pad.right} y1={y(value)} y2={y(value)} />
              <text x={pad.left - 6} y={y(value) + 3} textAnchor="end">
                {Math.round(value)}
              </text>
            </g>
          );
        })}
        <line className="axis-line" x1={pad.left} x2={width - pad.right} y1={height - pad.bottom} y2={height - pad.bottom} />
        {data.map((point, index) => (
          <text key={point.year} x={x(index)} y={height - 8} textAnchor="middle">
            {point.year}
          </text>
        ))}
        {SERIES.map((series) => {
          const points = data
            .map((point, index) => {
              const value = point[series.key];
              return value === null ? null : `${x(index)},${y(value)}`;
            })
            .filter(Boolean)
            .join(" ");
          return (
            <g key={series.key}>
              <polyline points={points} fill="none" stroke={series.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {data.map((point, index) => {
                const value = point[series.key];
                if (value === null) return null;
                return (
                  <circle key={`${series.key}-${point.year}`} cx={x(index)} cy={y(value)} r="2.8" fill="var(--panel)" stroke={series.color} strokeWidth="1.8">
                    <title>{`${series.label} ${point.year}: ${value.toFixed(1)}%`}</title>
                  </circle>
                );
              })}
            </g>
          );
        })}
      </svg>
    </>
  );
}

export function BarList({ data, metric = "LFPR" }: { data: { group: string; LFPR: number | null; UR1: number | null }[]; metric?: "LFPR" | "UR1" }) {
  const max = Math.max(...data.map((row) => row[metric] ?? 0), 1);
  return (
    <div className="bars">
      {data.map((row) => (
        <div className="bar-row" key={row.group}>
          <span className="muted">{row.group}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${((row[metric] ?? 0) / max) * 100}%` }} />
          </span>
          <span className="val">{(row[metric] ?? 0).toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

export function Spinner() {
  return <span className="spinner" />;
}
