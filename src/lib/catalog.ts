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

export type QuantityLine = { bookId: string; quantity: number };

export function normalizeBooks(
  rows: unknown,
  fallback: Book[] = [],
): Book[] {
  if (!Array.isArray(rows)) return fallback;
  const mapped: Book[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = String(r.id ?? "").trim();
    const name = String(r.name ?? "").trim();
    const category = r.category;
    if (
      !id ||
      !name ||
      typeof category !== "string" ||
      !Object.hasOwn(categoryLabels, category)
    )
      continue;
    const volumes = Number(r.volumes);
    mapped.push({
      id,
      name,
      language: String(r.language ?? "").trim(),
      price: Number(r.price) || 0,
      currency: "INR",
      score: Number(r.score) || 0,
      category: category as Category,
      volumes: Number.isFinite(volumes) && volumes >= 1 ? volumes : volumesInSet(name),
    });
  }
  return mapped.length ? mapped : fallback;
}

export function calculateDistribution(books: Book[], lines: QuantityLine[]) {
  const byId = new Map(books.map((book) => [String(book.id), book]));
  const categories: Record<Category, number> = {
    small: 0,
    medium: 0,
    big: 0,
    "m-big": 0,
  };
  let count = 0,
    sets = 0,
    hundredths = 0;
  const seen = new Set<string>();
  for (const line of lines) {
    const bookId = String(line.bookId);
    const book = byId.get(bookId);
    if (!book || seen.has(bookId))
      throw new Error("Select each valid book only once");
    const quantity = Number(line.quantity);
    const volumes = Number(book.volumes) || 1;
    const score = Number(book.score);
    if (
      !Number.isSafeInteger(quantity) ||
      quantity <= 0 ||
      quantity > 1_000_000
    )
      throw new Error("Quantity must be a whole number from 1 to 1,000,000");
    seen.add(bookId);
    count += quantity * volumes;
    if (volumes > 1) sets += quantity;
    hundredths += Math.round(score * 100) * quantity;
    categories[book.category] += quantity * volumes;
  }
  return { count, sets, points: hundredths / 100, categories };
}
