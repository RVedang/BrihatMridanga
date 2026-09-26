import "server-only";
import { isConfigured, supabase } from "./supabase";
import { withSampleContent } from "@/data/sample-content";
export type Temple = {
  id: string;
  name: string;
  country: string;
  city: string;
  timezone: string;
  information?: string;
  contact?: string;
};
export type Campaign = {
  id: string;
  name: string;
  description: string;
  temple_id: string | null;
  starts_on: string;
  ends_on: string;
  fallback_year: number | null;
  instructions: string;
  target_books: number | null;
};
export type RecordItem = {
  id: string;
  name: string;
  temple_id: string;
  coordinator_name?: string;
  centre_id?: string | null;
  member_ids?: string[];
};
export type TeamMember = {
  id: string;
  name: string;
  coordinator: boolean;
};
export type TempleTeam = {
  id: string;
  name: string;
  centre_id: string | null;
  centre_name: string | null;
  coordinator_name: string;
  members: TeamMember[];
};
export type Score = {
  temple_id: string;
  temple_name: string;
  country: string;
  books: number;
  sets: number;
  known_points: number;
  incomplete_reports: number;
};
export type Content = {
  id: string;
  temple_id: string | null;
  centre_id?: string | null;
  kind:
    | "story"
    | "resource"
    | "event"
    | "testimonial"
    | "initiative"
    | "photo"
    | "community_story";
  story_type?: string;
  person_name?: string;
  title: string;
  body: string;
  language: string;
  link_url: string;
  image_url?: string;
  published: boolean;
  starts_at: string | null;
  ends_at: string | null;
  location: string;
  created_at: string;
};
export type Distribution = {
  id: string;
  temple_id: string;
  distributed_on: string;
  campaign_id: string;
  centre_id: string | null;
  individual_id: string | null;
  team_id: string | null;
  mode: "detailed" | "total";
  book_count: number;
  set_count?: number;
  points: number | null;
  version: number;
  lines: {
    bookId: string;
    quantity: number;
    score: number;
    category: string;
    volumes?: number;
  }[];
};

async function loadCentres(client: Awaited<ReturnType<typeof supabase>>) {
  const listed = await client.rpc("public_centre_list");
  if (!listed.error)
    return { data: (listed.data as RecordItem[]) || [], error: null };
  return client.from("centres").select("id,name,temple_id").order("name");
}

export async function publicData() {
  if (!isConfigured())
    return {
      temples: [] as Temple[],
      campaigns: [] as Campaign[],
      content: withSampleContent([]),
      centres: [] as RecordItem[],
      targets: [] as Target[],
      monthlyTargets: [] as MonthlyTarget[],
      connected: false,
    };
  const client = await supabase();
  const results = await Promise.all([
    client.from("temples").select("*").order("name"),
    client
      .from("campaigns")
      .select("*")
      .order("starts_on", { ascending: false }),
    client
      .from("content")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false }),
    loadCentres(client),
    client.from("targets").select("id,year,temple_id,books"),
    client.from("monthly_targets").select("id,year,month,temple_id,books"),
  ]);
  const fatal = [results[0].error, results[1].error, results[2].error].filter(
    (error): error is NonNullable<typeof error> => Boolean(error),
  );
  if (fatal.length) {
    if (fatal.every(isMissingSchema))
      return {
        temples: [] as Temple[],
        campaigns: [] as Campaign[],
        content: withSampleContent([]),
        centres: [] as RecordItem[],
        targets: [] as Target[],
        monthlyTargets: [] as MonthlyTarget[],
        connected: false,
      };
    throw new Error(`Unable to load portal data. ${fatal[0].message}`);
  }
  return {
    temples: results[0].data as Temple[],
    campaigns: results[1].data as Campaign[],
    content: withSampleContent((results[2].data as Content[]) || []),
    centres: (
      results[3].error ? [] : (results[3].data as RecordItem[]) || []
    ),
    targets: results[4].error ? [] : (results[4].data as Target[]) || [],
    monthlyTargets: results[5].error
      ? []
      : (results[5].data as MonthlyTarget[]) || [],
    connected: true,
  };
}
export type DailyScore = Measure & { day: string; reports: number };

export async function dailyScores(
  filters: DashboardFilters,
): Promise<DailyScore[]> {
  if (!isConfigured()) return [];
  const client = await supabase();
  const { data, error } = await client.rpc("public_daily_scores", {
    start_date: filters.start,
    end_date: filters.end,
    selected_campaign: filters.campaign || null,
    selected_country: filters.country || null,
    selected_temple: filters.temple || null,
    selected_centre: filters.centre || null,
  });
  if (!error)
    return ((data as DailyScore[]) || []).map((r) => ({
      ...r,
      day: String(r.day).slice(0, 10),
      books: Number(r.books),
      sets: Number(r.sets),
      points: Number(r.points),
      reports: Number(r.reports),
    }));
  if (isMissingSchema(error)) return [];
  throw new Error(`Unable to load daily reports. ${error.message}`);
}
export async function scores(
  start: string,
  end: string,
  campaign?: string,
  centre?: string,
): Promise<Score[]> {
  if (!isConfigured()) return [];
  const client = await supabase();
  const args: Record<string, string | null> = {
    start_date: start,
    end_date: end,
    selected_campaign: campaign || null,
  };
  if (centre) args.selected_centre = centre;
  const { data, error } = await client.rpc("public_scores_range", args);
  if (!error) return data as Score[];
  if (isMissingSchema(error)) {
    if (centre) return scores(start, end, campaign);
    return [];
  }
  throw new Error(`Unable to load scores. ${error.message}`);
}

