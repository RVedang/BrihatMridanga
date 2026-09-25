import { categoryLabel } from "@/lib/catalog";
import { scores, dashboard, publicData, type Campaign, type Dashboard } from "@/lib/data";
import { validateRange } from "@/lib/dates";
import { cellsToPdf } from "@/lib/report-pdf";

const uuid = /^[0-9a-f-]{36}$/i;
const categories = ["small", "medium", "big", "m-big"];

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  let range;
  try {
    range = validateRange(q.get("start") || "", q.get("end") || "");
  } catch {
    return new Response("Invalid date range", { status: 400 });
  }
  const campaign = q.get("campaign") || undefined,
    temple = q.get("temple") || undefined,
    centre = q.get("centre") || undefined,
    country = (q.get("country") || "").slice(0, 120) || undefined,
    language = (q.get("language") || "").slice(0, 60) || undefined,
    category = q.get("category") || undefined,
    view = q.get("view") || "temples",
    format = q.get("format") || "csv",
    spreadsheet = format === "xls",
    pdf = format === "pdf";
  if (campaign && !uuid.test(campaign))
    return new Response("Invalid campaign", { status: 400 });
  if (temple && !uuid.test(temple))
    return new Response("Invalid temple", { status: 400 });
  if (centre && !uuid.test(centre))
    return new Response("Invalid center", { status: 400 });
  if (category && !categories.includes(category))
    return new Response("Invalid book type", { status: 400 });

  const filtered = Boolean(temple || centre || country || language || category);
  const dash = await dashboard({
    start: range.start,
    end: range.end,
    campaign,
    temple,
    centre,
    country,
    language,
    category,
  });
  let cells: unknown[][];
  if (view === "full") {
    if (!dash) return new Response("Dashboard unavailable", { status: 503 });
    cells = workbook(dash, range, await publicMeta());
  } else if (view === "temples" && !filtered && !dash) {
    const rows = await scores(range.start, range.end, campaign, centre);
    cells = [
      [
        "Temple",
        "Country",
        "Books",
        "Sets",
        "Recorded points",
        "Incomplete reports",
        "Start date (inclusive)",
        "End date (inclusive)",
      ],
      ...rows.map((r) => [
        r.temple_name,
        r.country,
        r.books,
        r.sets || 0,
        r.known_points,
        r.incomplete_reports,
        range.start,
        range.end,
      ]),
    ];
  } else {
    if (!dash) return new Response("Dashboard unavailable", { status: 503 });
    const table = tables[view];
    if (!table) return new Response("Unknown view", { status: 400 });
    const [header, rows] = table(dash);
    const scope = [
      range.start,
      range.end,
      country || "",
      language || "",
      category ? categoryLabel(category) : "",
    ];
    cells = [
      [
        ...header,
        "Start date (inclusive)",
        "End date (inclusive)",
        "Country filter",
        "Language filter",
        "Book type filter",
      ],
      ...rows.map((r) => [...r, ...scope]),
    ];
  }
  const ext = pdf ? "pdf" : spreadsheet ? "xls" : "csv";
  const body = pdf
    ? cellsToPdf(cells)
    : spreadsheet
      ? excelXml(cells)
      : csvText(cells);
  return new Response(body, {
    headers: {
      "Content-Type": pdf
        ? "application/pdf"
        : spreadsheet
          ? "application/vnd.ms-excel; charset=utf-8"
          : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${view}-${range.start}-${range.end}.${ext}"`,
      "Cache-Control": "no-store",
    },
  });
}

function csvText(cells: unknown[][]) {
  const escape = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return "\uFEFF" + cells.map((row) => row.map(escape).join(",")).join("\r\n");
}

