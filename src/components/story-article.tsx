import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Content, Temple } from "@/lib/data";
import { dateLabel } from "@/lib/dates";
import { StoryPhoto } from "@/components/story-photo";
import {
  communityStoryTypeLabel,
  videoEmbedUrl,
} from "@/lib/story-types";

export function StoryArticle({
  item,
  temple,
  more,
}: {
  item: Content;
  temple?: Temple;
  more: Content[];
}) {
  const paragraphs = item.body
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const published = item.created_at?.slice(0, 10);
  const embed = item.link_url ? videoEmbedUrl(item.link_url) : null;
  const meta = [
    item.language,
    item.temple_id ? temple?.name : "",
    item.temple_id ? temple?.country : "",
    published ? dateLabel(published) : "",
  ].filter(Boolean);

  return (
    <div className="container story-page">
      <Link className="text-link story-back" href="/stories">
        All stories
      </Link>
      <article
        className="story-article"
        lang={item.language === "Hindi" ? "hi" : "en"}
      >
        <div className="story-feature">
          <StoryPhoto src={item.image_url} alt={item.title} />
          <div className="story-copy">
            {item.kind === "community_story" ? (
              <p className="eyebrow">
                {communityStoryTypeLabel(item.story_type)}
              </p>
            ) : null}
            <h1>{item.title}</h1>
            {meta.length > 0 && <p className="story-meta">{meta.join(" · ")}</p>}
            {(paragraphs.length ? paragraphs : item.body ? [item.body] : []).map(
              (part, i) => (
                <p key={i}>{part}</p>
              ),
            )}
            {embed ? (
              <div className="story-video">
                <iframe
                  src={embed}
                  title={item.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : item.link_url ? (
              <a
                className="text-link"
                href={item.link_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Related reading <ArrowUpRight size={15} />
              </a>
            ) : null}
          </div>
        </div>
      </article>
      {more.length > 0 && (
        <section className="story-more">
          <p className="eyebrow">Continue reading</p>
          <div className="story-more-grid">
            {more.map((story) => (
              <Link
                key={story.id}
                className="story-more-card"
                href={`/stories/${story.id}`}
              >
                <StoryPhoto src={story.image_url} alt="" />
                <div>
                  <span>
                    {story.kind === "community_story"
                      ? communityStoryTypeLabel(story.story_type)
                      : story.language}
                  </span>
                  <h2>{story.title}</h2>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
