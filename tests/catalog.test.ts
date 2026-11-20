import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { parseCatalog, volumesInSet } from "../src/lib/catalog";
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
