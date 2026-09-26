"use server";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/auth";
import { isCommunityStoryType } from "@/lib/story-types";
export type ActionResult = {
  ok: boolean;
  message: string;
  id?: string;
  version?: number;
};
export async function submitDistribution(
  request: Record<string, unknown>,
): Promise<ActionResult> {
  const { client } = await requireActor();
  const { data, error } = await client.rpc("save_distribution", { request });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: "Published. Book totals are updated.",
    id: data.id,
    version: data.version,
  };
}
const tables = [
  "temples",
  "centres",
  "individuals",
  "teams",
  "campaigns",
  "content",
  "targets",
  "monthly_targets",
] as const;
export async function saveRecord(
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client, profile } = await requireActor();
  const table = String(form.get("table"));
  if (!tables.includes(table as (typeof tables)[number]))
    return { ok: false, message: "Invalid record type." };
  const text = (name: string) => String(form.get(name) || "").trim();
  let templeId = text("temple_id") || null;
  const id = text("id");
  if (profile.role !== "admin") {
    if (!profile.temple_id || table === "temples")
      return { ok: false, message: "You can manage only your assigned temple." };
    templeId = profile.temple_id;
    if (id) {
      const { data: existing, error: existingError } = await client
        .from(table)
        .select("temple_id")
        .eq("id", id)
        .maybeSingle();
      if (existingError) return { ok: false, message: existingError.message };
      if (!existing || existing.temple_id !== profile.temple_id)
        return {
          ok: false,
          message: "You can manage only your assigned temple.",
        };
    }
  }
  let row: Record<string, unknown> = {
    name: text("name"),
    temple_id: templeId,
  };
  if (table === "targets") {
    const year = Number(text("year")),
      books = Number(text("books"));
    if (!Number.isInteger(year) || year < 1900 || year > 9998)
      return { ok: false, message: "Enter a valid year." };
    if (!Number.isInteger(books) || books <= 0)
      return { ok: false, message: "Enter a whole-number book target above zero." };
    if (!templeId && profile.role !== "admin")
      return { ok: false, message: "A movement-wide target is set for all temples." };
    row = { year, books, temple_id: templeId };
  }
  if (table === "monthly_targets") {
    const year = Number(text("year")),
      month = Number(text("month")),
      books = Number(text("books"));
    if (!Number.isInteger(year) || year < 1900 || year > 9998)
      return { ok: false, message: "Enter a valid year." };
    if (!Number.isInteger(month) || month < 1 || month > 12)
      return { ok: false, message: "Choose a month." };
    if (!Number.isInteger(books) || books <= 0)
      return { ok: false, message: "Enter a whole-number book target above zero." };
    if (!templeId)
      return { ok: false, message: "Monthly targets belong to one temple." };
    row = { year, month, books, temple_id: templeId };
  }
  if (table === "temples") {
    try {
      new Intl.DateTimeFormat("en", { timeZone: text("timezone") });
    } catch {
      return {
        ok: false,
        message: "Enter a valid time zone, such as Asia/Kolkata.",
      };
    }
    if (text("information").length > 2000)
      return { ok: false, message: "Temple information is too long." };
    if (text("contact").length > 500)
      return { ok: false, message: "Contact details are too long." };
    row = {
      name: text("name"),
      country: text("country"),
      city: text("city"),
      timezone: text("timezone"),
      information: text("information"),
      contact: text("contact"),
    };
    if (!text("country")) return { ok: false, message: "Country is required." };
  }
  let teamMemberIds: string[] = [];
  if (table === "teams") {
    const centreId = text("centre_id");
    if (centreId) {
      const { data: centre, error: centreError } = await client
        .from("centres")
        .select("id")
        .eq("id", centreId)
        .eq("temple_id", templeId)
        .maybeSingle();
      if (centreError) return { ok: false, message: centreError.message };
      if (!centre)
        return { ok: false, message: "Choose a centre from this temple." };
    }
    const unique = [
      ...new Set(
        form
          .getAll("member_id")
          .map((value) => String(value).trim())
          .filter(Boolean),
      ),
    ];
    const coordinatorId = text("coordinator_id");
    if (!unique.length)
      return {
        ok: false,
        message: "Select the team members first, then choose the team lead.",
      };
    if (!coordinatorId || !unique.includes(coordinatorId))
      return {
        ok: false,
        message: "Choose the team lead from the selected members.",
      };
    const { data: people, error: peopleError } = await client
      .from("individuals")
      .select("id, name")
      .eq("temple_id", templeId)
      .in("id", unique);
    if (peopleError) return { ok: false, message: peopleError.message };
    if ((people || []).length !== unique.length)
      return {
        ok: false,
        message: "Choose team members from this temple only.",
      };
    const lead = (people || []).find((person) => person.id === coordinatorId);
    if (!lead)
      return {
        ok: false,
        message: "Choose the team lead from the selected members.",
      };
    teamMemberIds = unique;
    row.coordinator_name = lead.name;
    row.centre_id = centreId || null;
  }
  if (table === "campaigns") {
    const target = text("target_books");
    const books = target ? Number(target) : null;
    if (target && (!Number.isInteger(books) || (books ?? 0) <= 0))
      return {
        ok: false,
        message: "Enter a whole-number book target, or leave it blank.",
      };
    row = {
      ...row,
      description: text("description"),
      instructions: text("instructions"),
      starts_on: text("starts_on"),
      ends_on: text("ends_on"),
      target_books: books,
    };
  }
  if (table === "content") {
    const kind = text("kind");
    const templeKinds = ["initiative", "event"];
    if (
      ![
        "story",
        "resource",
        "event",
        "initiative",
        "community_story",
      ].includes(kind)
    )
      return { ok: false, message: "Choose a valid content type." };
    if ((templeKinds.includes(kind) || (kind === "community_story" && profile.role !== "admin")) && !templeId)
      return {
        ok: false,
        message: "Choose the temple this belongs to.",
      };
    const storyType = text("story_type");
    const personName = text("person_name");
    if (kind === "community_story") {
      if (!isCommunityStoryType(storyType))
        return { ok: false, message: "Choose a story type." };
      if (!personName)
        return {
          ok: false,
          message: "Enter the name of the person this story belongs to.",
        };
      if (personName.length > 160)
        return { ok: false, message: "That name is too long." };
    }
    let imageUrl = text("image_url");
    if (kind === "story" || kind === "community_story") {
      const uploaded = await storeStoryPhoto(client, form.get("photograph"));
      if (!uploaded.ok) return uploaded;
      if (uploaded.url) imageUrl = uploaded.url;
      if (imageUrl && !/^https:\/\/\S+$/.test(imageUrl))
        return {
          ok: false,
          message: "Story photographs need an HTTPS image address.",
        };
    } else {
      imageUrl = "";
    }
    if (
      kind === "community_story" &&
      storyType === "media" &&
      !imageUrl &&
      !text("link_url")
    )
      return {
        ok: false,
        message: "Add a photograph or an HTTPS video link.",
      };
    row = {
      temple_id: templeId,
      centre_id: null,
      kind,
      story_type: kind === "community_story" ? storyType : "",
      person_name: kind === "community_story" ? personName : "",
      title: text("title"),
      body: text("body"),
      language: text("language"),
      link_url: text("link_url"),
      image_url: imageUrl,
      published: form.get("published") === "on",
      starts_at: text("starts_at") ? `${text("starts_at")}:00Z` : null,
      ends_at: text("ends_at") ? `${text("ends_at")}:00Z` : null,
      location: text("location"),
    };
  }
  const query = id
    ? client.from(table).update(row).eq("id", id)
    : client.from(table).insert(row);
  const { data, error } = await query.select("id").single();
  if (error)
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "You do not have access to this record."
          : error.code === "23505"
            ? table === "monthly_targets"
              ? "That temple already has a target for this month."
              : "A target already exists for this year and temple."
            : error.message,
    };
  if (table === "teams") {
    await client.from("team_members").delete().eq("team_id", data.id);
    const { error: memberError } = await client.from("team_members").insert(
      teamMemberIds.map((individual_id) => ({
        team_id: data.id,
        individual_id,
      })),
    );
    if (memberError)
      return {
        ok: false,
        message: memberError.message.includes("same temple")
          ? "Team members must belong to this temple."
          : memberError.message,
      };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved successfully.", id: data.id };
}

async function storeStoryPhoto(
  client: Awaited<ReturnType<typeof requireActor>>["client"],
  value: FormDataEntryValue | null,
): Promise<ActionResult & { url?: string }> {
  if (!(value instanceof File) || value.size === 0)
    return { ok: true, message: "", url: "" };
  if (value.size > 6 * 1024 * 1024)
    return { ok: false, message: "Photographs must be 6 MB or smaller." };
  const types: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const ext = types[value.type];
  if (!ext)
    return {
      ok: false,
      message: "Use a JPEG, PNG, WebP or GIF photograph.",
    };
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await client.storage
    .from("story-photos")
    .upload(path, value, { contentType: value.type, upsert: false });
  if (error)
    return {
      ok: false,
      message: error.message.toLowerCase().includes("not found")
        ? "Photograph storage is not ready yet. Paste an HTTPS image address instead."
        : error.message,
    };
  const { data } = client.storage.from("story-photos").getPublicUrl(path);
  return { ok: true, message: "", url: data.publicUrl };
}
