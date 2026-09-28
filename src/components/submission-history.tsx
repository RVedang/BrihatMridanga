import Link from "next/link";
import { PencilLine } from "lucide-react";
import { number } from "@/components/ui";
import { Select } from "@/components/select";
import { DateField } from "@/components/date-field";
import { dateLabel, monthLabel } from "@/lib/dates";
import type { Campaign, Distribution, RecordItem, Temple } from "@/lib/data";

export type HistoryFilter = {
  start: string;
  end: string;
  campaign: string;
  temple: string;
};

export type HistoryTotalsRow = {
  distributed_on: string;
  book_count: number;
  set_count: number | null;
  points: number | null;
};

export function SubmissionHistory({
  admin,
  reports,
  totalsRows,
  reportCount,
  page,
  pageSize,
  filter,
  temples,
  campaigns,
  centres,
  individuals,
  teams,
}: {
  admin: boolean;
  reports: Distribution[];
  totalsRows: HistoryTotalsRow[];
  reportCount: number;
  page: number;
  pageSize: number;
  filter: HistoryFilter;
  temples: Temple[];
  campaigns: Campaign[];
  centres: RecordItem[];
  individuals: RecordItem[];
  teams: RecordItem[];
}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const filtered = Boolean(
    filter.start || filter.end || filter.campaign || filter.temple,
  );
  const href = (p: number) => {
    const params = new URLSearchParams({ tab: "history" });
    for (const [k, v] of Object.entries(filter)) if (v) params.set(k, v);
    if (p > 1) params.set("page", String(p));
    return `/portal?${params}`;
  };

  const totals = totalsRows.reduce(
    (acc, r) => {
      acc.books += Number(r.book_count || 0);
      acc.sets += Number(r.set_count || 0);
      if (r.points === null) acc.incomplete += 1;
      else acc.points += Number(r.points);
      return acc;
    },
    { books: 0, sets: 0, points: 0, incomplete: 0 },
  );
  const months = [
    ...totalsRows
      .reduce((map, r) => {
        const key = r.distributed_on.slice(0, 7);
        const m = map.get(key) || { books: 0, sets: 0, points: 0, reports: 0 };
        m.books += Number(r.book_count || 0);
        m.sets += Number(r.set_count || 0);
        m.points += Number(r.points || 0);
        m.reports += 1;
        return map.set(key, m);
      }, new Map<string, { books: number; sets: number; points: number; reports: number }>())
      .entries(),
  ].sort((a, b) => b[0].localeCompare(a[0]));

  const campaignName = (id: string) =>
    campaigns.find((c) => c.id === id)?.name || "—";
  const reportedFor = (r: Distribution) =>
    (r.individual_id && individuals.find((i) => i.id === r.individual_id)?.name) ||
    (r.team_id && teams.find((t) => t.id === r.team_id)?.name) ||
    (r.centre_id && centres.find((c) => c.id === r.centre_id)?.name) ||
    "Temple";
  const campaignOptions = campaigns.filter(
    (c) => !filter.temple || !c.temple_id || c.temple_id === filter.temple,
  );
  const columns = admin ? 9 : 8;

  return (
    <div className="history-board">
      <form method="get" className="filter-bar history-filters" aria-label="History filters">
        <input type="hidden" name="tab" value="history" />
        {admin && (
          <label>
            Temple
            <Select name="temple" searchable placeholder="All temples" defaultValue={filter.temple}>
              {temples.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </label>
        )}
        <label>
          Campaign
          <Select name="campaign" searchable placeholder="All campaigns" defaultValue={filter.campaign}>
            {campaignOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        <div className="history-dates">
          <span className="date-range-caption">
            Dates
            <span>Leave empty for all time</span>
          </span>
          <div className="date-range-fields">
            <DateField key={`s-${filter.start}`} name="start" defaultValue={filter.start} aria-label="From date" />
            <span className="date-range-sep" aria-hidden="true">
              –
            </span>
            <DateField key={`e-${filter.end}`} name="end" defaultValue={filter.end} aria-label="To date" />
          </div>
        </div>
        <div className="history-filter-actions">
          <button className="button" type="submit">
            Apply
          </button>
          {filtered && (
            <Link className="text-link" href="/portal?tab=history">
              Clear filters
            </Link>
          )}
        </div>
      </form>

      <section className="history-summary" aria-label="Totals for these submissions">
        <p className="eyebrow">
          {filter.start || filter.end
            ? `${filter.start ? dateLabel(filter.start) : "Beginning"} – ${filter.end ? dateLabel(filter.end) : "today"}`
            : "All time"}
        </p>
        <div className="stats">
          <div>
            <span>Reports</span>
            <strong>{number(totalsRows.length)}</strong>
            <small>
              {totals.incomplete
                ? `${number(totals.incomplete)} total-only, awaiting details`
                : "All with book details"}
            </small>
          </div>
          <div>
            <span>Books distributed</span>
            <strong>{number(totals.books)}</strong>
            <small>Each volume in a set is one book</small>
          </div>
          <div>
            <span>Sets distributed</span>
            <strong>{number(totals.sets)}</strong>
            <small>Complete multi-volume sets only</small>
          </div>
          <div>
            <span>Recorded points</span>
            <strong>{number(totals.points)}</strong>
            <small>From detailed reports</small>
          </div>
        </div>
      </section>

      {months.length > 1 && (
        <details className="history-months">
          <summary>Month by month ({months.length} months)</summary>
          <div className="table-wrap history-table">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="num">Books</th>
                  <th className="num">Sets</th>
                  <th className="num">Points</th>
                  <th className="num">Reports</th>
                </tr>
              </thead>
              <tbody>
                {months.map(([key, m]) => (
                  <tr key={key}>
                    <td>{monthLabel(key)}</td>
                    <td className="num">{number(m.books)}</td>
                    <td className="num">{number(m.sets)}</td>
                    <td className="num">{number(m.points)}</td>
                    <td className="num">{number(m.reports)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <div className="table-wrap history-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              {admin && <th>Temple</th>}
              <th>Campaign</th>
              <th>For</th>
              <th>Books</th>
              <th>Sets</th>
              <th>Points</th>
              <th>Version</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.length ? (
              reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.distributed_on}</td>
                  {admin && <td>{temples.find((t) => t.id === r.temple_id)?.name}</td>}
                  <td>{campaignName(r.campaign_id)}</td>
                  <td>{reportedFor(r)}</td>
                  <td>{number(r.book_count)}</td>
                  <td>{r.mode === "total" ? "Incomplete" : number(r.set_count ?? 0)}</td>
                  <td>{r.points === null ? "Incomplete" : number(r.points)}</td>
                  <td>{r.version}</td>
                  <td>
                    <Link className="button secondary small history-update" href={`/portal?edit=${r.id}`}>
                      <PencilLine size={14} strokeWidth={1.8} />
                      Update
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns}>
                  {reportCount
                    ? "No submissions on this page."
                    : filtered
                      ? "No submissions match these filters."
                      : "No submissions yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {reportCount > pageSize && (
        <nav className="history-pager" aria-label="Submission pages">
          {page > 1 ? (
            <Link className="button secondary small history-prev" href={href(page - 1)}>
              Previous {pageSize}
            </Link>
          ) : null}
          <p className="muted">
            {number(from + 1)}–{number(Math.min(to + 1, reportCount))} of {number(reportCount)}
          </p>
          {to + 1 < reportCount ? (
            <Link className="button secondary small history-next" href={href(page + 1)}>
              Next {pageSize}
            </Link>
          ) : null}
        </nav>
      )}
      <p className="muted history-hint">
        To add details to a total-only report, use Update on that entry.
      </p>
    </div>
  );
}
