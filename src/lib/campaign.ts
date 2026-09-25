type Campaign = {
  id?: string;
  name?: string;
  temple_id: string | null;
  starts_on: string;
  fallback_year: number | null;
  instructions?: string | null;
  target_books?: number | null;
};
type Score = { books: number };
type Target = { year: number; temple_id: string | null; books: number };
type MonthScore = { month: string; books: number };

export function booksFrom(rows: Score[]) {
  return rows.reduce((sum, row) => sum + Number(row.books), 0);
}

export function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function booksForMonth(rows: MonthScore[], year: number, month: number) {
  const key = monthKey(year, month);
  return Number(
    rows.find((row) => String(row.month).slice(0, 7) === key)?.books || 0,
  );
}

  /** Book target shown as live progress: campaign target first, then the
   *  temple target, then the movement-wide target. */
export function campaignGoal(
  campaign: Campaign,
  targets: Target[],
): { books: number; label: string } | null {
  if (campaign.target_books)
    return { books: Number(campaign.target_books), label: "Campaign target" };
  const year = Number(campaign.starts_on.slice(0, 4));
  if (campaign.temple_id) {
    const temple = targets.find(
      (t) => t.year === year && t.temple_id === campaign.temple_id,
    );
    if (temple)
      return {
        books: Number(temple.books),
        label: `Temple target · ${year}`,
      };
  }
  const movement = targets.find(
    (t) => t.year === year && t.temple_id === null,
  );
  if (movement)
    return {
      books: Number(movement.books),
      label: `Movement-wide target · ${year}`,
    };
  return null;
}

export function participationCopy(
  campaign: Campaign,
  templeName?: string,
) {
  const custom = campaign.instructions?.trim();
  const regional = campaign.temple_id
    ? `This is a regional campaign for ${templeName || "one temple"} only. Reports from other temples cannot be filed against it.`
    : "This is a movement-wide campaign. Any participating temple can file reports against it.";
  const automatic = campaign.fallback_year
    ? "Leave Campaign as Whole-Year Marathon when publishing. Ordinary distributions outside a special campaign are counted here."
    : "When publishing a distribution, choose this campaign. The distribution date must fall between the campaign start and end dates.";
  return {
    custom,
    steps: [
      "Sign in to the temple portal.",
      automatic,
      "Enter the books (each volume in a set counts as one book) and publish.",
      regional,
    ],
  };
}

export function partitionCampaigns<
  C extends { temple_id: string | null },
  T extends { id: string; country: string },
>(campaigns: C[], _temples: T[], _country?: string, templeId?: string) {
  return {
    movement: campaigns.filter((c) => !c.temple_id),
    regional: templeId
      ? campaigns.filter((c) => c.temple_id === templeId)
      : [],
  };
}
