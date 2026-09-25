export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}
export function validateRange(start: string, end: string) {
  if (!validDate(start) || !validDate(end))
    throw new Error("Choose valid start and end dates.");
  if (start > end)
    throw new Error("The end date must be on or after the start date.");
  return { start, end };
}
export function clampDate(value: string, min: string, max: string) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
export function annualRange(year = new Date().getUTCFullYear()) {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}
export function monthLabel(month: string) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
}
/** Every YYYY-MM between two dates (inclusive), so charts show empty months. */
export function monthsBetween(start: string, end: string) {
  const out: string[] = [];
  const cursor = new Date(`${start.slice(0, 7)}-01T00:00:00Z`),
    last = `${end.slice(0, 7)}`;
  while (cursor.toISOString().slice(0, 7) <= last && out.length < 600) {
    out.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return out;
}
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
