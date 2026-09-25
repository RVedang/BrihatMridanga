import { AnimatedNumber } from "@/components/presentation-motion";
import Link from "next/link";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { publicData, dashboard, type DashboardFilters } from "@/lib/data";
import {
  annualRange,
  dateLabel,
  monthLabel,
  monthsBetween,
  validateRange,
} from "@/lib/dates";
import { PageIntro, Empty, number } from "@/components/ui";
import { Bars, Columns, Progress, ChartCard } from "@/components/charts";
import { DashboardFilterForm } from "@/components/dashboard-filters";
import { categoryLabel } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Global dashboard" };

const uuid = /^[0-9a-f-]{36}$/i;
const categories = ["small", "medium", "big", "m-big"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams,
    data = await publicData(),
    defaults = annualRange();
  const problems: string[] = [];
  let start = query.start || defaults.start,
    end = query.end || defaults.end;
  try {
    validateRange(start, end);
  } catch (e) {
    problems.push((e as Error).message);
    start = defaults.start;
    end = defaults.end;
  }
  const campaign = data.campaigns.find((c) => c.id === query.campaign);
  if (query.campaign && !campaign)
    problems.push("The selected campaign is unavailable.");
  const temple = data.temples.find((t) => t.id === query.temple);
  if (query.temple && (!uuid.test(query.temple) || !temple))
    problems.push("The selected temple is unavailable.");
  if (campaign?.temple_id && temple && campaign.temple_id !== temple.id)
    problems.push(
      "That campaign is regional for another temple. Choose a campaign for this temple, or a movement-wide campaign.",
    );
  if (
    campaign?.temple_id &&
    query.country &&
    !data.temples.some(
      (t) => t.id === campaign.temple_id && t.country === query.country,
    )
  )
    problems.push("That regional campaign is not in the selected country.");
  const centre = data.centres.find((c) => c.id === query.centre);
  if (query.centre && (!uuid.test(query.centre) || !centre))
    problems.push("The selected center is unavailable.");
  const category = categories.includes(query.category || "")
    ? query.category
    : undefined;
  if (query.category && !category) problems.push("Unknown book type.");
  const filters: DashboardFilters = {
    start,
    end,
    campaign:
      campaign &&
      !(temple && campaign.temple_id && campaign.temple_id !== temple.id) &&
      !(
        campaign.temple_id &&
        query.country &&
        !data.temples.some(
          (t) => t.id === campaign.temple_id && t.country === query.country,
        )
      )
        ? campaign.id
        : undefined,
    temple: temple?.id,
    centre: centre?.id,
    country: query.country || undefined,
    language: query.language || undefined,
    category,
  };
  const dash = await dashboard(filters);
  if (dash) {
    if (filters.country && !dash.options.countries.includes(filters.country))
      problems.push("Unknown country.");
    if (filters.language && !dash.options.languages.includes(filters.language))
      problems.push("Unknown language.");
  }
  const active = [
    filters.campaign,
    filters.country,
    filters.temple,
    filters.centre,
    filters.language,
    filters.category,
    start !== defaults.start || end !== defaults.end ? "range" : "",
  ].filter(Boolean).length;
  const csv = (view: string) => {
    const p = new URLSearchParams({ view, start, end });
    for (const k of [
      "campaign",
      "country",
      "temple",
      "centre",
      "language",
      "category",
    ] as const)
      if (filters[k]) p.set(k, filters[k]!);
    return `/api/reports?${p}`;
  };
  const applied = [
    campaign ? campaign.name : "All campaigns",
    filters.country,
    temple?.name,
    centre?.name,
    filters.language,
    category ? categoryLabel(category) : undefined,
  ].filter(Boolean) as string[];

  return (
    <div className="container dashboard">
      <PageIntro eyebrow="Our collective service" title="Global dashboard" />

      <DashboardFilterForm
        filters={filters}
        defaults={defaults}
        campaigns={data.campaigns}
        temples={data.temples}
        centres={data.centres}
        countries={dash?.options.countries || []}
        languages={dash?.options.languages || []}
        active={active}
      />

      {problems.map((p) => (
        <p key={p} className="error" role="alert">
          {p}
        </p>
      ))}

      <p className="section-note applied">
        <strong>
          {dateLabel(start)} – {dateLabel(end)}
        </strong>
        {applied.map((a) => (
          <span key={a} className="pill">
            {a}
          </span>
        ))}
      </p>

      {!dash ? (
        <Empty title="The dashboard is being prepared">
          {data.connected
            ? "Apply the dashboard database migration to enable interactive reporting."
            : "Figures will appear once the database connection is live."}
        </Empty>
      ) : (
        <DashboardBody
          dash={dash}
          filters={filters}
          csv={csv}
          temple={temple?.name}
        />
      )}
    </div>
  );
}

