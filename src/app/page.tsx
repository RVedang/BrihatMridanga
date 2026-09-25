import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, CalendarDays, Flag } from "lucide-react";
import {
  publicData,
  scores,
  type Campaign,
  type Content,
  type Temple,
} from "@/lib/data";
import { Empty, SectionTitle, HomeStats } from "@/components/ui";
import { TestimonialCard } from "@/components/testimonial-card";
import { HomeStories } from "@/components/story-sections";
import { AgendaCard } from "@/components/agenda-card";
import { isTestimonialStory } from "@/lib/story-types";
import { dateLabel } from "@/lib/dates";
import styles from "./home.module.css";
import agenda from "./agenda.module.css";
import testimonialsStyles from "./testimonials.module.css";
export const dynamic = "force-dynamic";
export default async function Home() {
  const data = await publicData();
  const now = new Date(),
    year = now.getUTCFullYear(),
    month = now.getUTCMonth(),
    monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`,
    lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate(),
    monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [allTimeScores, monthScores] = await Promise.all([
    scores("1970-01-01", "2099-12-31"),
    scores(monthStart, monthEnd),
  ]);

  const globalBooks = allTimeScores.reduce(
    (acc, r) => acc + Number(r.books || 0),
    0,
  );
  const templeCount = data.temples.length || allTimeScores.length;
  const countryCount = new Set(
    [
      ...data.temples.map((t) => t.country),
      ...allTimeScores.map((r) => r.country),
    ].filter(Boolean),
  ).size;

  const topMonthTemple =
    monthScores.length > 0
      ? [...monthScores].sort((a, b) => Number(b.books) - Number(a.books))[0]
      : null;

  const today = now.toISOString().slice(0, 10);
  const testimonials = data.content.filter(isTestimonialStory),
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
  return (
    <>
      <section className={styles.hero} aria-label="Our inspiration">
        <div className={styles.field} aria-hidden="true">
          <div className={styles.ambient}>
            <Image
              src="/home/prabhupada-books.jpg"
              alt=""
              width={712}
              height={1024}
              sizes="100vw"
              loading="eager"
            />
          </div>
          <div className={styles.veil}>
            <Image
              src="/home/prabhupada-books.jpg"
              alt=""
              width={712}
              height={1024}
              sizes="100vw"
              loading="eager"
            />
          </div>
        </div>
        <div className={styles.shade} aria-hidden="true" />
        <div className={styles.stage}>
          <figure className={styles.photo}>
            <Image
              src="/home/prabhupada-books.jpg"
              alt="Śrīla Prabhupāda receiving a stack of books"
              width={1046}
              height={1504}
              sizes="(max-width: 480px) 82vw, 390px"
              preload
            />
          </figure>
          <div className={styles.copy}>
            <h1 className="visually-hidden">Brihat Mridanga</h1>
            <figure className={styles.quote}>
              <p className={styles.kicker}>Books are the Basis</p>
              <blockquote>
                <p>
                  <span>Distribute books, </span>
                  <span>Distribute books, </span>
                  <span>Distribute books.</span>
                </p>
              </blockquote>
              <figcaption className={styles.attribution}>
                <cite>
                  His Divine Grace A.C.
                  <br />
                  Bhaktivedanta Swami Prabhupada
                </cite>
                <span>
                  Founder-Acharya of the worldwide Hare Krishna Movement
                </span>
              </figcaption>
            </figure>
            <p className={styles.description}>
              A shared home for the stories, service and collective efforts of
              our book distribution community.
            </p>
            <div className={styles.actions}>
              <Link className={`button ${styles.primary}`} href="/dashboard">
                View Dashboard <ArrowUpRight size={17} />
              </Link>
              <Link className={styles.secondary} href="/portal">
                Submit Distribution <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className={styles.worldMap} aria-hidden="true">
              <svg
                className={styles.mapMotion}
                viewBox="0 0 900 342"
                fill="none"
              >
                <path d="M160 140 Q350 10 490 165 T750 160" pathLength="1" />
                <circle cx="160" cy="140" r="5" />
                <circle cx="490" cy="165" r="5" />
                <circle cx="750" cy="160" r="5" />
              </svg>
              <Image
                src="/home/world-community.svg"
                alt=""
                width={900}
                height={342}
                sizes="(max-width: 800px) 100vw, 60vw"
              />
            </div>
          </div>
        </div>
      </section>
      <div className={`container ${styles.content}`}>
        <section className="score-section" id="collective-offering">
          <SectionTitle
            title="Our collective offering"
            href="/dashboard"
            link="View dashboard"
          />
          <HomeStats
            globalBooks={globalBooks}
            templeCount={templeCount}
            countryCount={countryCount}
            leadingTemple={
              topMonthTemple
                ? {
                    name: topMonthTemple.temple_name,
                    books: Number(topMonthTemple.books),
                  }
                : null
            }
            connected={data.connected}
          />
        </section>
        <div className={`home-board ${testimonialsStyles.board}`}>
          <section className="home-testimonials">
            <SectionTitle title="Recent testimonials" />
            {testimonials.length ? (
              <div className={testimonialsStyles.grid}>
                {testimonials.slice(0, 6).map((t) => (
                  <TestimonialCard
                    key={t.id}
                    item={t}
                    temple={data.temples.find((x) => x.id === t.temple_id)}
                    centre={data.centres.find((c) => c.id === t.centre_id)}
                  />
                ))}
              </div>
            ) : (
              <Empty title="Testimonials will appear here">
                Distributor testimonials and recipient experiences from
                published stories will be shown in this section.
              </Empty>
            )}
          </section>
          <aside
            className={agenda.section}
            aria-label="Service throughout the year"
          >
            <p className="eyebrow">Service throughout the year</p>
            <div className={agenda.chapter}>
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
                <p>
                  Upcoming temple events and training will appear in the
                  calendar.
                </p>
              )}
              <Link className="text-link" href="/events">
                Open calendar <ArrowUpRight size={15} />
              </Link>
            </div>
          </aside>
        </div>
        <HomeStories
          items={data.content.filter((c) => c.kind === "community_story")}
        />
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
