import { shiftDate, validDate } from "./dates";

export const weeklyCategories = [
  [
    "magazines",
    "Magazines",
    "10–50 pages. Examples include Krishna Voice and BTG.",
  ],
  [
    "small",
    "Small Books",
    "50–150 pages. Examples include PQPA and Raj Vidya.",
  ],
  ["medium", "Medium Books", "150–300 pages. Examples include POP and POY."],
  ["big", "Big Books", "300–500 pages. Examples include SSR and JOSD."],
  [
    "mahaBig",
    "Maha Big Books",
    "500+ pages. Examples include BG, KB and SB 1st canto.",
  ],
  ["sbSets", "Full SB Sets", ""],
  ["ccSets", "Full CC Sets", ""],
  ["lifePatronSets", "Life Patron Membership Sets", ""],
] as const;

type Category = (typeof weeklyCategories)[number][0];
export type Quantities = Record<Category, number>;

export function emptyQuantities(): Quantities {
  return {
    magazines: 0,
    small: 0,
    medium: 0,
    big: 0,
    mahaBig: 0,
    sbSets: 0,
    ccSets: 0,
    lifePatronSets: 0,
  };
}

function wholeNumber(value: number) {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error("Expected a non-negative whole number.");
  return value;
}

export function weeklyTotals(q: Quantities, pendingBooks = 0) {
  for (const [key] of weeklyCategories) wholeNumber(q[key]);
  const books =
    q.magazines +
    q.small +
    q.medium +
    q.big +
    q.mahaBig +
    wholeNumber(pendingBooks);
  return {
    books: wholeNumber(books),
    sets: wholeNumber(q.sbSets + q.ccSets + q.lifePatronSets),
  };
}

export function reportingMonday(date: string) {
  if (!validDate(date)) throw new Error("Invalid reporting date.");
  const day = new Date(date + "T00:00:00Z").getUTCDay();
  return shiftDate(date, 0, -((day + 6) % 7));
}

export function coordinatorDeadline(submittedDate: string) {
  if (!validDate(submittedDate)) throw new Error("Invalid submission date.");
  const date = new Date(submittedDate + "T00:00:00Z");
  const day = date.getUTCDate();
  date.setUTCMonth(date.getUTCMonth() + 2, 0);
  date.setUTCDate(Math.min(day, date.getUTCDate()));
  return date.toISOString().slice(0, 10);
}

export const weeklyCategoryLabels: Record<string, string> = Object.fromEntries(
  weeklyCategories.map(([key, label]) => [key, label]),
);
const pointHundredths: Record<Category, number> = {
  magazines: 10,
  small: 25,
  medium: 50,
  big: 100,
  mahaBig: 200,
  sbSets: 3600,
  ccSets: 1800,
  lifePatronSets: 650,
};
export function distributionPoints(q: Quantities) {
  return (
    weeklyCategories.reduce(
      (total, [key]) => total + wholeNumber(q[key]) * pointHundredths[key],
      0,
    ) / 100
  );
}
export function formatPoints(points: number) {
  return Number(points).toFixed(2);
}
