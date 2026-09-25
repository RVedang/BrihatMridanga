import { AnimatedNumber } from "@/components/presentation-motion";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Landmark, Award } from "lucide-react";
import type { Score } from "@/lib/data";
import { dateLabel } from "@/lib/dates";
export const number = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
export function PageIntro({
  eyebrow,
  title,
  meta,
  children,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {meta ? <p className="page-intro-meta">{meta}</p> : null}
      {children ? <div className="lede">{children}</div> : null}
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty">
      <BookOpen size={28} strokeWidth={1} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function HomeStats({
  globalBooks,
  templeCount,
  countryCount,
  leadingTemple,
  connected = true,
}: {
  globalBooks: number;
  templeCount: number;
  countryCount: number;
  leadingTemple: { name: string; books: number } | null;
  connected?: boolean;
}) {
  return (
    <div className="home-stats">
      <div className="stat-card">
        <BookOpen className="stat-icon" size={22} aria-hidden="true" />
        <span className="stat-label">Global Books Distributed</span>
        <strong className="stat-value">
          {connected ? <AnimatedNumber value={globalBooks} /> : "—"}
        </strong>
        <small className="stat-sub">Across all temples worldwide</small>
      </div>
      <div className="stat-card">
        <Landmark className="stat-icon" size={22} aria-hidden="true" />
        <span className="stat-label">Participating Temples</span>
        <strong className="stat-value">
          {connected ? <AnimatedNumber value={templeCount} /> : "—"}
        </strong>
        <small className="stat-sub">
          {connected
            ? `Across ${countryCount} ${countryCount === 1 ? "country" : "countries"}`
            : "—"}
        </small>
      </div>
      <div
        className={`stat-card leading-temple-card${connected && !leadingTemple ? " awaiting-reports" : ""}`}
      >
        <Award className="stat-icon" size={22} aria-hidden="true" />
        <span className="stat-label">This Month&apos;s Leading Temple</span>
        <strong
          className="stat-value stat-temple-name"
          title={leadingTemple?.name}
        >
          {connected
            ? leadingTemple
              ? leadingTemple.name
              : "Awaiting reports"
            : "—"}
        </strong>
        <small className="stat-sub">
          {leadingTemple
            ? `${number(leadingTemple.books)} books this month`
            : "Based on this month's reports"}
        </small>
      </div>
    </div>
  );
}

export function Stats({
  rows,
  connected = true,
}: {
  rows: Score[];
  connected?: boolean;
}) {
  const count = rows.reduce((a, r) => a + Number(r.books), 0),
    sets = rows.reduce((a, r) => a + Number(r.sets || 0), 0),
    incomplete = rows.reduce((a, r) => a + Number(r.incomplete_reports), 0);
  return (
    <>
      <div className="stats">
        <div>
          <span>Books distributed</span>
          <strong>{connected ? <AnimatedNumber value={count} /> : "—"}</strong>
          <small>Each volume in a set is one book</small>
        </div>
        <div>
          <span>Sets distributed</span>
          <strong>{connected ? <AnimatedNumber value={sets} /> : "—"}</strong>
          <small>Complete multi-volume sets only</small>
        </div>
        <div>
          <span>Reporting temples</span>
          <strong>
            {connected ? <AnimatedNumber value={rows.length} /> : "—"}
          </strong>
          <small>
            Serving across {new Set(rows.map((r) => r.country)).size} countries
          </small>
        </div>
        <div>
          <span>Countries</span>
          <strong>
            {connected ? number(new Set(rows.map((r) => r.country)).size) : "—"}
          </strong>
          <small>
            {incomplete
              ? `${number(incomplete)} total-only reports await details`
              : "From published temple reports"}
          </small>
        </div>
      </div>
      {incomplete > 0 && (
        <p className="notice">
          Book totals include total-only submissions. Recorded points remain in
          the detailed tables and stay incomplete until book details are added.
        </p>
      )}
    </>
  );
}

function setWord(n: number) {
  return n === 0 || n === 1 ? "set" : "sets";
}

export function TempleTotals({
  connected = true,
  start,
  end,
  current,
  allTime,
}: {
  connected?: boolean;
  start: string;
  end: string;
  current: { books: number; sets: number };
  allTime: {
    books: number;
    sets: number;
    reports?: number;
    firstDate?: string | null;
  };
}) {
  return (
    <div className="kpis temple-totals">
      <div className="stat-card kpi">
        <span className="stat-label">Books this period</span>
        <strong className="stat-value">
          {connected ? <AnimatedNumber value={current.books} /> : "—"}
        </strong>
        <small className="stat-sub">
          {dateLabel(start)} – {dateLabel(end)}
        </small>
      </div>
      <div className="stat-card kpi">
        <span className="stat-label">Sets this period</span>
        <strong className="stat-value">
          {connected ? <AnimatedNumber value={current.sets} /> : "—"}
        </strong>
        <small className="stat-sub">
          {number(current.sets)} complete {setWord(current.sets)}
        </small>
      </div>
      <div className="stat-card kpi">
        <span className="stat-label">All-time books</span>
        <strong className="stat-value">
          {connected ? <AnimatedNumber value={allTime.books} /> : "—"}
        </strong>
        <small className="stat-sub">
          {allTime.firstDate
            ? `Since ${dateLabel(allTime.firstDate)}${
                allTime.reports != null
                  ? ` · ${number(allTime.reports)} reports`
                  : ""
              }`
            : "No reports yet"}
        </small>
      </div>
      <div className="stat-card kpi">
        <span className="stat-label">All-time sets</span>
        <strong className="stat-value">
          {connected ? <AnimatedNumber value={allTime.sets} /> : "—"}
        </strong>
        <small className="stat-sub">
          {number(allTime.sets)} complete {setWord(allTime.sets)} in all years
        </small>
      </div>
    </div>
  );
}
export function ScoreTable({ rows }: { rows: Score[] }) {
  return rows.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Temple</th>
            <th>Country</th>
            <th className="num">Books</th>
            <th className="num">Sets</th>
            <th className="num">Recorded points</th>
            <th>Scoring status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.temple_id}>
              <td className="primary-cell">
                <Link href={`/temples/${r.temple_id}`}>{r.temple_name}</Link>
              </td>
              <td>{r.country}</td>
              <td className="num">{number(r.books)}</td>
              <td className="num">{number(r.sets || 0)}</td>
              <td className="num">{number(r.known_points)}</td>
              <td>
                {Number(r.incomplete_reports) > 0 ? (
                  <span className="status-pill is-warn">Incomplete</span>
                ) : (
                  <span className="status-pill is-ok">Complete</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty title="Every contribution begins somewhere">
      No distributions have been reported for this period yet.
    </Empty>
  );
}
export function SectionTitle({
  title,
  href,
  link,
}: {
  title: string;
  href?: string;
  link?: string;
}) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {href && (
        <Link href={href}>
          {link || "Explore"} <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}