export type DashboardFilters = {
  start: string;
  end: string;
  campaign?: string;
  country?: string;
  temple?: string;
  centre?: string;
  language?: string;
  category?: string;
};
export type Measure = { books: number; sets: number; points: number };
export type Dashboard = {
  range: { start: string; end: string };
  totals: Measure & {
    reports: number;
    incomplete_reports: number;
    temples: number;
    countries: number;
  };
  all_time: Measure & { reports: number; first_date: string | null };
  previous: Measure & { start: string; end: string };
  excluded_total_only: number;
  by_year: (Measure & { year: number; reports: number })[];
  by_month: (Measure & { month: string; reports: number })[];
  by_day: (Measure & { day: string; reports: number })[];
  by_campaign: (Measure & {
    campaign_id: string;
    campaign_name: string;
    fallback_year: number | null;
    temple_id: string | null;
    reports: number;
    temples: number;
  })[];
  by_country: (Measure & { country: string; temples: number; reports: number })[];
  by_temple: (Measure & {
    temple_id: string;
    temple_name: string;
    country: string;
    reports: number;
    incomplete_reports: number;
  })[];
  by_centre: (Measure & {
    centre_id: string;
    centre_name: string;
    temple_name: string;
    country: string;
    reports: number;
  })[];
  by_category: (Measure & { category: string })[];
  by_language: (Measure & { language: string })[];
  by_individual: (Measure & {
    individual_id: string;
    name: string;
    temple_name: string;
    country: string;
    reports: number;
  })[];
  by_team: (Measure & {
    team_id: string;
    name: string;
    temple_name: string;
    country: string;
    reports: number;
  })[];
  targets: {
    year: number;
    temple_id: string | null;
    temple_name: string | null;
    country: string | null;
    books: number;
  }[];
  options: { languages: string[]; countries: string[] };
};
export type Target = {
  id: string;
  year: number;
  temple_id: string | null;
  books: number;
};
export type MonthlyTarget = {
  id: string;
  year: number;
  month: number;
  temple_id: string;
  books: number;
};
/** Filtered public aggregates for the dashboard. Returns null when the
 *  backend is not configured or the dashboard migration is not applied. */
export async function dashboard(
  filters: DashboardFilters,
): Promise<Dashboard | null> {
  if (!isConfigured()) return null;
  const client = await supabase();
  const args: Record<string, string | null> = {
    start_date: filters.start,
    end_date: filters.end,
    selected_campaign: filters.campaign || null,
    selected_country: filters.country || null,
    selected_temple: filters.temple || null,
    selected_language: filters.language || null,
    selected_category: filters.category || null,
  };
  if (filters.centre) args.selected_centre = filters.centre;
  const first = await client.rpc("public_dashboard", args);
  if (!first.error) return first.data as Dashboard;
  if (filters.centre && isMissingSchema(first.error)) {
    delete args.selected_centre;
    const retry = await client.rpc("public_dashboard", args);
    if (!retry.error) return retry.data as Dashboard;
    if (isMissingSchema(retry.error)) return null;
    throw new Error(`Unable to load the dashboard. ${retry.error.message}`);
  }
  if (isMissingSchema(first.error)) return null;
  throw new Error(`Unable to load the dashboard. ${first.error.message}`);
}

function isMissingSchema(error: { code?: string; message?: string }) {
  const code = error.code || "";
  const message = (error.message || "").toLowerCase();
  return (
    code === "PGRST205" ||
    code === "PGRST202" ||
    code === "42P01" ||
    message.includes("schema cache") ||
    message.includes("could not find the function") ||
    message.includes("does not exist")
  );
}

function namesMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export async function templeTeams(templeId: string): Promise<TempleTeam[]> {
  if (!isConfigured()) return [];
  const client = await supabase();
  const { data, error } = await client.rpc("public_temple_teams", {
    tid: templeId,
  });
  if (error) {
    if (isMissingSchema(error)) return [];
    throw new Error(`Unable to load temple teams. ${error.message}`);
  }
  return ((data as TempleTeam[]) || []).map((team) => {
    const members = [...(team.members || [])];
    const hasCoordinator = members.some(
      (m) => m.coordinator || namesMatch(m.name, team.coordinator_name),
    );
    if (!hasCoordinator && team.coordinator_name)
      members.unshift({
        id: `coordinator-${team.id}`,
        name: team.coordinator_name,
        coordinator: true,
      });
    else
      for (const member of members)
        if (namesMatch(member.name, team.coordinator_name))
          member.coordinator = true;
    members.sort(
      (a, b) => Number(b.coordinator) - Number(a.coordinator) || a.name.localeCompare(b.name),
    );
    return { ...team, members };
  });
}
