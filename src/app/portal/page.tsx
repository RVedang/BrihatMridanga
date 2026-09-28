import Link from "next/link";
import { isConfigured } from "@/lib/supabase";
import { requireActor } from "@/lib/auth";
import { PageIntro, Empty } from "@/components/ui";
import {
  SubmissionHistory,
  type HistoryTotalsRow as HistoryRow,
} from "@/components/submission-history";
import { PeriodLocks, type PeriodLock } from "@/components/period-locks";
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
  searchParams: Promise<{
    tab?: string;
    edit?: string;
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
  const isDate = (v?: string) =>
    v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
  const isId = (v?: string) =>
    v && /^[0-9a-f-]{36}$/i.test(v) ? v : "";
  const historyFilter = {
    start: isDate(query.start),
    end: isDate(query.end),
    campaign: isId(query.campaign),
    temple: profile.role === "admin" ? isId(query.temple) : "",
  };
  type Filterable = {
    eq(column: string, value: string): Filterable;
    gte(column: string, value: string): Filterable;
    lte(column: string, value: string): Filterable;
  };
  const scoped = <Q,>(query: Q): Q => {
    let q = query as unknown as Filterable;
    if (profile.role !== "admin")
      q = q.eq("temple_id", profile.temple_id || "");
    if (historyFilter.temple) q = q.eq("temple_id", historyFilter.temple);
    if (historyFilter.campaign) q = q.eq("campaign_id", historyFilter.campaign);
    if (historyFilter.start) q = q.gte("distributed_on", historyFilter.start);
    if (historyFilter.end) q = q.lte("distributed_on", historyFilter.end);
    return q as unknown as Q;
  };
  const reportsQuery = scoped(
    client
      .from("distributions")
      .select("*", { count: "exact" })
      .order("distributed_on", { ascending: false })
      .order("updated_at", { ascending: false }),
  );
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
  const historyRows: HistoryRow[] = [];
  if (query.tab === "history") {
    const batches = await Promise.all(
      Array.from({ length: Math.ceil(reportCount / 1000) }, (_, i) =>
        scoped(
          client
            .from("distributions")
            .select("distributed_on,book_count,set_count,points")
            .order("id"),
        ).range(i * 1000, i * 1000 + 999),
      ),
    );
    for (const { data, error } of batches) {
      if (error) throw new Error("Unable to load report totals");
      historyRows.push(...((data || []) as HistoryRow[]));
    }
  }
  const periodLocks: PeriodLock[] =
    profile.role === "admin" && query.tab === "temples"
      ? (
          await client
            .from("period_locks")
            .select("temple_id,month")
            .order("month", { ascending: false })
        ).data || []
      : [];
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
      {query.tab === "history" ? (
        <SubmissionHistory
          admin={profile.role === "admin"}
          reports={reports}
          totalsRows={historyRows}
          reportCount={reportCount}
          page={historyPage}
          pageSize={HISTORY_PAGE}
          filter={historyFilter}
          temples={temples}
          campaigns={campaigns}
          centres={centres}
          individuals={individuals}
          teams={teams}
        />
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
        {tab === "temples" && profile.role === "admin" && (
          <PeriodLocks temples={temples} locks={periodLocks} />
        )}
        </>
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
