export const categoryLabels = {
  small: "Small",
  medium: "Medium",
  big: "Big",
  "m-big": "Maha Big",
} as const;
export type Category = keyof typeof categoryLabels;
export function categoryLabel(category: string | null | undefined) {
  if (!category) return "";
  if (category === "m-big") return categoryLabels["m-big"];
  return (
    categoryLabels[category as Category] ??
    category
  );
}
export type Book = {
  id: string;
  name: string;
  language: string;
  price: number;
  currency: "INR";
  score: number;
  category: Category;
  volumes: number;
};

/** Physical books in one catalog quantity. Titles that name a set or volume count expand; others are one book. */
export function volumesInSet(name: string): number {
  const volumes = name.match(/(\d+)\s*volumes?/i);
  if (volumes) return Number(volumes[1]);
  const vol = name.match(/\((\d+)\s*Vol\.?\)/i);
  if (vol) return Number(vol[1]);
  if (/Vol\.?\s*1\s*&\s*Vol\.?\s*2/i.test(name)) return 2;
  if (/Srimad Bhagavatam Set/i.test(name)) return 18;
  return 1;
}

export function parseCatalog(source: string): Book[] {
  const seen = new Set<string>();
  return source
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line, index) => {
      const fields = line.split("\t");
      if (fields.length !== 5)
        throw new Error(
          `Catalog row ${index + 1}: expected five tab-separated fields`,
        );
      const [id, rawName, language, rawPrice, rawMetadata] = fields;
      const meta = JSON.parse(rawMetadata);
      const price = Number(rawPrice);
      if (
        !/^\d+$/.test(id) ||
        seen.has(id) ||
        !rawName.trim() ||
        !language.trim() ||
        !rawPrice.trim() ||
        !Number.isFinite(price) ||
        price < 0 ||
        typeof meta.score !== "number" ||
        !Number.isFinite(meta.score) ||
        meta.score < 0 ||
        !Object.hasOwn(categoryLabels, meta.category)
      )
        throw new Error(`Catalog row ${index + 1}: invalid or duplicate book`);
      // The supplied catalog uses at most two decimal places; reject rather than silently round future rates.
      if (Math.abs(meta.score * 100 - Math.round(meta.score * 100)) > 1e-8)
        throw new Error("Unsupported score precision");
      seen.add(id);
      const name = rawName.trim();
      return {
        id,
        name,
        language: language.trim(),
        price,
        currency: "INR",
        score: meta.score,
        category: meta.category,
        volumes: volumesInSet(name),
      };
    });
}
