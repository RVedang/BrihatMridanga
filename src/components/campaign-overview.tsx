import type { Campaign, Dashboard, Score, Target, Temple } from "@/lib/data";
import {
  booksFrom,
  campaignGoal,
  participationCopy,
} from "@/lib/campaign";
import { Bars, ChartCard, Progress } from "@/components/charts";
import { dateLabel } from "@/lib/dates";

export function CampaignOverview({
  campaign,
  temples,
  targets,
  rows,
  progressRows,
  dash,
}: {
  campaign: Campaign;
  temples: Temple[];
  targets: Target[];
  rows: Score[];
  progressRows: Score[];
  dash: Dashboard | null;
}) {
  const templeName = campaign.temple_id
    ? temples.find((t) => t.id === campaign.temple_id)?.name
    : undefined;
  const { custom, steps } = participationCopy(campaign, templeName);
  const goal = campaignGoal(campaign, targets);
  const achieved = booksFrom(progressRows);
  const regional = Boolean(campaign.temple_id);
  const templeRows = (dash?.by_temple || []).map((r) => ({
    key: r.temple_id,
    label: r.temple_name,
    sub: r.country,
    value: Number(r.books),
    href: `/temples/${r.temple_id}`,
  }));
  const centreRows = (dash?.by_centre || []).map((r) => ({
    key: r.centre_id,
    label: r.centre_name,
    sub: r.temple_name,
    value: Number(r.books),
  }));
  const personRows = (dash?.by_individual || []).map((r) => ({
    key: r.individual_id,
    label: r.name,
    sub: r.temple_name,
    value: Number(r.books),
  }));
  const teamRows = (dash?.by_team || []).map((r) => ({
    key: r.team_id,
    label: r.name,
    sub: r.temple_name,
    value: Number(r.books),
  }));
  const fromScores = [...rows]
    .sort((a, b) => Number(b.books) - Number(a.books))
    .map((r) => ({
      key: r.temple_id,
      label: r.temple_name,
      sub: r.country,
      value: Number(r.books),
      href: `/temples/${r.temple_id}`,
    }));
  const ranking = templeRows.length ? templeRows : fromScores;
  return (
    <>
      <section className="dash-section" id="participate">
        <div className="section-title">
          <h2>Participation Instructions</h2>
        </div>
        <div className="campaign-guide">
          {custom && <p className="campaign-guide-custom">{custom}</p>}
          <ol>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>
      <section className="dash-section" id="progress">
        <div className="section-title">
          <h2>Live progress</h2>
        </div>
        {goal ? (
          <div className="chart-card">
            <Progress
              label={goal.label}
              sub={`${dateLabel(campaign.starts_on)} – ${dateLabel(campaign.ends_on)} · Books distributed toward the target`}
              value={achieved}
              target={goal.books}
            />
          </div>
        ) : (
          <p className="chart-empty">
            No book target is set for this campaign. A movement-wide annual
            target, a temple target, or a special campaign book target can be
            set in the portal.
          </p>
        )}
      </section>
      <section className="dash-section" id="leaderboard">
        <div className="section-title">
          <h2>Leaderboard</h2>
        </div>
        <div className="chart-grid">
          {!regional && (
            <ChartCard
              title="Temples"
              note="Ranked by books in this campaign"
            >
              <Bars rows={ranking} ranked />
            </ChartCard>
          )}
          <ChartCard
            title="Centers"
            note={
              regional
                ? "Ranked by books at this temple"
                : "Ranked by books in this campaign"
            }
          >
            <Bars rows={centreRows} ranked />
          </ChartCard>
          <ChartCard title="Individuals" note="Where a distributor was named">
            <Bars rows={personRows} ranked />
          </ChartCard>
          <ChartCard title="Teams" note="Where a team was named">
            <Bars rows={teamRows} ranked />
          </ChartCard>
        </div>
      </section>
    </>
  );
}
