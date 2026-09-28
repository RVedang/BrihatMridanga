import type { TeamMember, TempleTeam } from "./data";

export function normalizeTeamSearch(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function sameName(a: string, b: string) {
  return (
    a.trim().replace(/\s+/g, " ").toLowerCase() ===
    b.trim().replace(/\s+/g, " ").toLowerCase()
  );
}

const minorWords = new Set(["of", "to", "the", "and", "in", "for", "at"]);

/** Title-case words typed entirely in lower or upper case; leave mixed case and short acronyms. */
export function displayName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\p{L}[\p{L}\p{M}]*/gu, (word, offset: number, whole: string) => {
      const before = offset > 0 ? whole[offset - 1] : " ";
      const folded = word.toLocaleLowerCase("en");
      if (/['’]/.test(before) && word.length === 1) return folded;
      const lower = word === folded;
      const upper = word === word.toLocaleUpperCase("en") && word.length > 3;
      if (!lower && !upper) return word;
      if (/['’-]/.test(before)) return folded;
      if (offset > 0 && minorWords.has(folded)) return folded;
      return folded.charAt(0).toLocaleUpperCase("en") + folded.slice(1);
    });
}

// Spacing, hyphens and case vary between imports of the same team
// ("Akinchana Vittaya - 3", "Akinchana vittaya 3"); numbers still separate teams.
function teamKey(name: string) {
  return normalizeTeamSearch(name).replace(/ /g, "");
}

const honorifics = new Set([
  "prabhu",
  "prabhuji",
  "pr",
  "prji",
  "ji",
  "mataji",
  "mata",
  "bh",
  "bhakta",
  "bhaktin",
]);

// "Vasu" and "Vasu prabhu" in one roster are the same person.
function personKey(name: string) {
  const words = normalizeTeamSearch(name).split(" ").filter(Boolean);
  const core = words.filter((word) => !honorifics.has(word));
  return (core.length ? core : words).join(" ");
}

function teamMembers(team: TempleTeam) {
  const syntheticId = `coordinator-${team.id}`;
  // The Firebase import used the team name when no lead was supplied.
  // data.ts may turn that placeholder into a synthetic member. Keep actual
  // membership records, including a real person whose name matches the team.
  const placeholder = sameName(team.coordinator_name, team.name);
  const people: TeamMember[] = team.members
    .filter((member) => !(placeholder && member.id === syntheticId))
    .map((member) => ({ ...member }));
  let lead = people.find((member) => member.coordinator) ?? null;
  if (!lead && team.coordinator_name.trim() && !placeholder) {
    lead =
      people.find((member) => sameName(member.name, team.coordinator_name)) ??
      null;
    if (lead) lead.coordinator = true;
    else {
      lead = {
        id: syntheticId,
        name: team.coordinator_name.trim(),
        coordinator: true,
      };
      people.unshift(lead);
    }
  }
  return people;
}

function memberOrder(a: TeamMember, b: TeamMember) {
  return a.name.localeCompare(b.name, "en") || a.id.localeCompare(b.id);
}

export function teamDirectoryEntry(team: TempleTeam) {
  const unique = new Map<string, TeamMember>();
  for (const member of teamMembers(team)) {
    const key = personKey(member.name) || member.id;
    const existing = unique.get(key);
    if (!existing)
      unique.set(key, { ...member, name: displayName(member.name) });
    else {
      existing.coordinator ||= member.coordinator;
      if (member.name.trim().length > existing.name.length)
        existing.name = displayName(member.name);
    }
  }
  const people = [...unique.values()].sort(memberOrder);
  // Only a recorded lead is shown; the import has none for most teams.
  const lead = people.find((member) => member.coordinator) ?? null;
  for (const member of people) member.coordinator = member === lead;
  people.sort(
    (a, b) =>
      Number(b.coordinator) - Number(a.coordinator) || memberOrder(a, b),
  );
  const shown = { ...team, name: displayName(team.name) };
  return {
    team: shown,
    lead,
    people,
    search: normalizeTeamSearch(
      [shown.name, shown.centre_name, ...people.map((p) => p.name)].join(" "),
    ),
  };
}

/** Input is the roster of one temple. Merge repeated names only within a centre. */
export function teamDirectoryEntries(teams: TempleTeam[]) {
  const groups = new Map<string, { team: TempleTeam; best: number }>();
  for (const team of [...teams].sort((a, b) => a.id.localeCompare(b.id))) {
    const key = JSON.stringify([team.centre_id, teamKey(team.name)]);
    const members = teamMembers(team);
    const existing = groups.get(key);
    if (!existing)
      groups.set(key, {
        team: { ...team, coordinator_name: "", members },
        best: members.length,
      });
    else {
      existing.team.members.push(...members);
      // Name the merged team after the record with the fullest roster.
      if (members.length > existing.best) {
        existing.team.name = team.name;
        existing.best = members.length;
      }
    }
  }
  return [...groups.values()]
    .map(({ team }) => teamDirectoryEntry(team))
    .filter((entry) => entry.people.length > 0)
    .sort(
      (a, b) =>
        a.team.name.localeCompare(b.team.name, "en", {
          numeric: true,
          sensitivity: "base",
        }) ||
        (a.team.centre_name || "").localeCompare(
          b.team.centre_name || "",
          "en",
        ) ||
        a.team.id.localeCompare(b.team.id),
    );
}
