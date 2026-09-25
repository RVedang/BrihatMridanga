import { readFile, mkdir, writeFile } from "node:fs/promises";
import { parseCatalog } from "../src/lib/catalog";
const source = await readFile("docs/books-data.txt", "utf8");
const books = parseCatalog(source);
await mkdir("src/data", { recursive: true });
await mkdir("supabase/migrations", { recursive: true });
await writeFile("src/data/books.json", JSON.stringify(books, null, 2) + "\n");
const quote = (value: string) => "'" + value.replaceAll("'", "''") + "'";
const rows = books.map(
  (b) =>
    `(${quote(b.id)}, ${quote(b.name)}, ${quote(b.language)}, ${b.price}, 'INR', ${b.score}, ${quote(b.category)})`,
);
await writeFile(
  "supabase/migrations/202609180002_catalog.sql",
  "-- Generated from docs/books-data.txt. Preserve supplied IDs, scores and categories.\ninsert into public.books (id, name, language, price, currency, score, category) values\n" +
    rows.join(",\n") +
    ";\n",
);
console.log(
  `Validated and generated ${books.length} books, ${new Set(books.map((b) => b.language)).size} languages. Source unchanged.`,
);
