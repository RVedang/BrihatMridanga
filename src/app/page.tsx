import { MarathonHero } from "@/components/marathon-hero";
import { marathonPublicDirectory, marathonStandings } from "@/lib/marathon-data";
import Link from "next/link";
import { HomeShorts } from "@/components/home-shorts";
import { ArrowUpRight, CalendarDays, Flag } from "lucide-react";
import {
  publicData,
  type Campaign,
  type Content,
  type Temple,
} from "@/lib/data";
import { Empty, SectionTitle } from "@/components/ui";
import { TestimonialCard } from "@/components/testimonial-card";
import { HomeStories } from "@/components/story-sections";
import { AgendaCard } from "@/components/agenda-card";
import { isDistributorTestimonial, isHomepageStory } from "@/lib/story-types";
import { dateLabel, todayIn } from "@/lib/dates";
import { siteUrl } from "@/lib/site";
import styles from "./home.module.css";
import agenda from "./agenda.module.css";
import testimonialsStyles from "./testimonials.module.css";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [data, marathonTemples, standings] = await Promise.all([
    publicData(),
    marathonPublicDirectory(),
    marathonStandings(),
  ]);
  const today = todayIn();

  const testimonials = data.content.filter(isDistributorTestimonial),
    upcomingEvents = data.content
      .filter((c) => c.kind === "event")
      .filter((c) => !c.ends_at || c.ends_at.slice(0, 10) >= today)
      .sort(
        (a, b) =>
          (a.starts_at || "").localeCompare(b.starts_at || "") ||
          a.title.localeCompare(b.title),
      )
      .slice(0, 2),
    upcomingCampaigns = data.campaigns
      .filter((c) => !c.fallback_year && c.ends_on >= today)
      .sort(
        (a, b) =>
          a.starts_on.localeCompare(b.starts_on) ||
          a.ends_on.localeCompare(b.ends_on),
      )
      .slice(0, 2);
  const base = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: "Brihat Mridanga",
        url: base,
        logo: `${base}/icon.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: "Brihat Mridanga",
        url: base,
        publisher: { "@id": `${base}/#organization` },
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <MarathonHero initial={standings} temples={marathonTemples} />
      <div className={styles.content}>
        <HomeShorts />
        <section className={styles.community}>
          <div className="container home-testimonials">
            <SectionTitle title="Recent testimonials" />
            {testimonials.length ? (
              <>
                <div className={testimonialsStyles.desktop}>
                  <div className={testimonialsStyles.grid}>
                    {testimonials.slice(0, 6).map((t) => (
                      <TestimonialCard
                        key={t.id}
                        item={t}
                        temple={data.temples.find((x) => x.id === t.temple_id)}
                      />
                    ))}
                  </div>
                </div>
                <div className={testimonialsStyles.mobile}>
                  {testimonials.slice(0, 3).map((t) => (
                    <TestimonialCard
                      key={t.id}
                      item={t}
                      temple={data.temples.find((x) => x.id === t.temple_id)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <Empty title="Testimonials will appear here">
                Book distribution testimonials from published stories will be
                shown in this section.
              </Empty>
            )}
          </div>
        </section>
        <div className={styles.service}>
          <aside
            className={`container ${agenda.section}`}
            aria-label="Service throughout the year"
          >
            <p className="eyebrow">Service throughout the year</p>
            <div
              className={`${agenda.chapter} ${!upcomingCampaigns.length ? agenda.empty : ""}`}
            >
              <h2 className="home-rail-heading">
                <span className="home-rail-heading-icon" aria-hidden>
                  <Flag size={16} strokeWidth={1.8} />
                </span>
                Upcoming campaigns
              </h2>
              {upcomingCampaigns.length ? (
                <div className={agenda.items}>
                  {upcomingCampaigns.map((campaign) => (
                    <HomeCampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      temple={data.temples.find(
                        (t) => t.id === campaign.temple_id,
                      )}
                    />
                  ))}
                </div>
              ) : (
                <p>
                  Movement-wide campaigns, marathons and regional campaigns will
                  appear here with their dates.
                </p>
              )}
              <Link className="text-link" href="/campaigns">
                Explore campaigns <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className={agenda.chapter}>
              <h2 className="home-rail-heading">
                <span className="home-rail-heading-icon" aria-hidden>
                  <CalendarDays size={16} strokeWidth={1.8} />
                </span>
                Upcoming events
              </h2>
              {upcomingEvents.length ? (
                <div className={agenda.items}>
                  {upcomingEvents.map((event) => (
                    <HomeEventCard
                      key={event.id}
                      event={event}
                      temple={data.temples.find(
                        (t) => t.id === event.temple_id,
                      )}
                    />
                  ))}
                </div>
              ) : (
                <div className={agenda.items}>
                  <div className={agenda.placeholder} data-reveal>
                    <span className={agenda.date} aria-hidden="true">
                      <CalendarDays size={26} />
                    </span>
                    <p>
                      Upcoming temple events and training will appear in the
                      calendar.
                    </p>
                  </div>
                </div>
              )}
              <Link className="text-link" href="/events">
                Open calendar <ArrowUpRight size={15} />
              </Link>
            </div>
          </aside>
        </div>
        <div className={styles.stories}>
          <div className="container">
            <HomeStories
              items={data.content.filter(isHomepageStory)}
              temples={data.temples}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function HomeCampaignCard({
  campaign,
  temple,
}: {
  campaign: Campaign;
  temple?: Temple;
}) {
  const regional = Boolean(campaign.temple_id);
  const marathon = /\bmarathon\b/i.test(campaign.name);
  const pill = regional
    ? "Regional campaign"
    : marathon
      ? "Movement-wide marathon"
      : "Movement-wide campaign";
  return (
    <AgendaCard
      href={`/campaigns/${campaign.id}`}
      pill={pill}
      start={campaign.starts_on}
      kicker={regional ? temple?.name || "Temple" : "All temples"}
      title={campaign.name}
      dates={`${dateLabel(campaign.starts_on)} – ${dateLabel(campaign.ends_on)}`}
      go="View campaign"
    />
  );
}

function eventDates(event: Content) {
  const start = event.starts_at?.slice(0, 10);
  const end = event.ends_at?.slice(0, 10);
  if (start && end && end !== start)
    return `${dateLabel(start)} – ${dateLabel(end)}`;
  if (start) return dateLabel(start);
  return undefined;
}

function HomeEventCard({ event, temple }: { event: Content; temple?: Temple }) {
  return (
    <AgendaCard
      href={`/events/${event.id}`}
      pill="Event"
      start={event.starts_at?.slice(0, 10)}
      kicker={event.location || temple?.name}
      title={event.title}
      dates={eventDates(event)}
      go="View event"
    />
  );
}
