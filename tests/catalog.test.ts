import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { parseCatalog, calculateDistribution, volumesInSet, normalizeBooks } from "../src/lib/catalog";
import { clampDate, validateRange } from "../src/lib/dates";
const source = readFileSync("docs/books-data.txt", "utf8"),
  books = parseCatalog(source);
test("all 176 supplied catalog records survive without rate or category normalization", () => {
  assert.equal(books.length, 176);
  assert.equal(new Set(books.map((b) => b.id)).size, 176);
  assert.equal(new Set(books.map((b) => b.language)).size, 12);
  assert.deepEqual(
    books,
    JSON.parse(readFileSync("src/data/books.json", "utf8")),
  );
  assert.equal(books.find((b) => b.id === "160")?.score, 10.5);
  assert.equal(books.find((b) => b.id === "160")?.category, "big");
  assert.equal(books.find((b) => b.id === "188")?.category, "m-big");
  assert.equal(books.find((b) => b.id === "290")?.volumes, 18);
  assert.equal(books.find((b) => b.id === "285")?.volumes, 18);
  assert.equal(books.find((b) => b.id === "287")?.volumes, 30);
  assert.equal(books.find((b) => b.id === "151")?.volumes, 10);
  assert.equal(books.find((b) => b.id === "130")?.volumes, 9);
  assert.equal(books.find((b) => b.id === "298")?.volumes, 2);
  assert.equal(volumesInSet("Beyond Birth and Death"), 1);
});
test("database catalog rows coerce ids and scores so the summary can calculate", () => {
  const [set] = normalizeBooks([
    {
      id: 290,
      name: "Srimad Bhagavatam Set",
      language: "English",
      price: "0",
      score: "12.5",
      category: "m-big",
      volumes: "18",
    },
  ]);
  const result = calculateDistribution([set], [{ bookId: "290", quantity: 2 }]);
  assert.equal(set.id, "290");
  assert.equal(result.count, 36);
  assert.equal(result.sets, 2);
  assert.equal(result.points, 25);
  assert.equal(normalizeBooks([], books).length, 176);
});
test("set quantity adds every volume to books and records the number of sets", () => {
  const result = calculateDistribution(books, [
    { bookId: "290", quantity: 1 },
    { bookId: "130", quantity: 1 },
    { bookId: "167", quantity: 3 },
    { bookId: "195", quantity: 3 },
  ]);
  assert.equal(result.count, 33);
  assert.equal(result.sets, 2);
  assert.equal(result.points, 55.05);
  assert.equal(
    books.find((b) => b.id === "173")?.name,
    "Dharma: The Way of Transcendence",
  );
});
test("invalid catalog IDs, duplicate lines and invalid quantities fail", () => {
  assert.throws(() => parseCatalog(source + "\n" + source.split("\n")[0]));
  for (const quantity of [-1, 0, 1.2, NaN, 1_000_001])
    assert.throws(() =>
      calculateDistribution(books, [{ bookId: "195", quantity }]),
    );
  assert.throws(() =>
    calculateDistribution(books, [{ bookId: "missing", quantity: 1 }]),
  );
  assert.throws(() =>
    calculateDistribution(books, [
      { bookId: "195", quantity: 1 },
      { bookId: "195", quantity: 2 },
    ]),
  );
});
test("date ranges accept same-day and leap dates, reject impossible or reversed dates", () => {
  assert.deepEqual(validateRange("2024-02-29", "2024-02-29"), {
    start: "2024-02-29",
    end: "2024-02-29",
  });
  for (const [a, b] of [
    ["2025-02-29", "2025-03-01"],
    ["2025-12-31", "2025-01-01"],
    ["invalid", "2025-01-01"],
  ])
    assert.throws(() => validateRange(a, b));
  assert.equal(clampDate("2026-09-19", "2026-09-20", "2026-09-21"), "2026-09-20");
  assert.equal(clampDate("2026-09-22", "2026-09-20", "2026-09-21"), "2026-09-21");
  assert.equal(clampDate("2026-09-21", "2026-09-20", "2026-09-21"), "2026-09-21");
});
