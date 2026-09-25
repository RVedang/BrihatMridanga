"use client";
import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { saveRecord, type ActionResult } from "@/app/portal/actions";
import type {
  Temple,
  RecordItem,
  Campaign,
  Content,
  Target,
  MonthlyTarget,
} from "@/lib/data";
import { Select } from "./select";
import { DateField, DateTimeField } from "./date-field";
import {
  communityStoryTypes,
  communityStoryTypeLabel,
} from "@/lib/story-types";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
function monthName(month: number) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, month - 1, 1)));
}
function monthTitle(year: number, month: number) {
  return `${monthName(month)} ${year}`;
}

function FilePick({
  name,
  accept,
}: {
  name: string;
  accept: string;
}) {
  const [file, setFile] = useState("");
  return (
    <div className="file-pick">
      <input
        name={name}
        type="file"
        accept={accept}
        onChange={(e) => setFile(e.target.files?.[0]?.name || "")}
      />
      <span className="file-pick-button">Choose photograph</span>
      <span className="file-pick-name">{file || "No file chosen"}</span>
    </div>
  );
}

function namesMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function TeamMembershipFields({
  people,
  memberIds,
  coordinatorName,
}: {
  people: RecordItem[];
  memberIds: string[];
  coordinatorName: string;
}) {
  const [chosen, setChosen] = useState(memberIds);
  const [coordinatorId, setCoordinatorId] = useState(() => {
    const match = people.find(
      (person) =>
        memberIds.includes(person.id) &&
        namesMatch(person.name, coordinatorName),
    );
    return match?.id || "";
  });
  const picked = people.filter((person) => chosen.includes(person.id));
  const setMembers = (ids: string[]) => {
    setChosen(ids);
    if (coordinatorId && !ids.includes(coordinatorId)) setCoordinatorId("");
  };
  return (
    <>
      <label className="full">
        Team members
        <Select
          name="member_id"
          multiple
          searchable
          required={people.length > 0}
          disabled={!people.length}
          placeholder={
            people.length
              ? "Search and add members"
              : "Add individuals for this temple first"
          }
          values={chosen}
          onValuesChange={setMembers}
        >
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </Select>
        {picked.length ? (
          <ul className="member-chips">
            {picked.map((person) => (
              <li key={person.id}>
                <span>{person.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${person.name}`}
                  onClick={() =>
                    setMembers(chosen.filter((id) => id !== person.id))
                  }
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <span className="muted">
            {people.length
              ? "Search the list and add everyone who belongs to this team."
              : "Add individuals for this temple first, then choose the members of this team."}
          </span>
        )}
      </label>
      <label className="full">
        Team lead
        <Select
          name="coordinator_id"
          required
          searchable
          disabled={!picked.length}
          placeholder={
            picked.length
              ? "Choose from the selected members"
              : "Select team members first"
          }
          value={
            picked.some((person) => person.id === coordinatorId)
              ? coordinatorId
              : ""
          }
          onChange={(e) => setCoordinatorId(e.target.value)}
        >
          {picked.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </Select>
        <span className="muted">
          The team lead must already be a member of this team. Their name
          appears with a Team lead mark on the temple page.
        </span>
      </label>
    </>
  );
}

type Props = {
  tab: string;
  admin: boolean;
  temples: Temple[];
  individuals: RecordItem[];
  teams: RecordItem[];
  centres: RecordItem[];
  campaigns: Campaign[];
  content: Content[];
  targets?: Target[];
  monthlyTargets?: MonthlyTarget[];
};
export function RecordForms(props: Props) {
  const [type, setType] = useState(
    props.tab === "records"
      ? "individuals"
      : props.tab === "campaigns"
        ? "campaigns"
        : props.tab === "temples"
          ? "temples"
          : props.tab === "targets"
            ? "targets"
            : "content",
  );
  const [edit, setEdit] = useState<string>("");
  const [formKey, setFormKey] = useState(0);
  const [templeId, setTempleId] = useState(
    !props.admin
      ? props.temples[0]?.id || ""
      : props.tab === "content"
        ? ""
        : props.temples[0]?.id || "",
  );
  const templeName = (id: string | null) =>
    id
      ? props.temples.find((t) => t.id === id)?.name || "Temple"
      : "Movement-wide";
  const startNew = () => {
    setEdit("");
    setFormKey((k) => k + 1);
  };
  const chooseTemple = (id: string) => {
    setTempleId(id);
    startNew();
  };
  const scoped = <T extends { temple_id?: string | null }>(items: T[]) =>
    items.filter((item) => item.temple_id === templeId);
  const records =
    type === "individuals"
      ? scoped(props.individuals)
      : type === "teams"
        ? scoped(props.teams)
        : type === "centres"
          ? scoped(props.centres)
          : type === "campaigns"
            ? props.campaigns.filter(
                (c) => !c.temple_id || c.temple_id === templeId,
              )
            : type === "temples"
              ? props.temples
              : type === "targets"
                ? (props.targets || [])
                    .filter((g) => !g.temple_id || g.temple_id === templeId)
                    .map((g) => ({
                      ...g,
                      name: `${g.year} · ${templeName(g.temple_id)} · ${g.books.toLocaleString("en-IN")} books`,
                    }))
                : type === "monthly_targets"
                  ? (props.monthlyTargets || [])
                      .filter((g) => g.temple_id === templeId)
                      .map((g) => ({
                        ...g,
                        name: `${monthTitle(g.year, g.month)} · ${templeName(g.temple_id)} · ${g.books.toLocaleString("en-IN")} books`,
                      }))
                : !templeId
                  ? props.content
                  : props.content.filter(
                      (c) => !c.temple_id || c.temple_id === templeId,
                    );
  const recordTitle = (r: (typeof records)[number]) =>
    "name" in r ? r.name : r.title;
  const recordMeta = (r: (typeof records)[number]) => {
    if (type === "temples" && "city" in r)
      return [r.city, "country" in r ? r.country : ""]
        .filter(Boolean)
        .join(" · ");
    if (type === "campaigns" && "temple_id" in r)
      return r.temple_id
        ? `Regional · ${templeName(String(r.temple_id))}`
        : "Movement-wide";
    if (type === "teams") {
      const centre =
        "centre_id" in r && r.centre_id
          ? props.centres.find((c) => c.id === r.centre_id)?.name
          : "";
      const lead =
        "coordinator_name" in r && r.coordinator_name
          ? String(r.coordinator_name)
          : "";
      return [centre, lead].filter(Boolean).join(" · ");
    }
    if (
      "kind" in r &&
      (r.kind === "community_story" || r.kind === "story")
    )
      return communityStoryTypeLabel(
        "story_type" in r ? String(r.story_type || "") : "",
      );
    if ("kind" in r && r.kind) {
      const labels: Record<string, string> = {
        resource: "Resource",
        event: "Temple event",
        photo: "Photograph",
        testimonial: "Testimonial",
        initiative: "Local initiative",
      };
      return labels[String(r.kind)] || String(r.kind);
    }
    return "";
  };
  const selected = records.find((r) => r.id === edit) as unknown as
    Record<string, string | boolean> | undefined;
  return (
    <div className="editorial-grid">
      <section>
        {props.tab === "records" && (
          <div className="segmented">
            {(
              [
                ["individuals", "Individuals"],
                ["teams", "Teams"],
                ...(!props.admin
                  ? ([["centres", "Center"]] as const)
                  : []),
              ] as const
            ).map(([t, label]) => (
              <button
                key={t}
                aria-pressed={t === type}
                onClick={() => {
                  setType(t);
                  if (!templeId) setTempleId(props.temples[0]?.id || "");
                  startNew();
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {props.tab === "targets" && (
          <div className="segmented">
            {[
              ["targets", "Annual"],
              ["monthly_targets", "Monthly"],
            ].map(([t, label]) => (
              <button
                key={t}
                aria-pressed={t === type}
                onClick={() => {
                  setType(t);
                  if (t === "monthly_targets" && !templeId)
                    setTempleId(props.temples[0]?.id || "");
                  startNew();
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {props.tab === "temples" && props.admin && (
          <div className="segmented">
            {(
              [
                ["temples", "Temples"],
                ["centres", "Center"],
              ] as const
            ).map(([t, label]) => (
              <button
                key={t}
                aria-pressed={t === type}
                onClick={() => {
                  setType(t);
                  if (!templeId) setTempleId(props.temples[0]?.id || "");
                  startNew();
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <Editor
          key={`${type}-${edit || "new"}-${formKey}-${templeId}`}
          type={type}
          selected={selected}
          temples={props.temples}
          centres={props.centres}
          individuals={props.individuals}
          memberIds={
            type === "teams"
              ? ((records.find((r) => r.id === edit) as RecordItem | undefined)
                  ?.member_ids || [])
              : []
          }
          admin={props.admin}
          templeId={templeId}
          onTempleId={chooseTemple}
        />
      </section>
      <aside className="record-rail">
        <div className="record-rail-head">
          <div>
            <p className="eyebrow">Library</p>
            <h2>Existing records</h2>
          </div>
          <button
            className="record-new"
            type="button"
            onClick={() => startNew()}
          >
            <Plus size={15} strokeWidth={1.7} />
            New
          </button>
        </div>
        {records.length ? (
          <ul className="record-list">
            {records.map((r) => {
              const meta = recordMeta(r);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    className={
                      r.id === edit ? "record-item is-active" : "record-item"
                    }
                    onClick={() => {
                      setEdit(r.id);
                      if (type === "content" && "temple_id" in r)
                        setTempleId(String(r.temple_id || ""));
                    }}
                  >
                    <span className="record-item-title">{recordTitle(r)}</span>
                    {meta ? (
                      <span className="record-item-meta">{meta}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted record-empty">No records yet. Create the first.</p>
        )}
      </aside>
    </div>
  );
}
function Editor({
  type,
  selected,
  temples,
  centres,
  individuals,
  memberIds,
  admin,
  templeId,
  onTempleId,
}: {
  type: string;
  selected?: Record<string, string | boolean>;
  temples: Temple[];
  centres: RecordItem[];
  individuals: RecordItem[];
  memberIds: string[];
  admin: boolean;
  templeId: string;
  onTempleId: (id: string) => void;
}) {
  const [state, action, pending] = useActionState(saveRecord, {
    ok: false,
    message: "",
  } as ActionResult);
  const [kind, setKind] = useState(() => {
    if (!selected?.kind) return "";
    const current = String(selected.kind);
    if (current === "story" || current === "photo" || current === "testimonial")
      return "community_story";
    return current;
  });
  const templeBound = ["initiative", "event"].includes(kind);
  const value = (key: string, fallback = "") =>
    String(selected?.[key] ?? fallback);
  const templeCentres = centres.filter((c) => c.temple_id === templeId);
  const templePeople = individuals.filter((p) => p.temple_id === templeId);
  return (
    <form action={action} className="panel workspace-form">
      <h2>
        {selected ? "Edit" : "Add"}{" "}
        {type === "content"
          ? "content"
          : type === "individuals"
            ? "individual"
            : type === "temples"
              ? "temple"
              : type === "centres"
                ? "center"
                : type === "teams"
                  ? "team"
                  : type === "targets"
                    ? "annual target"
                    : type === "monthly_targets"
                      ? "monthly target"
                      : "campaign"}
      </h2>
      <p className="muted">
        {selected
          ? "Update this record. Changes appear on the public site when they are meant to be public."
          : "Fill the details below. You can return to any record from the list beside this form."}
      </p>
      <input type="hidden" name="table" value={type} />
      <input type="hidden" name="id" value={selected ? value("id") : ""} />
      <div className="form-grid">
        {type !== "temples" &&
          (admin ? (
            <label className="full">
              Temple
              <Select
                key={`temple-${kind}`}
                name="temple_id"
                searchable
                required={
                  !["content", "campaigns", "targets"].includes(type) ||
                  (type === "content" && templeBound)
                }
                value={templeId}
                onChange={(e) => onTempleId(e.target.value)}
                disabled={!!selected}
              >
                {type === "campaigns" && (
                  <option value="">Movement-wide (all temples)</option>
                )}
                {type === "content" && !templeBound && (
                  <option value="">All temples</option>
                )}
                {type === "targets" && (
                  <option value="">Movement-wide (all temples)</option>
                )}
                {temples.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
              {selected && (
                <input
                  type="hidden"
                  name="temple_id"
                  value={value("temple_id")}
                />
              )}
            </label>
          ) : (
            <label>
              Temple
              <span className="field-static">
                {temples.find((t) => t.id === templeId)?.name ||
                  temples[0]?.name ||
                  "Your temple"}
              </span>
              <input
                type="hidden"
                name="temple_id"
                value={temples[0]?.id || ""}
              />
            </label>
          ))}
        {type !== "content" &&
          type !== "targets" &&
          type !== "monthly_targets" && (
          <label className="full">
            Name
            <input
              name="name"
              required
              maxLength={160}
              defaultValue={value("name")}
            />
          </label>
        )}
        {type === "targets" && (
          <>
            <label>
              Year
              <input
                name="year"
                type="number"
                min={1900}
                max={9998}
                required
                defaultValue={value("year", String(new Date().getUTCFullYear()))}
              />
            </label>
            <label>
              Book target
              <input
                name="books"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={value("books")}
              />
            </label>
            <p className="muted full">
              Progress toward this target appears on the public dashboard. Each
              temple may set one target per year. A movement-wide target can
              also be set.
            </p>
          </>
        )}
        {type === "monthly_targets" && (
          <>
            <label>
              Year
              <input
                name="year"
                type="number"
                min={1900}
                max={9998}
                required
                defaultValue={value("year", String(new Date().getUTCFullYear()))}
              />
            </label>
            <label>
              Month
              <Select
                name="month"
                required
                defaultValue={value(
                  "month",
                  String(new Date().getUTCMonth() + 1),
                )}
              >
                {MONTHS.map((month) => (
                  <option key={month} value={String(month)}>
                    {monthName(month)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="full">
              Book target
              <input
                name="books"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={value("books")}
              />
            </label>
            <p className="muted full">
              These figures appear on the temple&apos;s public page. One target
              per month.
            </p>
          </>
        )}
        {type === "teams" && (
          <>
            <label className="full">
              Centre
              <Select
                key={`team-centre-${templeId}`}
                name="centre_id"
                disabled={!templeCentres.length}
                placeholder={
                  templeCentres.length
                    ? "Choose a centre"
                    : "Add a centre for this temple first"
                }
                defaultValue={value("centre_id")}
              >
                {templeCentres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </label>
            <TeamMembershipFields
              key={templeId}
              people={templePeople}
              memberIds={memberIds}
              coordinatorName={value("coordinator_name")}
            />
          </>
        )}
        {type === "temples" && (
          <>
            <label>
              Country
              <input name="country" required defaultValue={value("country")} />
            </label>
            <label>
              City
              <input name="city" defaultValue={value("city")} />
            </label>
            <label className="full">
              Time zone
              <input
                name="timezone"
                required
                defaultValue={value("timezone", "Asia/Kolkata")}
              />
            </label>
            <label className="full">
              Temple information
              <textarea
                name="information"
                rows={4}
                maxLength={2000}
                defaultValue={value("information")}
              />
              <span className="muted">
                Shown on the public temple page under the name. Brief history,
                programmes, or visiting notes.
              </span>
            </label>
            <label className="full">
              Contact details
              <textarea
                name="contact"
                rows={3}
                maxLength={500}
                defaultValue={value("contact")}
              />
              <span className="muted">
                Phone, email, address, or visiting hours for the public page.
              </span>
            </label>
          </>
        )}
        {type === "campaigns" && (
          <>
            <label>
              Start date
              <DateField
                name="starts_on"
                required
                defaultValue={value("starts_on")}
              />
            </label>
            <label>
              End date
              <DateField
                name="ends_on"
                required
                defaultValue={value("ends_on")}
              />
            </label>
            <label className="full">
              Description
              <textarea
                name="description"
                defaultValue={value("description")}
              />
            </label>
            <label className="full">
              Participation instructions
              <textarea
                name="instructions"
                defaultValue={value("instructions")}
                placeholder="How devotees should take part"
              />
            </label>
            <label>
              Book target
              <input
                name="target_books"
                type="number"
                min={1}
                step={1}
                defaultValue={value("target_books")}
              />
            </label>
            <p className="muted full">
              Live progress on the campaign page uses this target. If it is
              blank, the temple’s annual target is used for a regional campaign,
              or the movement-wide annual target for a shared campaign.
              The Whole-Year Marathon covers distributions outside a special
              campaign. A regional
              campaign is tied to one temple only
              {admin
                ? " — choose that temple above."
                : " — this form creates one for your temple."}
            </p>
          </>
        )}
        {type === "content" && (
          <>
            <label>
              Content type
              <Select
                name="kind"
                required
                placeholder="Choose a type"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="community_story">Story</option>
                <option value="resource">Resource</option>
                <option value="event">Temple event</option>
                <option value="initiative">Local initiative</option>
              </Select>
            </label>
            {kind === "community_story" && (
              <label>
                Story type
                <Select
                  name="story_type"
                  required
                  defaultValue={
                    String(selected?.kind) === "photo"
                      ? "media"
                      : String(selected?.kind) === "testimonial"
                        ? "distributor"
                        : value("story_type")
                  }
                >
                  <option value="">Choose a type</option>
                  {Object.entries(communityStoryTypes).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
            )}
            {kind === "community_story" && (
              <p className="muted full">
                These stories appear on the Stories page, grouped by type, and
                on the homepage when published.
              </p>
            )}
            {templeBound && (
              <p className="muted full">
                Initiatives and events appear on that temple’s public page.
              </p>
            )}
            <label>
              Language
              <input
                name="language"
                required
                defaultValue={value("language", "English")}
              />
            </label>
            <label className="full">
              Title
              <input
                name="title"
                required
                maxLength={160}
                defaultValue={value("title")}
              />
            </label>
            <label className="full">
              {kind === "community_story" ? "Story" : "Text"}
              <textarea
                name="body"
                rows={kind === "community_story" ? 8 : undefined}
                defaultValue={value("body")}
              />
            </label>
            {kind === "community_story" && (
              <label className="full">
                Photograph
                {value("image_url") ||
                (String(selected?.kind) === "photo" && value("link_url")) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="story-photo-preview"
                    src={
                      value("image_url") ||
                      (String(selected?.kind) === "photo"
                        ? value("link_url")
                        : "")
                    }
                    alt=""
                  />
                ) : null}
                <FilePick
                  name="photograph"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                />
                <input
                  name="image_url"
                  type="url"
                  pattern="https://.*"
                  defaultValue={
                    value("image_url") ||
                    (String(selected?.kind) === "photo" ? value("link_url") : "")
                  }
                  placeholder="https://…"
                />
                <span className="muted">
                  JPEG, PNG, WebP or GIF, up to 6 MB, or paste an HTTPS image
                  address. Use this for photos and short-video stills.
                </span>
              </label>
            )}
            <label className="full">
              {kind === "community_story"
                ? "Video or related link (optional, HTTPS)"
                : "Resource, video or event link (HTTPS)"}
              <input
                name="link_url"
                type="url"
                pattern="https://.*"
                defaultValue={
                  String(selected?.kind) === "photo" ? "" : value("link_url")
                }
                placeholder="https://…"
              />
              {kind === "community_story" ? (
                <span className="muted">
                  YouTube or Vimeo links play on the story page. Other HTTPS
                  links are shown as related reading.
                </span>
              ) : null}
            </label>
            {kind === "event" && (
              <>
                <label>
                  Starts at (UTC)
                  <DateTimeField
                    name="starts_at"
                    required
                    defaultValue={value("starts_at").slice(0, 16)}
                  />
                </label>
                <label>
                  Ends at (UTC)
                  <DateTimeField
                    name="ends_at"
                    required
                    defaultValue={value("ends_at").slice(0, 16)}
                  />
                </label>
                <label className="full">
                  Location / meeting details
                  <input name="location" defaultValue={value("location")} />
                </label>
              </>
            )}
            <label className="full">
              <input
                name="published"
                type="checkbox"
                defaultChecked={Boolean(selected?.published)}
              />
              {kind === "community_story"
                ? "Publish on the homepage and Stories page (leave unchecked to save a draft)"
                : "Publish publicly (leave unchecked to save a private draft)"}
            </label>
          </>
        )}
      </div>
      {state.message && (
        <p role="status" className="notice">
          {state.message}
        </p>
      )}
      <button
        className="button"
        disabled={
          pending ||
          (!admin && type === "temples") ||
          (!admin && !temples.length)
        }
      >
        {pending ? "Saving…" : selected ? "Save changes" : "Save"}
      </button>
    </form>
  );
}
