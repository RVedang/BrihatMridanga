import Link from "next/link";
import { PencilLine } from "lucide-react";
import { isConfigured } from "@/lib/supabase";
import { requireActor } from "@/lib/auth";
import { PageIntro, Empty, number } from "@/components/ui";
import { ReportForm } from "@/components/report-form";
import { RecordForms } from "@/components/record-forms";
import catalog from "@/data/books.json";
import { normalizeBooks, type Book } from "@/lib/catalog";
import type {
  Temple,
  Campaign,
  RecordItem,
  Distribution,
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
  searchParams: Promise<{ tab?: string; edit?: string; page?: string }>;
}) {
  if (!isConfigured())
    return (
      <div className="container">
        <PageIntro
          eyebrow="Temple portal"
          title="Temple Portal"
        >
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
    .from("distributions")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false });
  if (profile.role !== "admin")
    reportsQuery = reportsQuery.eq("temple_id", profile.temple_id);
  const [
    templesR,
    campaignsR,
    centresR,
    individualsR,
    teamsR,
    reportsR,
    booksR,
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
    client.from("books").select("*").order("name"),
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
      ((teamsLoaded.data || []) as (RecordItem & {
        team_members?: { individual_id: string }[];
      })[]).map((team) => ({
        ...team,
        member_ids: (team.team_members || []).map((m) => m.individual_id),
      })),
    ),
    reports = own((reportsR.data || []) as Distribution[]),
    reportCount = reportsR.count ?? reports.length,
    books = normalizeBooks(booksR.data, catalog as Book[]),
    content = own(contentR.data as Content[]),
    // Targets table arrives with the dashboard migration; tolerate its absence.
    targets = (targetsR.error ? [] : (targetsR.data as Target[])).filter(
      (g) => profile.role === "admin" || g.temple_id === profile.temple_id,
    ),
    monthlyTargets = (
      monthlyTargetsR.error
        ? []
        : (monthlyTargetsR.data as MonthlyTarget[])
    ).filter(
      (g) => profile.role === "admin" || g.temple_id === profile.temple_id,
    );
  let existing: Distribution | undefined;
  if (query.edit) {
    const { data, error } = await client
      .from("distributions")
      .select("*")
      .eq("id", query.edit)
      .single();
    if (error) throw new Error("Report is not available");
    if (
      profile.role !== "admin" &&
      data.temple_id !== profile.temple_id
    )
      throw new Error("Report is not available");
    existing = data;
  }
  const requested = query.tab === "stories" ? "content" : query.tab || "enter";
  const tab =
    requested === "temples" && profile.role !== "admin"
      ? "records"
      : requested;
  const areas = [
    ["enter", "/portal", "Enter distribution"],
    ["history", "/portal?tab=history", "Submission history"],
    ["records", "/portal?tab=records", "Individuals & teams"],
    ["campaigns", "/portal?tab=campaigns", "Campaigns"],
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
      {query.tab === "history" ? (
        <div className="history-board">
          <div className="table-wrap history-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  {profile.role === "admin" && <th>Temple</th>}
                  <th>Books</th>
                  <th>Sets</th>
                  <th>Points</th>
                  <th>Version</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.length ? (
                  reports.map((r) => (
                    <tr key={r.id}>
                      <td>{r.distributed_on}</td>
                      {profile.role === "admin" && (
                        <td>
                          {temples.find((t) => t.id === r.temple_id)?.name}
                        </td>
                      )}
                      <td>{number(r.book_count)}</td>
                      <td>
                        {r.mode === "total"
                          ? "Incomplete"
                          : number(r.set_count ?? 0)}
                      </td>
                      <td>
                        {r.points === null ? "Incomplete" : number(r.points)}
                      </td>
                      <td>{r.version}</td>
                      <td>
                        <Link
                          className="button secondary small history-update"
                          href={`/portal?edit=${r.id}`}
                        >
                          <PencilLine size={14} strokeWidth={1.8} />
                          Update
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={profile.role === "admin" ? 7 : 6}>
                      {reportCount
                        ? "No submissions on this page."
                        : "No submissions yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {reportCount > HISTORY_PAGE && (
            <nav className="history-pager" aria-label="Submission pages">
              {historyPage > 1 ? (
                <Link
                  className="button secondary small history-prev"
                  href={
                    historyPage === 2
                      ? "/portal?tab=history"
                      : `/portal?tab=history&page=${historyPage - 1}`
                  }
                >
                  Previous 100
                </Link>
              ) : null}
              <p className="muted">
                {number(historyFrom + 1)}–
                {number(Math.min(historyTo + 1, reportCount))} of{" "}
                {number(reportCount)}
              </p>
              {historyTo + 1 < reportCount ? (
                <Link
                  className="button secondary small history-next"
                  href={`/portal?tab=history&page=${historyPage + 1}`}
                >
                  Next 100
                </Link>
              ) : null}
            </nav>
          )}
          <p className="muted history-hint">
            To add details to a total-only report, use Update on that entry.
          </p>
        </div>
      ) : ["records", "campaigns", "content", "temples", "targets"].includes(
          tab,
        ) ? (
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
      ) : (
        <ReportForm
          key={existing?.id || "new"}
          existing={existing}
          books={books}
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
