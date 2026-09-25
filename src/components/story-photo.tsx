export function StoryPhoto({
  src,
  alt,
  featured = false,
}: {
  src?: string | null;
  alt: string;
  featured?: boolean;
}) {
  return (
    <figure
      className={featured ? "story-photo is-featured" : "story-photo"}
    >
      {src ? (
        // User and sample photographs are arbitrary HTTPS URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} />
      ) : (
        <span className="story-photo-empty">Photograph</span>
      )}
    </figure>
  );
}
