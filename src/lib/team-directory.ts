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
    const existing = unique.get(member.id);
    if (existing) existing.coordinator ||= member.coordinator;
    else unique.set(member.id, member);
  }
  const people = [...unique.values()].sort(memberOrder);
  // Until a real coordinator is supplied, use the first listed member.
  const lead = people.find((member) => member.coordinator) ?? people[0] ?? null;
  for (const member of people) member.coordinator = member === lead;
  people.sort(
    (a, b) =>
      Number(b.coordinator) - Number(a.coordinator) || memberOrder(a, b),
  );
  return {
    team,
    lead,
    people,
    search: normalizeTeamSearch(
      [team.name, team.centre_name, ...people.map((p) => p.name)].join(" "),
    ),
  };
}

/** Input is the roster of one temple. Merge repeated names only within a centre. */
export function teamDirectoryEntries(teams: TempleTeam[]) {
  const groups = new Map<string, TempleTeam>();
  for (const team of [...teams].sort((a, b) => a.id.localeCompare(b.id))) {
    // Keep punctuation and numbers meaningful (e.g. Baldeva and Baldeva 1).
    const name = team.name
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("en");
    const key = JSON.stringify([team.centre_id, name]);
    const members = teamMembers(team);
    const existing = groups.get(key);
    if (existing) existing.members.push(...members);
    else groups.set(key, { ...team, coordinator_name: "", members });
  }
  return [...groups.values()]
    .map(teamDirectoryEntry)
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
