import assert from "node:assert/strict";
import test from "node:test";
import type { TempleTeam } from "../src/lib/data";
import {
  normalizeTeamSearch,
  teamDirectoryEntry,
} from "../src/lib/team-directory";

function team(overrides: Partial<TempleTeam> = {}): TempleTeam {
  return {
    id: "team-1",
    name: "Baldeva 1",
    centre_id: "airoli",
    centre_name: "Folk Airoli",
    coordinator_name: "Baldeva 1",
    members: [],
    ...overrides,
  };
}

test("imported team-name placeholders are not people or confirmed leads", () => {
  const entry = teamDirectoryEntry(
    team({
      members: [
        { id: "coordinator-team-1", name: "Baldeva 1", coordinator: true },
        { id: "person-1", name: "Shriraj", coordinator: false },
        { id: "person-2", name: "Nilesh", coordinator: false },
      ],
    }),
  );
  assert.equal(entry.lead, null);
  assert.equal(entry.people.length, 2);
  assert.deepEqual(entry.people.map((person) => person.id).sort(), [
    "person-1",
    "person-2",
  ]);
});

test("placeholder detection tolerates capitalization and whitespace", () => {
  const entry = teamDirectoryEntry(
    team({
      coordinator_name: "  BALDEVA   1  ",
      members: [
        { id: "coordinator-team-1", name: "BALDEVA 1", coordinator: true },
      ],
    }),
  );
  assert.equal(entry.lead, null);
  assert.equal(entry.people.length, 0);
});

test("missing lead does not promote the first member or invent a person", () => {
  const entry = teamDirectoryEntry(
    team({
      coordinator_name: "",
      members: [{ id: "person-1", name: "Shriraj", coordinator: false }],
    }),
  );
  assert.equal(entry.lead, null);
  assert.equal(entry.people.length, 1);
  assert.equal(teamDirectoryEntry(team()).people.length, 0);
});

test("an actual roster lead can share the team name", () => {
  const entry = teamDirectoryEntry(
    team({
      name: "Shyam",
      coordinator_name: "Shyam",
      members: [{ id: "person-1", name: "Shyam", coordinator: true }],
    }),
  );
  assert.equal(entry.lead?.id, "person-1");
  assert.equal(entry.people.length, 1);
});

test("a separately named coordinator is retained once and sorted first", () => {
  const source = team({
    coordinator_name: "Nilesh",
    members: [
      { id: "person-1", name: "Akash", coordinator: false },
      { id: "person-2", name: "Nilesh", coordinator: false },
    ],
  });
  const original = structuredClone(source);
  const entry = teamDirectoryEntry(source);
  assert.equal(entry.lead?.id, "person-2");
  assert.equal(entry.people[0].name, "Nilesh");
  assert.equal(entry.people.length, 2);
  assert.deepEqual(source, original);
  const withoutMembership = teamDirectoryEntry(
    team({ coordinator_name: "Nilesh" }),
  );
  assert.equal(withoutMembership.lead?.name, "Nilesh");
  assert.equal(withoutMembership.people.length, 1);
});

test("distinct members with the same name are preserved", () => {
  const entry = teamDirectoryEntry(
    team({
      coordinator_name: "Nilesh",
      members: [
        { id: "person-1", name: "Nilesh", coordinator: true },
        { id: "person-2", name: "Nilesh", coordinator: false },
      ],
    }),
  );
  assert.equal(entry.people.length, 2);
});

test("search handles accents, punctuation, centres and member names", () => {
  const entry = teamDirectoryEntry(
    team({
      name: "Rādhā Mādhav - 3",
      members: [{ id: "person-1", name: "Shriraj", coordinator: false }],
    }),
  );
  assert.equal(normalizeTeamSearch(" RĀDHĀ  Mādhav - 3 "), "radha madhav 3");
  assert.ok(entry.search.includes("radha madhav 3"));
  assert.ok(entry.search.includes("folk airoli"));
  assert.ok(entry.search.includes("shriraj"));
});
