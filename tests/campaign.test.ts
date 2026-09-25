import test from "node:test";
import assert from "node:assert/strict";
import {
  booksFrom,
  booksForMonth,
  campaignGoal,
  participationCopy,
  partitionCampaigns,
} from "../src/lib/campaign";

const campaign = (extra: Record<string, unknown> = {}) => ({
  id: "c1",
  name: "December",
  description: "",
  temple_id: "t1",
  starts_on: "2026-12-01",
  ends_on: "2026-12-31",
  fallback_year: null,
  instructions: "",
  target_books: null,
  ...extra,
});

test("campaign live progress prefers the campaign target, then temple, then movement-wide", () => {
  const targets = [
    { id: "g1", year: 2026, temple_id: null, books: 10000 },
    { id: "g2", year: 2026, temple_id: "t1", books: 400 },
  ];
  assert.deepEqual(campaignGoal(campaign({ target_books: 250 }), targets), {
    books: 250,
    label: "Campaign target",
  });
  assert.deepEqual(campaignGoal(campaign(), targets), {
    books: 400,
    label: "Temple target · 2026",
  });
  assert.deepEqual(campaignGoal(campaign({ temple_id: null }), targets), {
    books: 10000,
    label: "Movement-wide target · 2026",
  });
  assert.equal(campaignGoal(campaign({ starts_on: "2025-01-01" }), targets), null);
  assert.equal(
    booksFrom([
      { books: 3 },
      { books: 2 },
    ]),
    5,
  );
  assert.equal(
    booksForMonth(
      [
        { month: "2026-01", books: 12 },
        { month: "2026-02", books: 40 },
      ],
      2026,
      2,
    ),
    40,
  );
  assert.equal(booksForMonth([], 2026, 3), 0);
});

test("regional campaigns include temple-only participation guidance", () => {
  const regional = participationCopy(campaign({ instructions: "Meet at 5am." }), "Mayapur");
  assert.equal(regional.custom, "Meet at 5am.");
  assert.ok(regional.steps.some((s) => s.includes("Mayapur")));
  const shared = participationCopy(campaign({ temple_id: null, fallback_year: 2026 }));
  assert.ok(shared.steps.some((s) => s.includes("Whole-Year Marathon")));
});

test("regional campaigns appear in the dashboard list only after a temple is chosen", () => {
  const temples = [
    { id: "t1", country: "India" },
    { id: "t2", country: "Nepal" },
  ];
  const list = [
    campaign({ id: "m", temple_id: null, name: "Gita Jayanti" }),
    campaign({ id: "r1", temple_id: "t1", name: "Mayapur December" }),
    campaign({ id: "r2", temple_id: "t2", name: "Kathmandu" }),
  ];
  const open = partitionCampaigns(list, temples);
  assert.equal(open.movement.length, 1);
  assert.deepEqual(open.regional.map((c) => c.id), []);
  const forCountry = partitionCampaigns(list, temples, "India");
  assert.deepEqual(forCountry.regional.map((c) => c.id), []);
  const forTemple = partitionCampaigns(list, temples, "India", "t1");
  assert.equal(forTemple.movement.length, 1);
  assert.deepEqual(
    forTemple.regional.map((c) => c.id),
    ["r1"],
  );
});
