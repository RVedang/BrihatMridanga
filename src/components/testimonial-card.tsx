import Link from "next/link";
import { Quote } from "lucide-react";
import type { Content, Temple } from "@/lib/data";
import { storyByline } from "@/lib/story-byline";

export function TestimonialCard({
  item,
  temple,
}: {
  item: Content;
  temple?: Temple | null;
}) {
  const person = item.person_name?.trim() || "";
  const city = temple?.city?.trim() || "";
  const inner = (
    <>
      <Quote
        className="testimonial-mark"
        size={22}
        strokeWidth={1.6}
        aria-hidden
      />
      <p className="testimonial-quote">
        {item.body.length > 240 ? `${item.body.slice(0, 240)}…` : item.body}
      </p>
      <div className="testimonial-who">
        <strong>{person ? item.title : storyByline(item.title, city)}</strong>
        {person ? (
          <span className="testimonial-person">
            {storyByline(person, city)}
          </span>
        ) : null}
      </div>
    </>
  );
  const href =
    item.kind === "community_story" && !item.id.startsWith("sample-")
      ? `/stories/${item.id}`
      : temple
        ? `/temples/${temple.id}`
        : "";
  if (href) {
    return (
      <Link href={href} className="testimonial-card">
        {inner}
      </Link>
    );
  }
  return <blockquote className="testimonial-card">{inner}</blockquote>;
}
