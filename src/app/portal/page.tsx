import Link from "next/link";
import { isConfigured } from "@/lib/supabase";
import { requireActor } from "@/lib/auth";
import { PageIntro, Empty } from "@/components/ui";
import { marathonDirectory } from "@/lib/marathon-data";
import { MarathonDatesForm } from "@/components/marathon-dates-form";
import {
  distributionPoints,
  formatPoints,
  weeklyCategories,
} from "@/lib/weekly-distribution";
import { reportingMonday } from "@/lib/weekly-distribution";
import { dateLabel, validDate, todayIn } from "@/lib/dates";
import { ReportForm } from "@/components/report-form";
import { RecordForms } from "@/components/record-forms";
import { Select } from "@/components/select";

import type {
  Temple,
  Campaign,
  RecordItem,
  WeeklyReport,
  Content,
  Target,
  MonthlyTarget,
} from "@/lib/data";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Temple Portal",
  robots: { index: false, follow: false },
};
const HISTORY_PAGE = 100;

export default async function Portal({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    edit?: string;
    week?: string;
    page?: string;
    start?: string;
    end?: string;
    campaign?: string;
    temple?: string;
  }>;
}) {
  if (!isConfigured())
    return (
      <div className="container">
        <PageIntro eyebrow="Temple portal" title="Temple Portal">
          A shared space to record distributions and care for your temple’s
          service.
        </PageIntro>
        <Empty title="Sign-in is being prepared">
          The portal will open when your temple account is ready.
        </Empty>
        <div className="actions">
          <Link href="/preview" className="button">
            Preview the reporting form
          </Link>
          <Link href="/" className="text-link">
            Return home
          </Link>
        </div>
      </div>
    );
  const { client, profile } = await requireActor(),
    query = await searchParams;
  const historyPage = Math.max(
    1,
    Number.parseInt(String(query.page || "1"), 10) || 1,
  );
  const historyFrom = (historyPage - 1) * HISTORY_PAGE;
  const historyTo = historyFrom + HISTORY_PAGE - 1;
  let reportsQuery = client
    .from("weekly_reports")
    .select("*", { count: "exact" })
    .order("week_start", { ascending: false })
    .order("temple_id");
  if (query.start && validDate(query.start))
    reportsQuery = reportsQuery.gte("week_start", query.start);
  if (query.end && validDate(query.end))
    reportsQuery = reportsQuery.lte("week_start", query.end);
  if (query.temple && profile.role === "admin")
    reportsQuery = reportsQuery.eq("temple_id", query.temple);
  const historyHref = (page: number) =>
    "/portal?" +
    new URLSearchParams({
      tab: "history",
      page: String(page),
      start: query.start || "",
      end: query.end || "",
      temple: query.temple || "",
    });
  const [
    templesR,
    campaignsR,
    centresR,
    individualsR,
    teamsR,
    reportsR,
    contentR,
    targetsR,
    monthlyTargetsR,
  ] = await Promise.all([
    profile.role === "admin"
      ? client.from("temples").select("*").order("name")
      : client.from("temples").select("*").eq("id", profile.temple_id),
    client
      .from("campaigns")
      .select("*")
      .order("starts_on", { ascending: false }),
    client.from("centres").select("*"),
    client.from("individuals").select("*"),
    client.from("teams").select("*, team_members(individual_id)"),
    reportsQuery.range(historyFrom, historyTo),
    client
      .from("content")
      .select("*")
      .order("created_at", { ascending: false }),
    client.from("targets").select("*").order("year", { ascending: false }),
    client
      .from("monthly_targets")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
  ]);
  const teamsLoaded = teamsR.error
    ? await client.from("teams").select("*")
    : teamsR;
  if (
    [
      templesR,
      campaignsR,
      centresR,
      individualsR,
      teamsLoaded,
      reportsR,
      contentR,
    ].some((r) => r.error)
  )
    throw new Error("Unable to load portal data");
  const temples = templesR.data as Temple[],
    own = <T extends { temple_id?: string | null }>(rows: T[]) =>
      profile.role === "admin"
        ? rows
        : rows.filter((row) => row.temple_id === profile.temple_id),
    campaigns = campaignsR.data as Campaign[],
    centres = own(centresR.data as RecordItem[]),
    individuals = own(individualsR.data as RecordItem[]),
    teams = own(
      (
        (teamsLoaded.data || []) as (RecordItem & {
          team_members?: { individual_id: string }[];
        })[]
      ).map((team) => ({
        ...team,
        member_ids: (team.team_members || []).map((m) => m.individual_id),
      })),
    ),
    reports = own((reportsR.data || []) as WeeklyReport[]),
    reportCount = reportsR.count ?? reports.length,
    content = own(contentR.data as Content[]),
    // Targets table arrives with the dashboard migration; tolerate its absence.
    targets = (targetsR.error ? [] : (targetsR.data as Target[])).filter(
      (g) => profile.role === "admin" || g.temple_id === profile.temple_id,
    ),
    monthlyTargets = (
      monthlyTargetsR.error ? [] : (monthlyTargetsR.data as MonthlyTarget[])
    ).filter(
      (g) => profile.role === "admin" || g.temple_id === profile.temple_id,
    );
  const selectedTemple =
    temples.find((t) => t.id === query.temple) || temples[0];
  const monday = reportingMonday(todayIn(selectedTemple?.timezone));
  const week =
    query.week && validDate(query.week) ? reportingMonday(query.week) : monday;
  let existing: WeeklyReport | undefined;
  if (query.edit || selectedTemple) {
    const lookup = client.from("weekly_reports").select("*");
    const result = await (
      query.edit
        ? lookup.eq("id", query.edit)
        : lookup.eq("temple_id", selectedTemple.id).eq("week_start", week)
    ).maybeSingle();
    if (result.error || (query.edit && !result.data))
      throw new Error("Report unavailable");
    existing = result.data || undefined;
  }
  const requested = query.tab === "stories" ? "content" : query.tab || "enter";
  const tab =
    requested === "temples" && profile.role !== "admin" ? "records" : requested;
  const marathonEntries =
    tab === "marathon"
      ? (await marathonDirectory()).filter(
          (entry) =>
            profile.role === "admin" || entry.temple_id === profile.temple_id,
        )
      : [];
  const areas = [
    ["enter", "/portal", "Enter distribution"],
    ["history", "/portal?tab=history", "Submission history"],
    ["records", "/portal?tab=records", "Individuals & teams"],
    ["campaigns", "/portal?tab=campaigns", "Campaigns"],
    ["marathon", "/portal?tab=marathon", "Marathon dates"],
    ["targets", "/portal?tab=targets", "Targets"],
    ["content", "/portal?tab=content", "Content"],
    ...(profile.role === "admin"
      ? ([["temples", "/portal?tab=temples", "Temples"]] as const)
      : []),
  ];
  return (
    <div className="container workspace">
      <PageIntro
        eyebrow={
          profile.role === "admin"
            ? "All temples"
            : temples[0]
              ? temples[0].name
              : "Temple portal"
        }
        title={`Welcome, ${profile.display_name}`}
      >
        Record your temple’s service, and add stories, local initiatives and
        events.
      </PageIntro>
      {profile.role !== "admin" && temples[0]?.approved === false && (
        <p role="status" className="notice">
          Your temple is awaiting approval. You can look around, but reports and
          records can be saved once an administrator approves it.
        </p>
      )}
      <nav className="portal-nav" aria-label="Portal areas">
        {areas.map(([id, href, label]) => (
          <Link
            key={id}
            href={href}
            className={tab === id ? "is-active" : undefined}
            aria-current={tab === id ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      {tab === "marathon" ? (
        <section className="panel">
          <h2>Book Distribution Marathon 2026 dates</h2>
          {marathonEntries.map((entry) => (
            <MarathonDatesForm key={entry.temple_id} entry={entry} />
          ))}{" "}
        </section>
      ) : query.tab === "history" ? (
        <div className="panel">
          <h2>Weekly submission history</h2>
          <form aria-label="History filters" className="filter-bar history-filters">
            <input type="hidden" name="tab" value="history" />
            <label>
              Week beginning from
              <input type="date" name="start" defaultValue={query.start} />
            </label>
            <label>
              Through
              <input type="date" name="end" defaultValue={query.end} />
            </label>
            {profile.role === "admin" && (
              <div className="weekly-report-select">
                <label htmlFor="history-temple-trigger">Temple</label>
                <Select
                  id="history-temple"
                  name="temple"
                  defaultValue={query.temple}
                >
                  <option value="">All temples</option>
                  {temples.map((t) => (
                    <option value={t.id} key={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div className="history-filter-actions">
              <button className="button" type="submit">
                Apply filters
              </button>
              <Link href="/portal?tab=history" className="button secondary">
                Clear filters
              </Link>
            </div>
          </form>
          <section aria-label="Totals for these submissions">
            <p>
              {reportCount} matching weekly reports{" "}
              {query.start &&
                validDate(query.start) &&
                "from " + dateLabel(query.start)}
            </p>
          </section>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  {[
                    "Temple",
                    "Reporting week",
                    ...weeklyCategories.map((c) => c[1]),
                    "Total books distributed",
                    "Total sets distributed",
                    "Points",
                    "Category breakdown pending",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>{temples.find((t) => t.id === r.temple_id)?.name}</td>
                    <td>
                      <Link href={"/portal?edit=" + r.id}>{r.week_start}</Link>
                    </td>
                    {weeklyCategories.map(([k]) => (
                      <td key={k}>{r[k]}</td>
                    ))}
                    <td>{r.books}</td>
                    <td>{r.sets}</td>
                    <td>{formatPoints(distributionPoints(r))}</td>
                    <td>{r.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {historyPage > 1 && (
            <Link href={historyHref(historyPage - 1)}>Previous </Link>
          )}
          {historyFrom + HISTORY_PAGE < reportCount && (
            <Link href={historyHref(historyPage + 1)}>Next</Link>
          )}
        </div>
      ) : ["records", "campaigns", "content", "temples", "targets"].includes(
          tab,
        ) ? (
        <>
          <RecordForms
            key={tab}
            tab={tab}
            admin={profile.role === "admin"}
            temples={temples}
            individuals={individuals}
            teams={teams}
            centres={centres}
            targets={targets}
            monthlyTargets={monthlyTargets}
            campaigns={campaigns.filter(
              (c) =>
                !c.fallback_year &&
                (profile.role === "admin" || c.temple_id === profile.temple_id),
            )}
            content={content.filter(
              (c) =>
                profile.role === "admin" || c.temple_id === profile.temple_id,
            )}
          />
        </>
      ) : (
        <ReportForm
          key={[existing?.id, existing?.version, week, selectedTemple?.id].join(
            "-",
          )}
          existing={existing}
          initialWeek={existing?.week_start || week}
          templeId={existing?.temple_id || selectedTemple?.id}
          temples={temples}
          campaigns={campaigns}
          centres={centres}
          individuals={individuals}
          teams={teams}
          admin={profile.role === "admin"}
        />
      )}
    </div>
  );
}
