import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { dashboard, dailyScores, publicData, scores } from "@/lib/data";
import { annualRange, dateLabel, validateRange } from "@/lib/dates";
import { PageIntro, Empty } from "@/components/ui";
import { ContentFilters } from "@/components/content-filters";
import { storySearchText } from "@/lib/story-types";
import { ReportFilters, ReportsView } from "@/components/reports-view";
import { AboutView } from "@/components/about-view";
import { StorySections } from "@/components/story-sections";
import { EventCalendar } from "@/components/event-calendar";
import { ListingCard } from "@/components/listing-card";
export const dynamic = "force-dynamic";
const titles: Record<string, [string, string, string]> = {
  temples: [
    "One shared purpose",
    "Our temples",
    "Discover the communities bringing books and wisdom to people around the world.",
  ],
  campaigns: [
    "Year-round service",
    "Campaigns",
    "Every offering belongs. Join a special campaign or contribute to the Whole-Year Marathon.",
  ],
  reports: [
    "A record of service",
    "Distribution reports",
    "Daily, monthly, temple, regional, campaign and year-over-year figures. Filter by campaign, country, temple and center. Recorded points appear in the tables.",
  ],
  stories: [
    "From our community",
    "Stories",
    "This page gathers distributor testimonials from those who take the books out, recipient experiences from people who received them, temple success stories, devotee interviews, photographs and short videos, and book-distribution miracle stories. These community posts are published so the movement can read how sankirtan is lived in each temple.",
  ],
  resources: [
    "Learn. Prepare. Share.",
    "Resources for your service",
    "Practical materials for temples and distributors. Here you will find book-distribution training, conversation guides, seminar recordings, campaign posters and social-media assets, reporting instructions, team-management guidance, frequently asked questions, and translated resources.",
  ],
  events: [
    "Come together",
    "Events & calendar",
    "A global calendar covering sankirtan festivals, training seminars, campaign dates, temple distribution events, and online meetings and presentations.",
  ],
  about: [
    "Our purpose",
    "Brihat Mridanga",
    "A shared home for Srila Prabhupada’s book distribution movement.",
  ],
};
export default async function Section({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { section } = await params,
    query = await searchParams,
    config = titles[section];
  if (!config) notFound();
  const data = await publicData(),
    defaults = annualRange();
  let start = query.start || defaults.start,
    end = query.end || defaults.end,
    rangeError = "";
  try {
    validateRange(start, end);
  } catch (e) {
    rangeError = (e as Error).message;
    start = defaults.start;
    end = defaults.end;
  }
  const selectedCampaign = data.campaigns.find((c) => c.id === query.campaign);
  if (query.campaign && !selectedCampaign)
    rangeError =
      "The selected campaign is unavailable. Choose a campaign from the list.";
  const countries = [
    ...new Set(data.temples.map((t) => t.country).filter(Boolean)),
  ].sort();
  const selectedCountry =
    query.country && countries.includes(query.country)
      ? query.country
      : undefined;
  if (query.country && !selectedCountry)
    rangeError = "The selected country is unavailable.";
  const selectedTemple = data.temples.find((t) => t.id === query.temple);
  if (
    query.temple &&
    (!selectedTemple ||
      (selectedCountry && selectedTemple.country !== selectedCountry))
  )
    rangeError = "The selected temple is unavailable.";
  const selectedCentre = data.centres.find((c) => c.id === query.centre);
  if (
    query.centre &&
    (!selectedCentre ||
      (selectedTemple && selectedCentre.temple_id !== selectedTemple.id) ||
      (selectedCountry &&
        !data.temples.some(
          (t) => t.id === selectedCentre.temple_id && t.country === selectedCountry,
        )))
  )
    rangeError = "The selected center is unavailable.";
  const dash =
    section === "reports" && !rangeError
      ? await dashboard({
          start,
          end,
          campaign: selectedCampaign?.id,
          country: selectedCountry,
          temple: selectedTemple?.id,
          centre: selectedCentre?.id,
        })
      : null;
  const scoreRows =
    section === "reports" && !rangeError
      ? dash
        ? dash.by_temple.map((r) => ({
            temple_id: r.temple_id,
            temple_name: r.temple_name,
            country: r.country,
            books: Number(r.books),
            sets: Number(r.sets),
            known_points: Number(r.points),
            incomplete_reports: Number(r.incomplete_reports),
          }))
        : (await scores(
            start,
            end,
            selectedCampaign?.id,
            selectedCentre?.id,
          )).filter(
            (r) =>
              (!selectedCountry || r.country === selectedCountry) &&
              (!selectedTemple || r.temple_id === selectedTemple.id),
          )
      : [];
  const days =
    section === "reports" && !rangeError
      ? await dailyScores({
          start,
          end,
          campaign: selectedCampaign?.id,
          country: selectedCountry,
          temple: selectedTemple?.id,
          centre: selectedCentre?.id,
        }).then((rows) =>
          rows.length
            ? rows
            : (dash?.by_day || []).map((r) => ({
                day: String(r.day).slice(0, 10),
                books: Number(r.books),
                sets: Number(r.sets),
                points: Number(r.points),
                reports: Number(r.reports),
              })),
        )
      : [];
  const exportHref = (view: string, format?: string) => {
    const p = new URLSearchParams({ view, start, end });
    if (selectedCampaign) p.set("campaign", selectedCampaign.id);
    if (selectedCountry) p.set("country", selectedCountry);
    if (selectedTemple) p.set("temple", selectedTemple.id);
    if (selectedCentre) p.set("centre", selectedCentre.id);
    if (format) p.set("format", format);
    return `/api/reports?${p}`;
  };
  const term = (
      Array.isArray(query.q) ? query.q[0] : query.q || ""
    )
      .toLowerCase()
      .trim(),
    kind =
      section === "stories"
        ? "story"
        : section === "resources"
          ? "resource"
          : "event";
  const templesById = new Map(data.temples.map((temple) => [temple.id, temple]));
  const matches = (c: (typeof data.content)[number]) =>
    storySearchText(
      c,
      c.temple_id ? templesById.get(c.temple_id) : null,
    ).includes(term);
  const content = data.content.filter((c) => c.kind === kind && matches(c));
  const storyItems =
    section === "stories"
      ? data.content.filter(
          (c) =>
            (c.kind === "story" || c.kind === "community_story") && matches(c),
        )
      : [];
  const calendarCampaigns =
    section === "events"
      ? data.campaigns.filter((campaign) => {
          if (campaign.fallback_year) return false;
          const temple = campaign.temple_id
            ? templesById.get(campaign.temple_id)
            : null;
          const hay = [
            campaign.name,
            campaign.description,
            temple?.name,
            temple?.country,
            temple?.city,
            campaign.starts_on,
            campaign.ends_on,
            dateLabel(campaign.starts_on),
            dateLabel(campaign.ends_on),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(term);
        })
      : [];
  return (
    <div className={section === "stories" ? "container stories-page" : "container"}>
      <PageIntro eyebrow={config[0]} title={config[1]}>
        {config[2]}
      </PageIntro>
      {section === "reports" && (
        <div className="reports-board">
          <ReportFilters
            start={start}
            end={end}
            campaign={selectedCampaign?.id}
            country={selectedCountry}
            temple={selectedTemple?.id}
            centre={selectedCentre?.id}
            campaigns={data.campaigns}
            temples={data.temples}
            centres={data.centres}
            countries={countries}
          />
          {rangeError ? (
            <p className="error" role="alert">
              {rangeError}
            </p>
          ) : (
            <ReportsView
              start={start}
              end={end}
              dash={dash}
              days={days}
              rows={scoreRows}
              connected={data.connected}
              exportCsv={exportHref("full")}
              exportXls={exportHref("full", "xls")}
              exportPdf={exportHref("full", "pdf")}
              temples={data.temples}
              catalogCampaigns={data.campaigns}
              scope={[
                `${dateLabel(start)} – ${dateLabel(end)}`,
                selectedCampaign?.name || "All campaigns",
                selectedCountry,
                selectedTemple?.name,
                selectedCentre?.name,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          )}
        </div>
      )}
      {section === "temples" && (
        <>
          <form className="filter-bar">
            <label className="search-field">
              Search temples
              <input
                name="q"
                defaultValue={query.q}
                placeholder="Temple, city or country"
              />
            </label>
            <button className="button">Search</button>
          </form>
          <div className="place-grid">
            {data.temples
              .filter((t) =>
                (t.name + " " + t.country + " " + t.city)
                  .toLowerCase()
                  .includes(term),
              )
              .map((t) => (
                <Link className="place-card" href={`/temples/${t.id}`} key={t.id}>
                  <span className="place-card-country">{t.country}</span>
                  <h3>{t.name}</h3>
                  <p>{t.city || "City to be added"}</p>
                  <span className="place-card-go">
                    View temple <ArrowUpRight size={15} strokeWidth={1.6} />
                  </span>
                </Link>
              ))}
          </div>
          {!data.temples.length && (
            <Empty title="Our temple directory is taking shape">
              Participating temples will appear here once they are added.
            </Empty>
          )}
        </>
      )}
      {section === "campaigns" && (
        <>
          <div className="notice">
            Select any campaign to filter its results by start and end date. The
            Whole-Year Marathon runs from 1 January to 31 December.
          </div>
          <div className="grid">
            <ListingCard
              href={`/campaigns/annual-${new Date().getUTCFullYear()}`}
              pill="Year-round"
              tone="year"
              title={`Whole-Year Marathon ${new Date().getUTCFullYear()}`}
              dates={`${dateLabel(`${new Date().getUTCFullYear()}-01-01`)} – ${dateLabel(`${new Date().getUTCFullYear()}-12-31`)}`}
              go="View results"
            >
              <p>For all distributions outside a special campaign.</p>
            </ListingCard>
            {data.campaigns
              .filter((c) => !c.fallback_year)
              .map((c) => {
                const regional = Boolean(c.temple_id);
                const temple =
                  data.temples.find((t) => t.id === c.temple_id)?.name ||
                  "Temple";
                return (
                  <ListingCard
                    key={c.id}
                    href={`/campaigns/${c.id}`}
                    pill={
                      regional ? "Regional campaign" : "Movement-wide campaign"
                    }
                    tone={regional ? "regional" : "campaign"}
                    kicker={regional ? temple : "All temples"}
                    title={c.name}
                    dates={`${dateLabel(c.starts_on)} – ${dateLabel(c.ends_on)}`}
                    go="View campaign"
                  >
                    {c.description ? <p>{c.description.slice(0, 160)}</p> : null}
                  </ListingCard>
                );
              })}
          </div>
        </>
      )}
      {["stories", "resources", "events"].includes(section) && (
        <>
          <ContentFilters section={section} q={query.q} />
          {section === "events" && (
            <EventCalendar
              key={term || "all"}
              events={content}
              campaigns={calendarCampaigns}
              temples={data.temples}
              search={term}
            />
          )}
          {section === "stories" && (
            <StorySections
              items={storyItems}
              temples={data.temples}
              emptyTitle={
                term ? "No matching stories" : "No stories published yet"
              }
              emptyBody={
                term
                  ? "Try another title, temple or country."
                  : "Stories and testimonials will appear here as temples publish them."
              }
            />
          )}
          {section !== "stories" && section !== "events" && (
            <>
              <div className="grid">
                {content.map((c) => (
                  <ListingCard
                    key={c.id}
                    href={`/${section}/${c.id}`}
                    pill={c.language || "Resource"}
                    title={c.title}
                    dates={
                      c.starts_at
                        ? `${new Date(c.starts_at).toLocaleString("en", {
                            timeZone: "UTC",
                          })} UTC`
                        : undefined
                    }
                    go="Read more"
                  >
                    {c.body ? <p>{c.body.slice(0, 160)}</p> : null}
                  </ListingCard>
                ))}
              </div>
              {!content.length && (
                <Empty title={`No ${section} published yet`}>
                  New {section} will appear here as temples publish them.
                </Empty>
              )}
            </>
          )}
        </>
      )}
      {section === "about" && <AboutView temples={data.temples} />}
    </div>
  );
}
