import test from "node:test";
import assert from "node:assert/strict";
import { excerpt } from "../src/lib/excerpt";

test("excerpt keeps a short passage whole", () => {
  assert.equal(excerpt("A whole sentence.", 40), "A whole sentence.");
});

test("excerpt stops before a word that does not fit", () => {
  assert.equal(excerpt("felt it was raining", 10), "felt it…");
});

test("excerpt omits a single word that is longer than the limit", () => {
  assert.equal(excerpt("Supercalifragilistic", 8), "");
});
