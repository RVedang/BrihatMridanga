import { notFound } from "next/navigation";
import { dashboard, publicData, scores, templeTeams } from "@/lib/data";
import {
  annualRange,
  clampDate,
  dateLabel,
  validDate,
  validateRange,
} from "@/lib/dates";
import { PageIntro, Stats, ScoreTable, TempleTotals } from "@/components/ui";
import { DateFilter } from "@/components/date-filter";
import { TempleProfile } from "@/components/temple-profile";
import { CampaignOverview } from "@/components/campaign-overview";
import { StoryArticle } from "@/components/story-article";
export const dynamic = "force-dynamic";
export default async function Detail({
  params,
  searchParams,
}: {
  params: Promise<{ section: string; id: string }>;
  searchParams: Promise<{
    start?: string;
    end?: string;
    centre?: string;
    temple?: string;
    country?: string;
  }>;
}) {
  const { section, id } = await params,
    query = await searchParams,
    data = await publicData();
  if (section === "campaigns" || section === "temples") {
    const annual = section === "campaigns" ? /^annual-(\d{4})$/.exec(id) : null,
      year = annual ? Number(annual[1]) : new Date().getUTCFullYear();
    if (year < 1900 || year > 9998) notFound();
    const campaign =
      section === "campaigns"
        ? data.campaigns.find((c) =>
            annual ? c.fallback_year === year : c.id === id,
          )
        : null;
    const temple =
      section === "temples" ? data.temples.find((t) => t.id === id) : null;
    if (!annual && !campaign && !temple) notFound();
    const range = campaign
      ? { start: campaign.starts_on, end: campaign.ends_on }
      : annualRange(year);
    let start = query.start || range.start,
      end = query.end || range.end;
    if (campaign) {
      start = validDate(start)
        ? clampDate(start, range.start, range.end)
        : range.start;
      end = validDate(end) ? clampDate(end, range.start, range.end) : range.end;
      if (start > end) end = start;
    }
    const templeCentres = temple
      ? data.centres.filter((c) => c.temple_id === id)
      : [];
    const movementWide = section === "campaigns" && !campaign?.temple_id;
    const countries = [
      ...new Set(data.temples.map((item) => item.country).filter(Boolean)),
    ].sort();
    const selectedCountry =
      movementWide && query.country && countries.includes(query.country)
        ? query.country
        : undefined;
    const selectedTemple =
      movementWide &&
      query.temple &&
      data.temples.some(
        (item) =>
          item.id === query.temple &&
          (!selectedCountry || item.country === selectedCountry),
      )
        ? query.temple
        : undefined;
    const campaignCentres =
      section === "campaigns"
        ? data.centres.filter((c) => {
            if (campaign?.temple_id) return c.temple_id === campaign.temple_id;
            if (selectedTemple) return c.temple_id === selectedTemple;
            if (selectedCountry)
              return data.temples.some(
                (item) =>
                  item.id === c.temple_id && item.country === selectedCountry,
              );
            return true;
          })
        : [];
    const filterCentres = temple ? templeCentres : campaignCentres;
    const centre =
      query.centre && filterCentres.some((c) => c.id === query.centre)
        ? query.centre
        : undefined;
    let error = "";
    try {
      validateRange(start, end);
    } catch (e) {
      error = (e as Error).message;
    }
    const allRows =
      error || (annual && !campaign)
        ? []
        : await scores(start, end, campaign?.id, centre);
    const rows = temple
      ? allRows.filter((r) => r.temple_id === id)
      : selectedTemple
        ? allRows.filter((r) => r.temple_id === selectedTemple)
        : selectedCountry
          ? allRows.filter((r) => r.country === selectedCountry)
          : allRows;
    const viewCampaign =
      campaign ||
      (annual && section === "campaigns"
        ? {
            id: "",
            name: `Whole-Year Marathon ${year}`,
            description: "",
            temple_id: null,
            starts_on: range.start,
            ends_on: range.end,
            fallback_year: year,
            instructions: "",
            target_books: null,
          }
        : null);
    const progressRows =
      !campaign || error
        ? rows
        : start === campaign.starts_on &&
            end === campaign.ends_on &&
            !centre &&
            !selectedTemple &&
            !selectedCountry &&
            !temple
          ? campaign.temple_id
            ? rows.filter((r) => r.temple_id === campaign.temple_id)
            : rows
          : (
              await scores(
                campaign.starts_on,
                campaign.ends_on,
                campaign.id,
              )
            ).filter((r) =>
              campaign.temple_id ? r.temple_id === campaign.temple_id : true,
            );
    const dash =
      error
        ? null
        : temple
          ? await dashboard({
              start,
              end,
              temple: temple.id,
              centre,
            })
          : campaign
            ? await dashboard({
                start,
                end,
                campaign: campaign.id,
                country: selectedCountry,
                temple: campaign.temple_id || selectedTemple,
                centre,
              })
            : null;
    const lifetimeRows =
      temple && !dash && !error
        ? (await scores("1900-01-01", "9998-12-31", undefined, centre)).filter(
            (r) => r.temple_id === id,
          )
        : [];
    const targetYear = Number(start.slice(0, 4));
    const yearDash =
      temple && !error
        ? start === `${targetYear}-01-01` &&
          end === `${targetYear}-12-31` &&
          !centre &&
          dash
          ? dash
          : await dashboard({
              start: `${targetYear}-01-01`,
              end: `${targetYear}-12-31`,
              temple: id,
            })
        : null;
    const roster = temple ? await templeTeams(temple.id) : [];
    return (
      <div className={section === "campaigns" ? "container campaign-page" : "container"}>
        <PageIntro
          eyebrow={
            temple
              ? temple.country
              : campaign?.temple_id
                ? `Regional · ${data.temples.find((t) => t.id === campaign.temple_id)?.name || "Temple"}`
                : campaign
                  ? "Movement-wide"
                  : "Campaign results"
          }
          title={
            temple?.name || campaign?.name || `Whole-Year Marathon ${year}`
          }
          meta={
            temple
              ? undefined
              : `${dateLabel(viewCampaign?.starts_on || range.start)} – ${dateLabel(viewCampaign?.ends_on || range.end)}`
          }
        >
          {temple ? (
            temple.information || temple.contact ? (
              <>
                {temple.information ? (
                  <p className="temple-information">{temple.information}</p>
                ) : null}
                {temple.contact ? (
                  <p className="temple-contact">{temple.contact}</p>
                ) : null}
              </>
            ) : (
              <p>
                Temple information and contact details will appear here once
                they are added.
              </p>
            )
          ) : (
            campaign?.description ||
            "Year-round distribution outside special campaigns. These figures cover the Whole-Year Marathon campaign only."
          )}
        </PageIntro>
        <DateFilter
          start={start}
          end={end}
          min={campaign ? range.start : undefined}
          max={campaign ? range.end : undefined}
          countries={movementWide ? countries : undefined}
          country={selectedCountry}
          temples={movementWide ? data.temples : undefined}
          temple={selectedTemple}
          centres={temple || section === "campaigns" ? filterCentres : undefined}
          centre={centre}
        />
        {error ? (
          <p role="alert" className="error">
            {error}
          </p>
        ) : (
          <>
            {temple ? (
              <TempleTotals
                connected={data.connected}
                start={start}
                end={end}
                current={{
                  books: dash
                    ? Number(dash.totals.books)
                    : rows.reduce((a, r) => a + Number(r.books), 0),
                  sets: dash
                    ? Number(dash.totals.sets)
                    : rows.reduce((a, r) => a + Number(r.sets || 0), 0),
                }}
                allTime={{
                  books: dash
                    ? Number(dash.all_time.books)
                    : lifetimeRows.reduce((a, r) => a + Number(r.books), 0),
                  sets: dash
                    ? Number(dash.all_time.sets)
                    : lifetimeRows.reduce(
                        (a, r) => a + Number(r.sets || 0),
                        0,
                      ),
                  reports: dash ? Number(dash.all_time.reports) : undefined,
                  firstDate: dash?.all_time.first_date,
                }}
              />
            ) : (
              <>
                <Stats rows={rows} connected={data.connected} />
                {viewCampaign && (
                  <CampaignOverview
                    campaign={viewCampaign}
                    temples={data.temples}
                    targets={data.targets}
                    rows={
                      viewCampaign.temple_id
                        ? rows.filter(
                            (r) => r.temple_id === viewCampaign.temple_id,
                          )
                        : rows
                    }
                    progressRows={progressRows}
                    dash={dash}
                  />
                )}
                <section className="dash-section">
                  <div className="section-title">
                    <h2>Temple results</h2>
                  </div>
                  <ScoreTable rows={rows} />
                </section>
              </>
            )}
            {temple && (
              <TempleProfile
                temple={temple}
                content={data.content}
                centres={data.centres}
                year={targetYear}
                monthlyTargets={data.monthlyTargets.filter(
                  (g) =>
                    g.temple_id === temple.id && Number(g.year) === targetYear,
                )}
                byMonth={yearDash?.by_month || []}
                teams={roster}
              />
            )}
          </>
        )}
      </div>
    );
  }
  const item = data.content.find((c) => {
    if (c.id !== id) return false;
    if (section === "stories")
      return c.kind === "story" || c.kind === "community_story";
    if (section === "resources") return c.kind === "resource";
    if (section === "events") return c.kind === "event";
    return false;
  });
  if (!item) notFound();
  if (item.kind === "story" || item.kind === "community_story") {
    return (
      <StoryArticle
        item={item}
        temple={data.temples.find((t) => t.id === item.temple_id)}
        more={data.content
          .filter((c) => c.kind === item.kind && c.id !== item.id)
          .slice(0, 3)}
      />
    );
  }
  return (
    <div className="container">
      <PageIntro eyebrow={item.language} title={item.title}>
        {item.starts_at
          ? `${new Date(item.starts_at).toLocaleString("en", { timeZone: "UTC" })} UTC · ${item.location}`
          : ""}
      </PageIntro>
      <article className="prose">
        <p>{item.body}</p>
        {item.link_url && (
          <a
            className="button"
            href={item.link_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.kind === "resource" ? "Open resource" : "Visit link"} ↗
          </a>
        )}
      </article>
    </div>
  );
}
