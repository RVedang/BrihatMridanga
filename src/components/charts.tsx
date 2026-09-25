import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import { number } from "./ui";
import { DownloadChart, type ChartPoint } from "./chart-download";

export type BarRow = {
  key: string;
  label: string;
  sub?: string;
  value: number;
  detail?: string;
  href?: string;
};

/** Horizontal bar list. Pure HTML so it stays readable on a phone. */
export function Bars({
  rows,
  unit = "books",
  ranked = false,
  limit = 10,
}: {
  rows: BarRow[];
  unit?: string;
  ranked?: boolean;
  limit?: number;
}) {
  if (!rows.length)
    return <p className="chart-empty">No reports match these filters.</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const item = (r: BarRow, i: number) => (
    <li key={r.key} className={ranked && i < 3 ? `bar top-${i + 1}` : "bar"}>
      {ranked && <span className="bar-rank">{i + 1}</span>}
      <div className="bar-main">
        <div className="bar-head">
          <span className="bar-label">
            {r.href ? <Link href={r.href}>{r.label}</Link> : r.label}
            {r.sub && <small>{r.sub}</small>}
          </span>
          <span className="bar-value">
            {number(r.value)}
            <small>
              {" "}
              {unit}
              {r.detail ? ` · ${r.detail}` : ""}
            </small>
          </span>
        </div>
        <div className="bar-track">
          <span
            className="bar-fill"
            style={{ width: `${Math.max(1.5, (r.value / max) * 100)}%` }}
          />
        </div>
      </div>
    </li>
  );
  const head = rows.slice(0, limit),
    rest = rows.slice(limit);
  return (
    <>
      <ol className="bars">{head.map(item)}</ol>
      {rest.length > 0 && (
        <details className="bars-more">
          <summary>Show all {rows.length}</summary>
          <ol className="bars" start={limit + 1}>
            {rest.map((r, i) => item(r, i + limit))}
          </ol>
        </details>
      )}
    </>
  );
}

/** Vertical columns for time series (months or years). */
export function Columns({
  points,
  unit = "books",
  showValues = false,
}: {
  points: ChartPoint[];
  unit?: string;
  showValues?: boolean;
}) {
  if (!points.some((p) => p.value > 0))
    return <p className="chart-empty">No reports in this period.</p>;
  const max = Math.max(...points.map((p) => p.value), 1);
  return (
    <div
      className={`columns ${points.length > 14 ? "columns-dense" : ""}`}
      role="img"
      aria-label={points
        .map((p) => `${p.label}: ${number(p.value)} ${unit}`)
        .join(", ")}
    >
      {points.map((p) => (
        <div
          key={p.label}
          className="col"
          title={`${p.label}: ${number(p.value)} ${unit}`}
        >
          {showValues && (
            <span className="col-value">{p.value ? number(p.value) : ""}</span>
          )}
          <div className="col-track">
            <span
              className="col-bar"
              style={{ height: `${(p.value / max) * 100}%` }}
            />
          </div>
          <span className="col-label">{p.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Progress({
  value,
  target,
  label,
  sub,
}: {
  value: number;
  target: number;
  label: string;
  sub?: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="progress">
      <div className="bar-head">
        <span className="bar-label">
          {label}
          {sub && <small>{sub}</small>}
        </span>
        <span className="bar-value">
          {number(value)}
          <small> of {number(target)} · {Math.round(pct)}%</small>
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      {value >= target && (
        <p className="progress-note">Target reached. Hare Krishna!</p>
      )}
    </div>
  );
}

/** Card wrapper with title, optional note and download actions. */
export function ChartCard({
  id,
  title,
  note,
  csv,
  chart,
  children,
}: {
  id?: string;
  title: string;
  note?: string;
  csv?: string;
  chart?: { points: ChartPoint[]; unit?: string; filename: string };
  children: React.ReactNode;
}) {
  return (
    <section className="chart-card" id={id}>
      <div className="chart-head">
        <div>
          <h3>{title}</h3>
          {note && <p className="chart-note">{note}</p>}
        </div>
        <div className="chart-actions">
          {csv && (
            <a
              className="icon-btn"
              href={csv}
              download
              title="Download spreadsheet"
              aria-label={`Download ${title} as spreadsheet`}
            >
              <FileSpreadsheet size={18} strokeWidth={1.7} />
            </a>
          )}
          {chart && chart.points.length > 0 && (
            <DownloadChart
              title={title}
              points={chart.points}
              unit={chart.unit || "books"}
              filename={chart.filename}
            />
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
