import type { TempleTeam } from "@/lib/data";

function leadAndMembers(team: TempleTeam) {
  const lead =
    team.members.find((m) => m.coordinator) ||
    (team.coordinator_name
      ? {
          id: `coordinator-${team.id}`,
          name: team.coordinator_name,
          coordinator: true,
        }
      : null);
  const others = team.members.filter(
    (m) => !lead || (m.id !== lead.id && m.name !== lead.name),
  );
  return { lead, others };
}

export function TempleTeams({ teams }: { teams: TempleTeam[] }) {
  return (
    <div className="team-list">
      {teams.map((team) => {
        const { lead, others } = leadAndMembers(team);
        const people = lead ? [lead, ...others] : others;
        const count = team.members.length || (lead ? 1 : 0);
        return (
          <details key={team.id} className="team-board">
            <summary>
              <div className="team-summary">
                <h3>{team.name}</h3>
                <p className="team-board-meta">
                  {team.centre_name ? `${team.centre_name} · ` : ""}
                  {count} {count === 1 ? "member" : "members"}
                  {lead ? (
                    <>
                      {" · "}
                      <span className="team-lead-name">{lead.name}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </summary>
            {people.length ? (
              <ul className="team-members">
                {people.map((member) => (
                  <li
                    key={member.id}
                    className={member.coordinator ? "is-lead" : undefined}
                  >
                    <span>{member.name}</span>
                    {member.coordinator ? (
                      <span className="team-badge">Team lead</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="team-empty muted">
                No members listed for this team yet.
              </p>
            )}
          </details>
        );
      })}
    </div>
  );
}
