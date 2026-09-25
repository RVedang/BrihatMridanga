"use client";
import { useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, FileText, Table } from "lucide-react";
import type { Campaign, Dashboard, DailyScore, RecordItem, Score, Temple } from "@/lib/data";
import { dateLabel, monthLabel } from "@/lib/dates";
import { Empty, number, ScoreTable, Stats } from "@/components/ui";
import { CampaignSelect } from "@/components/campaign-select";
import { Select } from "@/components/select";
import { DateRangeFields } from "@/components/date-field";

export function ReportFilters({
  start,
  end,
  campaign,
  country,
  temple,
  centre,
  campaigns,
  temples,
  centres,
  countries,
}: {
  start: string;
  end: string;
  campaign?: string;
  country?: string;
  temple?: string;
  centre?: string;
  campaigns: Campaign[];
  temples: Temple[];
  centres: RecordItem[];
  countries: string[];
}) {
  const [countryName, setCountryName] = useState(country || "");
  const [templeId, setTempleId] = useState(temple || "");
  const [centreId, setCentreId] = useState(centre || "");
  const templesShown = countryName
    ? temples.filter((t) => t.country === countryName)
    : temples;
  const centresShown = centres.filter((c) => {
    if (templeId) return c.temple_id === templeId;
    if (!countryName) return true;
    return temples.some((t) => t.id === c.temple_id && t.country === countryName);
  });
  return (
    <form
      method="get"
      className="filter-bar report-filters no-print"
      aria-label="Report filters"
    >
      <label>
        Country
        <Select
          name="country"
          searchable
          placeholder="All countries"
          value={countryName}
          onChange={(e) => {
            const next = e.target.value;
            setCountryName(next);
            const current = temples.find((t) => t.id === templeId);
            if (next && current && current.country !== next) {
              setTempleId("");
              setCentreId("");
            }
          }}
        >
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </label>
      <label>
        Temple
        <Select
          key={`temple-${countryName || "all"}`}
          name="temple"
          searchable
          placeholder="All temples"
          value={
            templesShown.some((t) => t.id === templeId) ? templeId : ""
          }
          onChange={(e) => {
            setTempleId(e.target.value);
            setCentreId("");
          }}
        >
          {templesShown.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {countryName ? "" : ` · ${t.country}`}
            </option>
          ))}
        </Select>
      </label>
      <label>
        Center
        <Select
          key={`centre-${countryName || "all"}-${templeId || "all"}`}
          name="centre"
          searchable
          placeholder="All Centers"
          value={
            centresShown.some((c) => c.id === centreId) ? centreId : ""
          }
          onChange={(e) => setCentreId(e.target.value)}
        >
          {centresShown.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </label>
      <label>
        Campaign
        <CampaignSelect
          campaigns={campaigns}
          temples={temples}
          country={countryName || undefined}
          temple={
            templesShown.some((t) => t.id === templeId) ? templeId : undefined
          }
          value={campaign}
        />
      </label>
      <div className="filter-dates">
        <DateRangeFields start={start} end={end} />
        <button className="button" type="submit">
          Apply
        </button>
      </div>
    </form>
  );
}

