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

export function teamDirectoryEntry(team: TempleTeam) {
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
  people.sort(
    (a, b) =>
      Number(b.coordinator) - Number(a.coordinator) ||
      a.name.localeCompare(b.name, "en"),
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
