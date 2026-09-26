import type { Content, Temple } from "@/lib/data";
import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { StoryRail } from "@/components/story-rail";
import { Empty, SectionTitle } from "@/components/ui";
import { StoryPhoto } from "@/components/story-photo";
import styles from "./home-stories.module.css";
import {
  communityStoryTypeLabel,
  communityStoryTypes,
  pickRandomStories,
  storyImageSrc,
} from "@/lib/story-types";

function StoryCard({ item, temple }: { item: Content; temple?: Temple }) {
  const place = item.temple_id
    ? [temple?.name, temple?.country].filter(Boolean).join(" · ")
    : "";
  const person = item.person_name?.trim() || "";
  return (
    <Link href={`/stories/${item.id}`} className="card">
      <StoryPhoto src={item.image_url} alt={item.title} />
      <span className="card-meta">
        {[item.language, place].filter(Boolean).join(" · ")}
      </span>
      <h3>{item.title}</h3>
      {person ? <p className="card-person">{person}</p> : null}
      <p>{item.body.slice(0, 160)}</p>
      <span className="card-go">
        Read more <ArrowUpRight size={15} strokeWidth={1.6} />
      </span>
    </Link>
  );
}

function TypeSection({
  title,
  items,
  temples,
  empty,
  hideEmpty,
}: {
  title: string;
  items: Content[];
  temples: Temple[];
  empty: string;
  hideEmpty?: boolean;
}) {
  if (hideEmpty && !items.length) return null;
  return (
    <section>
      {items.length ? (
        <StoryRail title={title}>
          {items.map((item) => (
            <StoryCard
              key={item.id}
              item={item}
              temple={
                item.temple_id
                  ? temples.find((temple) => temple.id === item.temple_id)
                  : undefined
              }
            />
          ))}
        </StoryRail>
      ) : (
        <Empty title={`No ${title.toLowerCase()} yet`}>{empty}</Empty>
      )}
    </section>
  );
}

export function StorySections({
  items,
  temples,
  hideEmpty = true,
  emptyTitle = "No matching stories",
  emptyBody = "Try another title, temple or country.",
}: {
  items: Content[];
  temples: Temple[];
  hideEmpty?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const groups = Object.entries(communityStoryTypes).map(
    ([key, label]) =>
      [
        key,
        label,
        items.filter(
          (item) => item.kind === "community_story" && item.story_type === key,
        ),
      ] as const,
  );
  const visible = hideEmpty
    ? groups.filter(([, , group]) => group.length)
    : groups;
  if (hideEmpty && !visible.length)
    return (
      <Empty title={emptyTitle}>{emptyBody}</Empty>
    );
  return (
    <div className="stories-board">
      {visible.map(([key, label, group]) => (
        <TypeSection
          key={key}
          title={label}
          items={group}
          temples={temples}
          hideEmpty={hideEmpty}
          empty="More stories will appear here as they are published."
        />
      ))}
    </div>
  );
}

export function HomeStories({ items }: { items: Content[] }) {
  const chosen = pickRandomStories(
    items.filter((item) => item.kind === "community_story"),
    4,
  );
  return (
    <section className={styles.section} aria-label="Sankirtan stories">
      <SectionTitle
        title="Sankirtan stories"
        href="/stories"
        link="All stories"
      />
      {chosen.length ? (
        <div className={styles.grid}>
          {chosen.map((story, index) => {
            const src = storyImageSrc(story);
            return (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className={`${styles.story} ${index === 0 ? styles.lead : ""} ${!src ? styles.textOnly : ""}`}
                data-reveal
              >
                {src && (
                  <div className={styles.photo}>
                    <StoryPhoto src={src} alt="" />
                  </div>
                )}
                <div className={styles.copy}>
                  <p className="eyebrow">
                    {communityStoryTypeLabel(story.story_type)}
                  </p>
                  {story.person_name?.trim() ? (
                    <p className={styles.person}>{story.person_name.trim()}</p>
                  ) : null}
                  {!src && (
                    <BookOpen
                      className={styles.symbol}
                      size={30}
                      strokeWidth={1.2}
                      aria-hidden="true"
                    />
                  )}
                  <h3>{story.title}</h3>
                  <p className={styles.excerpt}>
                    {story.body.slice(0, index === 0 ? 180 : 120)}
                    {story.body.length > (index === 0 ? 180 : 120) ? "…" : ""}
                  </p>
                  <span className={styles.read}>
                    Read more <ArrowUpRight size={17} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty title="A place for your stories">
          Experiences from temples and book distribution teams will be shared
          here as they are published.
        </Empty>
      )}
    </section>
  );
}
