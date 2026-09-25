export function ContentFilters({
  section,
  q,
}: {
  section: string;
  q?: string;
}) {
  return (
    <form className="filter-bar" method="get" action={`/${section}`}>
      <label className="search-field">
        Search {section}
        <input
          name="q"
          defaultValue={q}
          placeholder={
            section === "stories"
              ? "Title, temple or country"
              : section === "events"
                ? "Title, location or temple"
                : "Title or language"
          }
        />
      </label>
      <button className="button" type="submit">
        Search
      </button>
    </form>
  );
}