export function ReportsView({
  start,
  end,
  dash,
  days,
  rows,
  connected,
  exportCsv,
  exportXls,
  exportPdf,
  scope,
  temples = [],
  catalogCampaigns = [],
}: {
  start: string;
  end: string;
  dash: Dashboard | null;
  days: DailyScore[];
  rows: Score[];
  connected: boolean;
  exportCsv: string;
  exportXls: string;
  exportPdf: string;
  scope: string;
  temples?: Temple[];
  catalogCampaigns?: Campaign[];
}) {
  const [campaignKind, setCampaignKind] = useState<"movement" | "regional">(
    "movement",
  );
  const totals = dash?.totals;
  const previous = dash?.previous;
  const months = dash?.by_month || [];
  const years = dash?.by_year || [];
  const campaigns = dash?.by_campaign || [];
  const movementCampaigns = fillCampaignRows(catalogCampaigns, campaigns, false);
  const regionalCampaigns = fillCampaignRows(catalogCampaigns, campaigns, true);
  const countries = dash?.by_country || [];
  return (
    <>
      <div className="reports-toolbar no-print">
        <p className="period-chip">{scope}</p>
        <div className="export-bar">
          <a className="button secondary" href={exportCsv}>
            <FileSpreadsheet size={16} strokeWidth={1.7} /> CSV
          </a>
          <a className="button secondary" href={exportXls}>
            <Table size={16} strokeWidth={1.7} /> Spreadsheet
          </a>
          <a className="button secondary" href={exportPdf} download>
            <FileText size={16} strokeWidth={1.7} /> PDF
          </a>
        </div>
      </div>
      <section className="report-panel" id="global">
        <div className="report-panel-head">
          <p className="eyebrow">Overview</p>
          <h2>Global summary</h2>
        </div>
        <Stats rows={rows} connected={connected} />
      </section>
      <section className="report-panel" id="yoy">
        <div className="report-panel-head">
          <p className="eyebrow">Comparison</p>
          <h2>Year-over-year</h2>
        </div>
        {previous ? (
          <>
            <div className="stats">
              <div>
                <span>Books this period</span>
                <strong>{number(Number(totals?.books || 0))}</strong>
                <small>
                  vs {number(Number(previous.books))} in{" "}
                  {dateLabel(previous.start)} – {dateLabel(previous.end)}
                  {yoy(Number(totals?.books || 0), Number(previous.books))}
                </small>
              </div>
              <div>
                <span>Sets this period</span>
                <strong>{number(Number(totals?.sets || 0))}</strong>
                <small>
                  vs {number(Number(previous.sets))} previous period
                  {yoy(Number(totals?.sets || 0), Number(previous.sets))}
                </small>
              </div>
              <div>
                <span>Reports this period</span>
                <strong>{number(Number(totals?.reports || 0))}</strong>
                <small>
                  {dateLabel(start)} – {dateLabel(end)}
                </small>
              </div>
            </div>
            <ReportTable
              columns={[
                "Year",
                "Books",
                "Sets",
                "Recorded points",
                "Reports",
              ]}
              rows={years.map((r) => [
                String(r.year),
                number(Number(r.books)),
                number(Number(r.sets)),
                number(Number(r.points)),
                number(Number(r.reports)),
              ])}
              empty="No yearly figures yet."
            />
          </>
        ) : (
          <p className="chart-empty">
            Year-over-year comparison is available once dashboard reporting is
            connected.
          </p>
        )}
      </section>
      <section className="report-panel" id="regional">
        <div className="report-panel-head">
          <p className="eyebrow">By country</p>
          <h2>Regional summaries</h2>
        </div>
        <ReportTable
          columns={[
            "Country",
            "Temples",
            "Books",
            "Sets",
            "Recorded points",
            "Reports",
          ]}
          rows={countries.map((r) => [
            r.country,
            number(Number(r.temples)),
            number(Number(r.books)),
            number(Number(r.sets)),
            number(Number(r.points)),
            number(Number(r.reports)),
          ])}
          empty="No country figures for this filter."
        />
      </section>
      <section className="report-panel" id="temples">
        <div className="report-panel-head">
          <p className="eyebrow">By temple</p>
          <h2>Temple performance</h2>
        </div>
        <ScoreTable rows={rows} />
      </section>
      <section className="report-panel" id="daily">
        <div className="report-panel-head">
          <p className="eyebrow">Day by day</p>
          <h2>Daily reports</h2>
        </div>
        <ReportTable
          columns={["Date", "Books", "Sets", "Recorded points", "Reports"]}
          rows={days.map((r) => [
            dateLabel(String(r.day).slice(0, 10)),
            number(Number(r.books)),
            number(Number(r.sets)),
            number(Number(r.points)),
            number(Number(r.reports)),
          ])}
          empty="No daily reports in this range."
        />
      </section>
      <section className="report-panel" id="monthly">
        <div className="report-panel-head">
          <p className="eyebrow">Month by month</p>
          <h2>Monthly reports</h2>
        </div>
        <ReportTable
          columns={["Month", "Books", "Sets", "Recorded points", "Reports"]}
          rows={months.map((r) => [
            monthLabel(r.month),
            number(Number(r.books)),
            number(Number(r.sets)),
            number(Number(r.points)),
            number(Number(r.reports)),
          ])}
          empty="No monthly reports in this range."
        />
      </section>
      <section className="report-panel" id="campaigns">
        <div className="report-panel-head report-panel-head-split">
          <div>
            <p className="eyebrow">By campaign</p>
            <h2>Campaign reports</h2>
          </div>
          <div className="campaign-kind-toggle" role="group" aria-label="Campaign type">
            <button
              type="button"
              aria-pressed={campaignKind === "movement"}
              onClick={() => setCampaignKind("movement")}
            >
              Movement-wide
            </button>
            <button
              type="button"
              aria-pressed={campaignKind === "regional"}
              onClick={() => setCampaignKind("regional")}
            >
              Regional
            </button>
          </div>
        </div>
        {campaignKind === "movement" ? (
          <CampaignReportTable
            rows={movementCampaigns}
            empty="No movement-wide campaigns to list."
          />
        ) : (
          <CampaignReportTable
            rows={regionalCampaigns}
            showTemple
            temples={temples}
            empty="No regional campaigns to list."
          />
        )}
      </section>
    </>
  );
}