function DashboardBody({
  dash,
  filters,
  csv,
  temple,
}: {
  dash: NonNullable<Awaited<ReturnType<typeof dashboard>>>;
  filters: DashboardFilters;
  csv: (view: string) => string;
  temple?: string;
}) {
  const { totals, all_time, previous } = dash;
  const lineFilter = Boolean(filters.language || filters.category);
  const months = monthsBetween(filters.start, filters.end);
  const monthly = months.map((m) => ({
    label: monthLabel(m),
    value: Number(dash.by_month.find((r) => r.month === m)?.books || 0),
  }));
  const yearly = dash.by_year.map((r) => ({
    label: String(r.year),
    value: Number(r.books),
  }));
  const startYear = Number(filters.start.slice(0, 4)),
    endYear = Number(filters.end.slice(0, 4));
  const targetRows = [];
  for (let y = startYear; y <= endYear && targetRows.length < 6; y++) {
    const achieved = Number(dash.by_year.find((r) => r.year === y)?.books || 0);
    const rows = dash.targets.filter((t) => t.year === y);
    let target = 0,
      label = "";
    if (filters.temple) {
      const own = rows.find((t) => t.temple_id === filters.temple);
      if (own) {
        target = Number(own.books);
        label = `${temple} · ${y}`;
      }
    } else if (filters.country) {
      const inCountry = rows.filter(
        (t) => t.temple_id && t.country === filters.country,
      );
      if (inCountry.length) {
        target = inCountry.reduce((a, t) => a + Number(t.books), 0);
        label = `${filters.country} · ${y} · sum of ${inCountry.length} temple targets`;
      }
    } else {
      const global = rows.find((t) => !t.temple_id);
      if (global) {
        target = Number(global.books);
        label = `Movement-wide · ${y}`;
      } else {
        const temples = rows.filter((t) => t.temple_id);
        if (temples.length) {
          target = temples.reduce((a, t) => a + Number(t.books), 0);
          label = `Sum of ${temples.length} temple targets · ${y}`;
        }
      }
    }
    if (target) targetRows.push({ year: y, achieved, target, label });
  }
  const templeTargets = dash.targets.filter(
    (t) => t.temple_id && (!filters.country || t.country === filters.country),
  );

  return (
    <>
      {lineFilter && Number(dash.excluded_total_only) > 0 && (
        <p className="notice">
          Language and book-type filters use book details, so{" "}
          {number(Number(dash.excluded_total_only))} total-only{" "}
          {Number(dash.excluded_total_only) === 1 ? "report is" : "reports are"}{" "}
          not included in these figures.
        </p>
      )}

      <div className="kpis">
        <Kpi
          label="Books distributed"
          value={Number(totals.books)}
          sub={`${number(Number(totals.sets))} complete ${
            Number(totals.sets) === 1 || Number(totals.sets) === 0
              ? "set"
              : "sets"
          } included`}
          delta={delta(Number(totals.books), Number(previous.books))}
          deltaLabel={`vs ${dateLabel(previous.start)} – ${dateLabel(previous.end)}`}
        />
        <Kpi
          label="All-time books"
          value={Number(all_time.books)}
          sub={
            all_time.first_date
              ? `Since ${dateLabel(all_time.first_date)} · ${number(Number(all_time.reports))} reports`
              : "No reports yet"
          }
        />
        <Kpi
          label="Sets Distributed"
          value={Number(totals.sets)}
          sub="Srimad Bhagavatam, Caitanya Caritamrta, and Srila Prabhupada Lilamrita sets distributed"
          delta={delta(Number(totals.sets), Number(previous.sets))}
          deltaLabel="vs previous period"
        />
        <Kpi
          label="Reporting temples"
          value={Number(totals.temples)}
          sub={`Across ${number(Number(totals.countries))} ${
            Number(totals.countries) === 1 ? "country" : "countries"
          } · ${number(Number(totals.reports))} reports`}
        />
      </div>

      <section className="dash-section" id="targets">
        <div className="section-title">
          <h2>Progress toward annual targets</h2>
          <Link href="/portal?tab=targets">
            Set a target <ArrowUpRight size={16} />
          </Link>
        </div>
        {targetRows.length ? (
          <div className="chart-card">
            {targetRows.map((t) => (
              <Progress
                key={t.year}
                label={t.label}
                sub={`Books distributed in ${t.year} under the current filters`}
                value={t.achieved}
                target={t.target}
              />
            ))}
            {!filters.temple && templeTargets.length > 0 && (
              <details className="bars-more">
                <summary>Temple targets ({templeTargets.length})</summary>
                <ol className="bars">
                  {templeTargets.map((t) => {
                    const done = Number(
                      dash.by_temple.find((r) => r.temple_id === t.temple_id)
                        ?.books || 0,
                    );
                    return (
                      <li key={`${t.temple_id}-${t.year}`} className="bar">
                        <div className="bar-main">
                          <div className="bar-head">
                            <span className="bar-label">
                              {t.temple_name}
                              <small>
                                {t.country} · {t.year}
                              </small>
                            </span>
                            <span className="bar-value">
                              {number(done)}
                              <small>
                                {" "}
                                of {number(Number(t.books))} ·{" "}
                                {Math.min(
                                  100,
                                  Math.round((done / Number(t.books)) * 100),
                                )}
                                %
                              </small>
                            </span>
                          </div>
                          <div className="bar-track">
                            <span
                              className="bar-fill"
                              style={{
                                width: `${Math.min(100, (done / Number(t.books)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </details>
            )}
          </div>
        ) : (
          <p className="chart-empty">
            No annual target has been set for{" "}
            {startYear === endYear ? startYear : `${startYear}–${endYear}`}
            {temple
              ? ` at ${temple}`
              : filters.country
                ? ` in ${filters.country}`
                : ""}
            . Movement-wide and temple targets can be set in the portal.
          </p>
        )}
      </section>

      <section className="dash-section" id="trends">
        <div className="section-title">
          <h2>Trends and comparisons</h2>
        </div>
        <div className="chart-grid">
          <ChartCard
            title="Books by month"
            note={`${dateLabel(filters.start)} – ${dateLabel(filters.end)}`}
            csv={csv("monthly")}
            chart={{ points: monthly, filename: "books-by-month" }}
          >
            <Columns points={monthly} showValues={monthly.length <= 12} />
          </ChartCard>
          <ChartCard
            title="Books by year"
            note="All-time, under the current campaign, place, language and book-type filters"
            csv={csv("yearly")}
            chart={{ points: yearly, filename: "books-by-year" }}
          >
            <Columns points={yearly} showValues />
          </ChartCard>
        </div>
        <div className="compare">
          <CompareRow
            label="Books"
            current={Number(totals.books)}
            prior={Number(previous.books)}
          />
          <CompareRow
            label="Complete sets"
            current={Number(totals.sets)}
            prior={Number(previous.sets)}
          />
          <p className="chart-note">
            Current period: {dateLabel(filters.start)} –{" "}
            {dateLabel(filters.end)}. Previous: {dateLabel(previous.start)} –{" "}
            {dateLabel(previous.end)}.
          </p>
        </div>
      </section>

      <section className="dash-section" id="breakdown">
        <div className="section-title">
          <h2>Distribution by place, language and book type</h2>
        </div>
        <div className="chart-grid">
          <ChartCard
            title="By country"
            csv={csv("countries")}
            chart={{
              points: dash.by_country.map((r) => ({
                label: r.country,
                value: Number(r.books),
              })),
              filename: "books-by-country",
            }}
          >
            <Bars
              rows={dash.by_country.map((r) => ({
                key: r.country,
                label: r.country,
                sub: `${number(Number(r.temples))} ${Number(r.temples) === 1 ? "temple" : "temples"}`,
                value: Number(r.books),
                detail: `${number(Number(r.sets))} sets`,
              }))}
            />
          </ChartCard>
          <ChartCard
            title="By temple"
            csv={csv("temples")}
            chart={{
              points: dash.by_temple.map((r) => ({
                label: r.temple_name,
                value: Number(r.books),
              })),
              filename: "books-by-temple",
            }}
          >
            <Bars
              rows={dash.by_temple.map((r) => ({
                key: r.temple_id,
                label: r.temple_name,
                sub: r.country,
                href: `/temples/${r.temple_id}`,
                value: Number(r.books),
                detail: `${number(Number(r.sets))} sets`,
              }))}
            />
          </ChartCard>
          <ChartCard
            title="By language"
            note="Detailed reports only"
            csv={csv("languages")}
            chart={{
              points: dash.by_language.map((r) => ({
                label: r.language,
                value: Number(r.books),
              })),
              filename: "books-by-language",
            }}
          >
            <Bars
              rows={dash.by_language.map((r) => ({
                key: r.language,
                label: r.language,
                value: Number(r.books),
                detail: `${number(Number(r.sets))} sets`,
              }))}
            />
          </ChartCard>
          <ChartCard
            title="By book type"
            note="Detailed reports only"
            csv={csv("categories")}
            chart={{
              points: dash.by_category.map((r) => ({
                label: categoryLabel(r.category),
                value: Number(r.books),
              })),
              filename: "books-by-type",
            }}
          >
            <Bars
              rows={dash.by_category.map((r) => ({
                key: r.category,
                label: categoryLabel(r.category),
                value: Number(r.books),
                detail: `${number(Number(r.sets))} sets`,
              }))}
            />
          </ChartCard>
        </div>
      </section>

      <section className="dash-section" id="rankings">
        <div className="section-title">
          <h2>Rankings</h2>
        </div>
        <div className="chart-grid">
          <ChartCard title="Temples" csv={csv("temples")}>
            <Bars
              ranked
              rows={dash.by_temple.map((r) => ({
                key: r.temple_id,
                label: r.temple_name,
                sub: r.country,
                href: `/temples/${r.temple_id}`,
                value: Number(r.books),
                detail: `${number(Number(r.sets))} sets`,
              }))}
            />
          </ChartCard>
          <ChartCard
            title="Teams"
            note="Reports attributed to a team"
            csv={csv("teams")}
          >
            <Bars
              ranked
              rows={dash.by_team.map((r) => ({
                key: r.team_id,
                label: r.name,
                sub: `${r.temple_name} · ${r.country}`,
                value: Number(r.books),
                detail: `${number(Number(r.sets))} sets`,
              }))}
            />
          </ChartCard>
          <ChartCard
            title="Individuals"
            note="Reports attributed to an individual"
            csv={csv("individuals")}
          >
            <Bars
              ranked
              rows={dash.by_individual.map((r) => ({
                key: r.individual_id,
                label: r.name,
                sub: `${r.temple_name} · ${r.country}`,
                value: Number(r.books),
                detail: `${number(Number(r.sets))} sets`,
              }))}
            />
          </ChartCard>
        </div>
      </section>
    </>
  );
}

function delta(current: number, prior: number) {
  if (!prior) return null;
  return ((current - prior) / prior) * 100;
}

function Kpi({
  label,
  value,
  sub,
  delta,
  deltaLabel,
}: {
  label: string;
  value: number;
  sub: string;
  delta?: number | null;
  deltaLabel?: string;
}) {
  return (
    <div className="stat-card kpi">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">
        <AnimatedNumber value={value} />
      </strong>
      <small className="stat-sub">{sub}</small>
      {delta !== undefined && delta !== null && (
        <span
          className={
            delta > 0 ? "delta up" : delta < 0 ? "delta down" : "delta flat"
          }
          title={deltaLabel}
        >
          {delta > 0 ? (
            <TrendingUp size={13} />
          ) : delta < 0 ? (
            <TrendingDown size={13} />
          ) : (
            <Minus size={13} />
          )}
          {delta > 0 ? "+" : ""}
          {Math.abs(delta) >= 1000
            ? number(Math.round(delta))
            : delta.toFixed(1)}
          %<small> {deltaLabel}</small>
        </span>
      )}
    </div>
  );
}

function CompareRow({
  label,
  current,
  prior,
}: {
  label: string;
  current: number;
  prior: number;
}) {
  const max = Math.max(current, prior, 1),
    d = delta(current, prior);
  return (
    <div className="compare-row">
      <span className="bar-label">{label}</span>
      <div className="compare-bars">
        <div className="bar-track">
          <span
            className="bar-fill"
            style={{ width: `${(current / max) * 100}%` }}
          />
        </div>
        <div className="bar-track">
          <span
            className="bar-fill prior"
            style={{ width: `${(prior / max) * 100}%` }}
          />
        </div>
      </div>
      <span className="bar-value">
        {number(current)}
        <small>
          {" "}
          vs {number(prior)}
          {d !== null
            ? ` · ${d > 0 ? "+" : ""}${d.toFixed(1)}%`
            : prior === 0 && current > 0
              ? " · new"
              : ""}
        </small>
      </span>
    </div>
  );
}
