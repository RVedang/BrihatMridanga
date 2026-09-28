import assert from "node:assert/strict";
import test from "node:test";
import type { TempleTeam } from "../src/lib/data";
import {
  displayName,
  normalizeTeamSearch,
  teamDirectoryEntry,
  teamDirectoryEntries,
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

test("a team without a recorded lead shows no lead and invents no one", () => {
  const entry = teamDirectoryEntry(
    team({
      coordinator_name: "",
      members: [{ id: "person-1", name: "Shriraj", coordinator: false }],
    }),
  );
  assert.equal(entry.lead, null);
  assert.equal(entry.people[0].coordinator, false);
  assert.equal(entry.people.length, 1);
  assert.equal(teamDirectoryEntry(team()).people.length, 0);
});

test("duplicate team rows combine their rosters once without inventing a lead", () => {
  const teams = [
    team({
      id: "team-2",
      name: "Dāsānudāsa",
      coordinator_name: "Dāsānudāsa",
      members: [
        { id: "kunal", name: "Kunal", coordinator: false },
        { id: "abhay", name: "Abhay", coordinator: false },
        { id: "coordinator-team-2", name: "Dāsānudāsa", coordinator: true },
      ],
    }),
    team({
      id: "team-1",
      name: "  DASANUDASA ",
      coordinator_name: "DASANUDASA",
      members: [
        { id: "abhay", name: "Abhay", coordinator: false },
        { id: "kunal", name: "Kunal", coordinator: false },
        { id: "coordinator-team-1", name: "DASANUDASA", coordinator: true },
      ],
    }),
  ];
  const original = structuredClone(teams);
  const entries = teamDirectoryEntries(teams);
  assert.equal(entries.length, 1);
  assert.deepEqual(
    entries[0].people.map((p) => p.name),
    ["Abhay", "Kunal"],
  );
  assert.equal(entries[0].lead, null);
  assert.equal(entries[0].people.filter((p) => p.coordinator).length, 0);
  assert.deepEqual(teamDirectoryEntries([...teams].reverse()), entries);
  assert.deepEqual(teams, original);
});

test("merging retains additional members and a supplied coordinator", () => {
  const entries = teamDirectoryEntries([
    team({
      id: "a",
      name: "Madanmohan",
      coordinator_name: "Madanmohan",
      members: [{ id: "aanand", name: "Aanand", coordinator: false }],
    }),
    team({
      id: "b",
      name: "MadanMohan",
      coordinator_name: "Harshal",
      members: [
        { id: "aanand", name: "Aanand", coordinator: false },
        { id: "harshal", name: "Harshal", coordinator: false },
        { id: "rama", name: "Rama", coordinator: false },
      ],
    }),
  ]);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].people.length, 3);
  assert.equal(entries[0].lead?.name, "Harshal");
  assert.ok(entries[0].search.includes("rama"));
});

test("different centres and numbered teams stay separate; empty teams remain hidden", () => {
  const members = [{ id: "p", name: "Abhay", coordinator: false }];
  const entries = teamDirectoryEntries([
    team({ id: "a", members }),
    team({ id: "b", members, centre_id: "powai" }),
    team({ id: "c", members, name: "Baldeva 2", coordinator_name: "Baldeva 2" }),
    team({ id: "d", name: "Empty", coordinator_name: "Empty" }),
  ]);
  assert.equal(entries.length, 3);
  assert.ok(entries.every((entry) => entry.lead === null));
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

test("the same name listed twice in one team appears once and keeps the lead", () => {
  const entry = teamDirectoryEntry(
    team({
      coordinator_name: "Nilesh",
      members: [
        { id: "person-1", name: "Nilesh", coordinator: true },
        { id: "person-2", name: "Nilesh", coordinator: false },
      ],
    }),
  );
  assert.equal(entry.people.length, 1);
  assert.equal(entry.lead?.id, "person-1");
});

test("team names differing only in case, spacing or hyphens merge; numbers stay apart", () => {
  const entries = teamDirectoryEntries([
    team({ id: "a", name: "Akinchana Vittaya - 3", coordinator_name: "Akinchana Vittaya - 3",
      members: [{ id: "vasu", name: "Vasu", coordinator: false }, { id: "raj", name: "Raj", coordinator: false }] }),
    team({ id: "b", name: "Akinchana vittaya 3", coordinator_name: "Akinchana vittaya 3",
      members: [{ id: "vasu-2", name: "Vasu prabhu", coordinator: false }] }),
    team({ id: "c", name: "Akinchana Vittaya 4", coordinator_name: "Akinchana Vittaya 4",
      members: [{ id: "k", name: "Kunal", coordinator: false }] }),
  ]);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].team.name, "Akinchana Vittaya - 3");
  assert.deepEqual(entries[0].people.map((p) => p.name), ["Raj", "Vasu Prabhu"]);
});

test("names typed in all lower or upper case are tidied; mixed case is kept", () => {
  assert.equal(displayName("  aniket "), "Aniket");
  assert.equal(displayName("YASH PRAJAPATI"), "Yash Prajapati");
  assert.equal(displayName("ABD"), "ABD");
  assert.equal(displayName("MadanMohan"), "MadanMohan");
  assert.equal(displayName("servants of prabhupada"), "Servants of Prabhupada");
  assert.equal(displayName("nama-hatta"), "Nama-hatta");
  assert.equal(displayName("PRABHUPADA'S DASA"), "Prabhupada's Dasa");
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
