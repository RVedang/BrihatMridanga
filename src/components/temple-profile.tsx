import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TempleTeams } from "@/components/temple-teams";
import type { Content, MonthlyTarget, RecordItem, Temple, TempleTeam } from "@/lib/data";
import { Empty } from "@/components/ui";
import { Progress } from "@/components/charts";
import { TestimonialCard } from "@/components/testimonial-card";
import { booksForMonth, monthKey } from "@/lib/campaign";
import { monthLabel } from "@/lib/dates";
import {
  isMediaStory,
  isTestimonialStory,
  storyImageSrc,
} from "@/lib/story-types";

function upcoming(items: Content[]) {
  const now = Date.now();
  return items
    .filter((c) => c.kind === "event" && c.ends_at && new Date(c.ends_at).valueOf() >= now)
    .sort(
      (a, b) =>
        new Date(a.starts_at || 0).valueOf() - new Date(b.starts_at || 0).valueOf(),
    );
}

function when(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

export function TempleProfile({
  temple,
  content,
  centres = [],
  year,
  monthlyTargets = [],
  byMonth = [],
  teams = [],
}: {
  temple: Temple;
  content: Content[];
  centres?: RecordItem[];
  year: number;
  monthlyTargets?: MonthlyTarget[];
  byMonth?: { month: string; books: number }[];
  teams?: TempleTeam[];
}) {
  const items = content.filter((c) => c.temple_id === temple.id);
  const photos = items
    .filter(isMediaStory)
    .map((item) => ({ item, src: storyImageSrc(item) }))
    .filter((entry) => entry.src);
  const templeCentres = centres.filter((c) => c.temple_id === temple.id);
  const testimonials = items.filter(isTestimonialStory);
  const initiatives = items.filter((c) => c.kind === "initiative");
  const events = upcoming(items);
  const months = monthlyTargets
    .slice()
    .sort((a, b) => Number(a.month) - Number(b.month));
  return (
    <div className="temple-profile">
      <section>
        <h2>Monthly targets · {year}</h2>
        {months.length ? (
          <div className="month-targets">
            {months.map((goal) => {
              const month = Number(goal.month);
              const books = booksForMonth(byMonth, year, month);
              return (
                <Progress
                  key={goal.id}
                  value={books}
                  target={Number(goal.books)}
                  label={monthLabel(monthKey(year, month))}
                  sub="Books distributed against this month’s target"
                />
              );
            })}
          </div>
        ) : (
          <Empty title="Monthly targets will appear here">
            Monthly targets will appear here once a book target is set for each
            month from the portal.
          </Empty>
        )}
      </section>
      <section>
        <h2>Teams</h2>
        {teams.length ? (
          <TempleTeams teams={teams} />
        ) : (
          <Empty title="No teams listed yet">
            Teams and members can be added from the portal. Each team shows its
            team lead and every member by name.
          </Empty>
        )}
      </section>
      <section>
        <h2>Photographs</h2>
        {photos.length ? (
          <div className="photo-grid">
            {photos.map(({ item, src }) => {
              const figure = (
                <figure>
                  {/* Temple-supplied HTTPS images; any host is allowed. */}
                  <img src={src} alt={item.title} />
                  <figcaption>
                    <strong>{item.title}</strong>
                    {item.body && <span>{item.body}</span>}
                  </figcaption>
                </figure>
              );
              return (
                <Link key={item.id} href={`/stories/${item.id}`}>
                  {figure}
                </Link>
              );
            })}
          </div>
        ) : (
          <Empty title="Photographs will appear here">
            Photographs from published photos and short videos will appear here.
          </Empty>
        )}
      </section>
      <section>
        <h2>Testimonials</h2>
        {testimonials.length ? (
          <div className="testimonial-grid">
            {testimonials.map((t) => (
              <TestimonialCard
                key={t.id}
                item={t}
                temple={temple}
                centre={templeCentres.find((c) => c.id === t.centre_id)}
              />
            ))}
          </div>
        ) : (
          <Empty title="No testimonials yet">
            Distributor testimonials and recipient experiences from published
            stories will be shown here.
          </Empty>
        )}
      </section>
      <section>
        <h2>Local initiatives</h2>
        {initiatives.length ? (
          <div className="grid">
            {initiatives.map((i) => (
              <article key={i.id} className="card">
                <h3>{i.title}</h3>
                <p>{i.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="No local initiatives listed">
            Reading circles, college programmes and other temple efforts can be
            added from the portal.
          </Empty>
        )}
      </section>
      <section>
        <h2>Upcoming events</h2>
        {events.length ? (
          <div className="grid">
            {events.map((e) => {
              const inner = (
                <>
                  <span className="card-meta">
                    {when(e.starts_at)} UTC
                    {e.location ? ` · ${e.location}` : ""}
                  </span>
                  <h3>{e.title}</h3>
                  <p>{e.body.slice(0, 180)}</p>
                </>
              );
              return (
                <Link key={e.id} href={`/events/${e.id}`} className="card">
                  {inner}
                  <span className="card-go">
                    Event details <ArrowUpRight size={15} strokeWidth={1.6} />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <Empty title="No upcoming events">
            Training, festivals and sankirtan programmes for this temple will
            be listed here.
          </Empty>
        )}
      </section>
    </div>
  );
}