function fillCampaignRows(
  catalog: Campaign[],
  reported: NonNullable<Dashboard["by_campaign"]>,
  regional: boolean,
) {
  const stats = new Map(reported.map((row) => [row.campaign_id, row]));
  const listed = catalog.filter((campaign) =>
    regional ? Boolean(campaign.temple_id) : !campaign.temple_id,
  );
  const rows = listed.map((campaign) => {
    const hit = stats.get(campaign.id);
    return (
      hit || {
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        fallback_year: campaign.fallback_year,
        temple_id: campaign.temple_id,
        books: 0,
        sets: 0,
        points: 0,
        reports: 0,
        temples: 0,
      }
    );
  });
  for (const row of reported) {
    if (regional ? row.temple_id : !row.temple_id) {
      if (!rows.some((item) => item.campaign_id === row.campaign_id))
        rows.push(row);
    }
  }
  return rows.sort(
    (a, b) =>
      Number(b.books) - Number(a.books) ||
      a.campaign_name.localeCompare(b.campaign_name),
  );
}

function CampaignReportTable({
  rows,
  temples = [],
  showTemple = false,
  empty,
}: {
  rows: NonNullable<Dashboard["by_campaign"]>;
  temples?: Temple[];
  showTemple?: boolean;
  empty: string;
}) {
  return (
    <div className="campaign-report-group">
      {rows.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                {showTemple ? <th>Temple</th> : null}
                {showTemple ? null : <th className="num">Temples</th>}
                <th className="num">Books</th>
                <th className="num">Sets</th>
                <th className="num">Recorded points</th>
                <th className="num">Reports</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.campaign_id}>
                  <td className="primary-cell">
                    <Link
                      href={
                        r.fallback_year
                          ? `/campaigns/annual-${r.fallback_year}`
                          : `/campaigns/${r.campaign_id}`
                      }
                    >
                      {r.campaign_name}
                    </Link>
                  </td>
                  {showTemple ? (
                    <td>
                      {temples.find((t) => t.id === r.temple_id)?.name || "—"}
                    </td>
                  ) : null}
                  {showTemple ? null : (
                    <td className="num">{number(Number(r.temples))}</td>
                  )}
                  <td className="num">{number(Number(r.books))}</td>
                  <td className="num">{number(Number(r.sets))}</td>
                  <td className="num">{number(Number(r.points))}</td>
                  <td className="num">{number(Number(r.reports))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="chart-empty">{empty}</p>
      )}
    </div>
  );
}

function yoy(current: number, prior: number) {
  if (!prior) return null;
  const pct = ((current - prior) / prior) * 100;
  const sign = pct > 0 ? "+" : "";
  return (
    <span className={pct < 0 ? "delta down" : "delta up"}>
      {sign}
      {pct.toFixed(1)}%
    </span>
  );
}

function ReportTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: string[][];
  empty: string;
}) {
  if (!rows.length) return <p className="chart-empty">{empty}</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={c} className={i ? "num" : undefined}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={j ? "num" : "primary-cell"}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
