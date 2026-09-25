"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import {
  calculateDistribution,
  categoryLabel,
  type Book,
  type QuantityLine,
} from "@/lib/catalog";
import type { Temple, Campaign, RecordItem, Distribution } from "@/lib/data";
import { submitDistribution } from "@/app/portal/actions";
import { number } from "./ui";
import { Select } from "./select";
import { DateField } from "./date-field";
type Props = {
  books: Book[];
  temples: Temple[];
  campaigns: Campaign[];
  centres: RecordItem[];
  individuals: RecordItem[];
  teams: RecordItem[];
  preview?: boolean;
  existing?: Distribution;
  admin?: boolean;
};
export function ReportForm({
  books,
  temples,
  campaigns,
  centres,
  individuals,
  teams,
  preview = false,
  existing,
  admin = false,
}: Props) {
  const router = useRouter();
  const [templeId, setTemple] = useState(
    existing?.temple_id || temples[0]?.id || "",
  );
  const [mode, setMode] = useState<"detailed" | "total">(
    existing?.mode || "detailed",
  );
  const [lines, setLines] = useState<QuantityLine[]>(
    existing?.lines.map((l) => ({
      bookId: l.bookId,
      quantity: l.quantity,
    })) || [{ bookId: "", quantity: 1 }],
  );
  const [total, setTotal] = useState(existing?.book_count || 1),
    [language, setLanguage] = useState("");
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  const [submission, setSubmission] = useState<{
    id: string;
    requestId: string;
  } | null>(null);
  const [retryPayload, setRetryPayload] = useState<Record<
    string,
    unknown
  > | null>(null);
  let count = mode === "total" ? total : 0,
    sets = 0,
    points: number | null = null,
    calculationError = "";
  if (mode === "detailed")
    try {
      const result = calculateDistribution(
        books,
        lines.filter((l) => l.bookId),
      );
      count = result.count;
      sets = result.sets;
      points = result.points;
    } catch (e) {
      calculationError = (e as Error).message;
    }
  const filtered = books.filter((b) => !language || b.language === language);
  const scope = (records: RecordItem[]) =>
    records.filter((r) => r.temple_id === templeId);
  const temple = temples.find((t) => t.id === templeId);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: temple?.timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  async function publish(form: FormData) {
    if (busy || saved) return;
    setMessage("");
    if (calculationError) {
      setMessage(calculationError);
      return;
    }
    if (mode === "detailed" && lines.some((l) => !l.bookId)) {
      setMessage("Choose a book for every row.");
      return;
    }
    const ids = submission || {
      id: existing?.id || crypto.randomUUID(),
      requestId: crypto.randomUUID(),
    };
    setSubmission(ids);
    const payload = retryPayload || {
      ...ids,
      templeId,
      version: existing?.version || 0,
      date: form.get("date"),
      centreId: form.get("centreId"),
      individualId: form.get("individualId"),
      teamId: form.get("teamId"),
      campaignId: form.get("campaignId"),
      mode,
      lines: mode === "detailed" ? lines : [],
      total: mode === "total" ? total : null,
      reason: form.get("reason"),
    };
    setBusy(true);
    try {
      const result = await submitDistribution(payload);
      setMessage(result.message);
      if (result.ok) {
        setSaved(true);
        setRetryPayload(null);
        router.refresh();
      } else {
        setSubmission(null);
        setRetryPayload(null);
      }
    } catch {
      setRetryPayload(payload);
      setMessage(
        "The connection was interrupted. Retry the same submission to confirm its status safely.",
      );
    } finally {
      setBusy(false);
    }
  }
  function updateLine(index: number, patch: Partial<QuantityLine>) {
    setLines(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  return (
    <form action={publish} className="workspace-form">
      <div className="report-layout">
        <div>
          <fieldset
            disabled={busy || saved || !!retryPayload}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
          >
            <div className="panel">
              <h2>
                {existing
                  ? "Correct this distribution"
                  : "Distribution details"}
              </h2>
              <p className="muted">
                Enter each distribution once. Individual, team and temple totals
                use this same entry.
              </p>
              <div className="form-grid">
                <label>
                  Temple
                  {admin || preview ? (
                    <Select
                      value={templeId}
                      required={!preview}
                      searchable
                      onChange={(e) => setTemple(e.target.value)}
                      disabled={!!existing || preview}
                    >
                      {!temples.length && (
                        <option value="">Choose after signing in</option>
                      )}
                      {temples.map((t) => (
                        <option value={t.id} key={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <span className="field-static">
                      {temple?.name || "Your temple"}
                    </span>
                  )}
                </label>
                <label>
                  Distribution date
                  <DateField
                    name="date"
                    defaultValue={existing?.distributed_on || today}
                    max={today}
                    required
                  />
                </label>
                <label className="full">
                  Campaign
                  <Select
                    name="campaignId"
                    key={`campaign-${templeId}`}
                    defaultValue={existing?.campaign_id || ""}
                  >
                    <option value="">Whole-Year Marathon</option>
                    {campaigns
                      .filter(
                        (c) =>
                          !c.fallback_year &&
                          (!c.temple_id || c.temple_id === templeId),
                      )
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </Select>
                  <span className="muted">
                    The selected campaign must include the distribution date.
                  </span>
                </label>
                <label>
                  Centre (optional)
                  <Select
                    name="centreId"
                    key={`centre-${templeId}`}
                    defaultValue={existing?.centre_id || ""}
                  >
                    <option value="">Temple directly</option>
                    {scope(centres).map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label>
                  Team (optional)
                  <Select
                    name="teamId"
                    key={`team-${templeId}`}
                    defaultValue={existing?.team_id || ""}
                  >
                    <option value="">No team attribution</option>
                    {scope(teams).map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="full">
                  Individual (optional)
                  <Select
                    name="individualId"
                    key={`person-${templeId}`}
                    defaultValue={existing?.individual_id || ""}
                  >
                    <option value="">No individual attribution</option>
                    {scope(individuals).map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
            </div>
            <div className="panel">
              <h2>Books distributed</h2>
              <div
                className="segmented"
                role="group"
                aria-label="Reporting detail"
              >
                <button
                  type="button"
                  aria-pressed={mode === "detailed"}
                  onClick={() => setMode("detailed")}
                >
                  Book details
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "total"}
                  onClick={() => setMode("total")}
                >
                  Total count only
                </button>
              </div>
              {mode === "total" ? (
                <>
                  <label>
                    Total items distributed
                    <input
                      type="number"
                      min="1"
                      max="1000000"
                      step="1"
                      required
                      value={total || ""}
                      onChange={(e) => setTotal(Number(e.target.value))}
                    />
                  </label>
                  <p className="notice">
                    Books will be counted immediately. Points remain incomplete
                    until you add book details to this same report.
                  </p>
                </>
              ) : (
                <>
                  <label>
                    Filter book choices by language
                    <Select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="">All languages</option>
                      {[...new Set(books.map((b) => b.language))]
                        .sort()
                        .map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                    </Select>
                  </label>
                  <div style={{ marginTop: 25 }}>
                    {lines.map((line, i) => {
                      const selected = books.find((b) => b.id === line.bookId);
                      const options =
                        selected && !filtered.some((b) => b.id === selected.id)
                          ? [selected, ...filtered]
                          : filtered;
                      return (
                        <div className="book-line" key={i}>
                          <span className="book-line-kicker" id={`book-kicker-${i}`}>
                            Book {i + 1}
                          </span>
                          <span className="book-line-kicker book-line-kicker-qty">
                            {selected && selected.volumes > 1
                              ? "Number of sets"
                              : "Quantity"}
                          </span>
                          <span className="book-line-kicker-spacer" aria-hidden="true" />
                          <Select
                            className="book-line-select"
                            aria-labelledby={`book-kicker-${i}`}
                            value={line.bookId}
                            required
                            onChange={(e) =>
                              updateLine(i, { bookId: e.target.value })
                            }
                          >
                            <option value="">Select a book</option>
                            {options.map((b) => (
                              <option value={b.id} key={b.id}>
                                {`#${b.id} · ${b.name} · ${b.language}`}
                              </option>
                            ))}
                          </Select>
                          <input
                            className="book-line-amount"
                            aria-label={`Quantity ${i + 1}`}
                            type="number"
                            step="1"
                            min="1"
                            max="1000000"
                            required
                            value={line.quantity || ""}
                            onChange={(e) =>
                              updateLine(i, {
                                quantity: Number(e.target.value),
                              })
                            }
                          />
                          <button
                            aria-label={`Remove book ${i + 1}`}
                            disabled={lines.length === 1}
                            type="button"
                            className="icon-button book-line-remove"
                            onClick={() =>
                              setLines(lines.filter((_, n) => n !== i))
                            }
                          >
                            <X size={14} />
                          </button>
                          {selected && (
                            <span className="muted book-line-meta">
                              {categoryLabel(selected.category)} ·{" "}
                              {selected.score} points each
                              {selected.volumes > 1
                                ? ` · ${selected.volumes} books per set`
                                : ""}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() =>
                      setLines([...lines, { bookId: "", quantity: 1 }])
                    }
                  >
                    <Plus size={15} /> Add another book
                  </button>
                </>
              )}
              {existing && (
                <label style={{ marginTop: 25 }}>
                  Reason for correction
                  <textarea
                    name="reason"
                    required
                    minLength={3}
                    placeholder="Explain what changed"
                  />
                </label>
              )}
            </div>
          </fieldset>
          {message && (
            <p role="status" className="notice">
              {message}
            </p>
          )}
          {calculationError && (
            <p role="alert" className="error">
              {calculationError}
            </p>
          )}
          {!preview && (
            <div className="form-actions">
              <button
                type="submit"
                className="button"
                disabled={busy || saved || !templeId}
              >
                {busy
                  ? "Publishing…"
                  : saved
                    ? "Published"
                    : retryPayload
                      ? "Retry same submission"
                      : existing
                        ? "Publish correction"
                        : "Publish distribution"}
              </button>
              <span className="muted">Scores become public immediately.</span>
            </div>
          )}
        </div>
        <aside className="summary-box">
          <p className="eyebrow">Your offering</p>
          <h3>Distribution summary</h3>
          <p>
            Total books
            <strong>{number(count || 0)}</strong>
            {mode === "detailed"
              ? "Each volume in a set is counted"
              : "Entered as a book total"}
          </p>
          <hr />
          <p>
            Sets distributed
            <strong>
              {mode === "total" ? "Incomplete" : number(sets || 0)}
            </strong>
            {mode === "total"
              ? "Add book details to count complete sets."
              : "One complete set, plus every book in it."}
          </p>
          <hr />
          <p>
            {mode === "total" ? "Points status" : "Calculated points"}
            <strong>
              {points === null ? "Incomplete" : number(points || 0)}
            </strong>
            {mode === "total"
              ? "Add book details later to complete scoring."
              : "Set scores apply once per set."}
          </p>
          {preview && (
            <p className="notice">Form preview only. No report is saved.</p>
          )}
        </aside>
      </div>
    </form>
  );
}