function excelXml(cells: unknown[][]) {
  const xml = (s: string) =>
    s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const cell = (v: unknown) => {
    if (v === null || v === undefined || v === "") return "<Cell/>";
    const n = typeof v === "number" ? v : Number(v);
    const numeric =
      Number.isFinite(n) &&
      (typeof v === "number" || String(v).trim() === String(n));
    if (numeric) return `<Cell><Data ss:Type="Number">${n}</Data></Cell>`;
    let s = String(v);
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return `<Cell><Data ss:Type="String">${xml(s)}</Data></Cell>`;
  };
  const rows = cells
    .map((row) => `<Row>${row.map(cell).join("")}</Row>`)
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<?mso-application progid="Excel.Sheet"?>` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ` +
    `xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
    `<Worksheet ss:Name="Reports"><Table>${rows}</Table></Worksheet>` +
    `</Workbook>`
  );
}

type Table = (d: Dashboard) => [string[], unknown[][]];
const measure = ["Books", "Sets", "Recorded points"];
const tables: Record<string, Table> = {
  temples: (d) => [
    ["Rank", "Temple", "Country", ...measure, "Reports", "Incomplete reports"],
    d.by_temple.map((r, i) => [
      i + 1,
      r.temple_name,
      r.country,
      r.books,
      r.sets,
      r.points,
      r.reports,
      r.incomplete_reports,
    ]),
  ],
  countries: (d) => [
    ["Rank", "Country", ...measure, "Temples", "Reports"],
    d.by_country.map((r, i) => [
      i + 1,
      r.country,
      r.books,
      r.sets,
      r.points,
      r.temples,
      r.reports,
    ]),
  ],
  centres: (d) => [
    ["Rank", "Center", "Temple", "Country", ...measure, "Reports"],
    d.by_centre.map((r, i) => [
      i + 1,
      r.centre_name,
      r.temple_name,
      r.country,
      r.books,
      r.sets,
      r.points,
      r.reports,
    ]),
  ],
  categories: (d) => [
    ["Book type", ...measure],
    d.by_category.map((r) => [
      categoryLabel(r.category),
      r.books,
      r.sets,
      r.points,
    ]),
  ],
  languages: (d) => [
    ["Language", ...measure],
    d.by_language.map((r) => [r.language, r.books, r.sets, r.points]),
  ],
  teams: (d) => [
    ["Rank", "Team", "Temple", "Country", ...measure, "Reports"],
    d.by_team.map((r, i) => [
      i + 1,
      r.name,
      r.temple_name,
      r.country,
      r.books,
      r.sets,
      r.points,
      r.reports,
    ]),
  ],
  individuals: (d) => [
    ["Rank", "Individual", "Temple", "Country", ...measure, "Reports"],
    d.by_individual.map((r, i) => [
      i + 1,
      r.name,
      r.temple_name,
      r.country,
      r.books,
      r.sets,
      r.points,
      r.reports,
    ]),
  ],
  monthly: (d) => [
    ["Month", ...measure, "Reports"],
    d.by_month.map((r) => [r.month, r.books, r.sets, r.points, r.reports]),
  ],
  yearly: (d) => [
    ["Year", ...measure, "Reports"],
    d.by_year.map((r) => [r.year, r.books, r.sets, r.points, r.reports]),
  ],
  daily: (d) => [
    ["Date", ...measure, "Reports"],
    (d.by_day || []).map((r) => [r.day, r.books, r.sets, r.points, r.reports]),
  ],
  campaigns: (d) => [
    ["Type", "Campaign", "Temple", "Temples", ...measure, "Reports"],
    (d.by_campaign || []).map((r) => [
      r.temple_id ? "Regional" : "Movement-wide",
      r.campaign_name,
      r.temple_id || "",
      r.temples,
      r.books,
      r.sets,
      r.points,
      r.reports,
    ]),
  ],
};

function section(title: string, table: [string[], unknown[][]]): unknown[][] {
  return [[title], table[0], ...table[1], []];
}

async function publicMeta() {
  const data = await publicData();
  return {
    names: Object.fromEntries(data.temples.map((t) => [t.id, t.name])),
    campaigns: data.campaigns,
  };
}

function campaignRows(
  catalog: Campaign[],
  reported: NonNullable<Dashboard["by_campaign"]>,
  regional: boolean,
) {
  const stats = new Map(reported.map((row) => [row.campaign_id, row]));
  const listed = catalog.filter((campaign) =>
    regional ? Boolean(campaign.temple_id) : !campaign.temple_id,
  );
  const rows = listed.map(
    (campaign) =>
      stats.get(campaign.id) || {
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        fallback_year: campaign.fallback_year,
        temple_id: campaign.temple_id,
        books: 0,
        sets: 0,
        points: 0,
        reports: 0,
        temples: 0,
      },
  );
  for (const row of reported) {
    if (regional ? row.temple_id : !row.temple_id) {
      if (!rows.some((item) => item.campaign_id === row.campaign_id))
        rows.push(row);
    }
  }
  return rows.sort(
    (a, b) =>
      Number(b.books) - Number(a.books) ||
      a.campaign_name.localeCompare(b.campaign_name),
  );
}

function campaignGroups(
  d: Dashboard,
  names: Record<string, string>,
  catalog: Campaign[],
) {
  const reported = d.by_campaign || [];
  const movement = campaignRows(catalog, reported, false);
  const regional = campaignRows(catalog, reported, true);
  return {
    movement: [
      ["Campaign", "Temples", ...measure, "Reports"],
      movement.map((r) => [
        r.campaign_name,
        r.temples,
        r.books,
        r.sets,
        r.points,
        r.reports,
      ]),
    ] as [string[], unknown[][]],
    regional: [
      ["Campaign", "Temple", ...measure, "Reports"],
      regional.map((r) => [
        r.campaign_name,
        names[r.temple_id || ""] || "",
        r.books,
        r.sets,
        r.points,
        r.reports,
      ]),
    ] as [string[], unknown[][]],
  };
}

function workbook(
  d: Dashboard,
  range: { start: string; end: string },
  meta: { names: Record<string, string>; campaigns: Campaign[] },
): unknown[][] {
  const campaigns = campaignGroups(d, meta.names, meta.campaigns);
  return [
    [`Brihat Mridanga reports ${range.start} to ${range.end}`],
    ["Measure", "Value"],
    ["Books", d.totals.books],
    ["Sets", d.totals.sets],
    ["Temples", d.totals.temples],
    ["Countries", d.totals.countries],
    [],
    ["Year-over-year"],
    ["Measure", "This period", "Previous period"],
    ["Books", d.totals.books, d.previous.books],
    ["Sets", d.totals.sets, d.previous.sets],
    [],
    ...section("Regional summaries", tables.countries(d)),
    ...section("Temple performance", tables.temples(d)),
    ...section("Daily reports", tables.daily(d)),
    ...section("Monthly reports", tables.monthly(d)),
    ...section("Movement-wide campaigns", campaigns.movement),
    ...section("Regional campaigns", campaigns.regional),
    ...section("Yearly table", tables.yearly(d)),
  ];
}
