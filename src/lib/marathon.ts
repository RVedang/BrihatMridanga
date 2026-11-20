export const marathonName = "Book Distribution Marathon 2026";
export type MarathonTemple = {
  name: string;
  city: string;
  lat: number;
  lon: number;
  spoc: string;
  email: string;
  phone: string;
  country: string;
};
export type Standing = {
  rank: number;
  name: string;
  books: number;
  sets: number;
  points: number;
};
export function contactName(name: string): string {
  if (name === "Srinivasan M Srikant Govinda Das Cong Vrn") {
    return "Srikant Govinda Dasa";
  }
  if (name === "GRGD Girdhar Gopal Dasa") {
    return "Girdhar Gopal Dasa";
  }
  if (name === "Prema Rasa Dasa Pr./ Prashanth") {
    return "Prema Rasa Dasa";
  }
  if (name.includes("/")) {
    return name
      .split(/(\s*\/\s*)/)
      .map((part, index) => (index % 2 === 0 ? contactName(part) : part))
      .join("");
  }
  let normalized = name;
  if (/\s+(?:Prabhu|Pr\.?)$/i.test(name)) {
    const base = name.replace(/\s+(?:Prabhu|Pr\.?)$/i, "");
    normalized = /\s+Dasa$/i.test(base)
      ? base
      : /\s+Das$/i.test(base)
        ? base.replace(/\s+Das$/i, " Dasa")
        : `${base} Dasa`;
  }
  return normalized.replace(/\s+Das$/i, " Dasa").replace(/\p{L}+/gu, (word) =>
    /^[A-Z]{2,4}$/.test(word) && !/^(?:DAS|DASA)$/.test(word)
      ? word
      : word[0].toLocaleUpperCase() + word.slice(1).toLocaleLowerCase(),
  );
}
export function phoneLink(temple: MarathonTemple) {
  const digits = temple.phone.replace(/\D/g, "");
  return (
    "tel:+" +
    (temple.country === "India" && digits.length === 10 ? "91" : "") +
    digits
  );
}
export function nearestTemple(
  temples: MarathonTemple[],
  lat: number,
  lon: number,
) {
  const radians = (n: number) => (n * Math.PI) / 180;
  const distance = (t: MarathonTemple) =>
    Math.sin(radians(t.lat - lat) / 2) ** 2 +
    Math.cos(radians(lat)) *
      Math.cos(radians(t.lat)) *
      Math.sin(radians(t.lon - lon) / 2) ** 2;
  return temples.reduce<MarathonTemple | undefined>(
    (best, t) => (!best || distance(t) < distance(best) ? t : best),
    undefined,
  );
}
