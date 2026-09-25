export const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Kathmandu",
  "Asia/Dhaka",
  "Asia/Colombo",
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Jakarta",
  "Asia/Bangkok",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Johannesburg",
  "Africa/Nairobi",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "UTC",
];

export function isValidTimeZone(zone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return zone.length > 0;
  } catch {
    return false;
  }
}
