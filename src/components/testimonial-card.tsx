import Link from "next/link";
import { Quote } from "lucide-react";
import type { Content, RecordItem, Temple } from "@/lib/data";

export function placeLabel(
  temple?: Temple | null,
  centre?: RecordItem | null,
) {
  if (centre && temple) return `${centre.name} · ${temple.name}`;
  if (temple) return temple.name;
  return "";
}

export function TestimonialCard({
  item,
  temple,
  centre,
}: {
  item: Content;
  temple?: Temple | null;
  centre?: RecordItem | null;
}) {
  const place = placeLabel(temple, centre);
  const person = item.person_name?.trim() || "";
  const inner = (
    <>
      <Quote className="testimonial-mark" size={22} strokeWidth={1.6} aria-hidden />
      <p className="testimonial-quote">
        {item.body.length > 240 ? `${item.body.slice(0, 240)}…` : item.body}
      </p>
      <div className="testimonial-who">
        <strong>{item.title}</strong>
        {place ? <span>{place}</span> : null}
        {person ? <span>{person}</span> : null}
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
