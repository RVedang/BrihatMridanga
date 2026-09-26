import { dateLabel } from "./dates";

export const communityStoryTypes = {
  distributor: "Distributor testimonials",
  recipient: "Recipient experiences",
  success: "Temple success stories",
  interview: "Devotee interviews",
  media: "Photos and short videos",
  miracle: "Book distribution miracle stories",
} as const;

export type CommunityStoryType = keyof typeof communityStoryTypes;

export function communityStoryTypeLabel(value: string | null | undefined) {
  if (!value) return "Story";
  return communityStoryTypes[value as CommunityStoryType] || "Story";
}

export function isCommunityStoryType(
  value: string,
): value is CommunityStoryType {
  return Object.hasOwn(communityStoryTypes, value);
}

export function isMediaStory(item: {
  kind: string;
  story_type?: string | null;
}) {
  return item.kind === "community_story" && item.story_type === "media";
}

export function isTestimonialStory(item: {
  kind: string;
  story_type?: string | null;
}) {
  return (
    item.kind === "community_story" &&
    (item.story_type === "distributor" || item.story_type === "recipient")
  );
}

export function storyImageSrc(item: {
  image_url?: string | null;
  link_url?: string | null;
}) {
  if (item.image_url) return item.image_url;
  const link = item.link_url || "";
  if (!link || videoEmbedUrl(link)) return "";
  return /^https:\/\//i.test(link) ? link : "";
}

export function videoEmbedUrl(url: string) {
  const youtube = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/i,
  );
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export function pickRandomStories<T>(items: T[], count: number) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function storySearchText(
  item: {
    title: string;
    body: string;
    language: string;
    temple_id: string | null;
    location?: string | null;
    person_name?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
  },
  temple?: { name: string; country: string; city?: string } | null,
) {
  const parts = [
    item.title,
    item.body,
    item.language,
    item.location || "",
    item.person_name || "",
  ];
  if (item.temple_id && temple) {
    parts.push(temple.name, temple.country, temple.city || "");
  }
  for (const stamp of [item.starts_at, item.ends_at]) {
    if (!stamp) continue;
    const day = stamp.slice(0, 10);
    parts.push(stamp, day);
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) parts.push(dateLabel(day));
  }
  return parts.filter(Boolean).join(" ").toLowerCase();
}
