"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Select } from "@/components/select";
import { submitDistribution } from "@/app/portal/actions";
import {
  weeklyTotals,
  distributionPoints,formatPoints,
  weeklyCategories,
  emptyQuantities,
  reportingMonday,
  coordinatorDeadline,
} from "@/lib/weekly-distribution";
import { shiftDate, todayIn, dateLabel } from "@/lib/dates";
import type { Temple, Campaign, RecordItem, WeeklyReport } from "@/lib/data";

type Props = {
  temples: Temple[];
  campaigns: Campaign[];
  centres: RecordItem[];
  individuals: RecordItem[];
  teams: RecordItem[];
  preview?: boolean;
  existing?: WeeklyReport;
  admin?: boolean;
  initialWeek?: string;
  templeId?: string;
};
export function ReportForm({
  temples,
  campaigns,
  centres,
  individuals,
  teams,
  preview,
  existing,
  admin,
  initialWeek,
  templeId,
}: Props) {
  const router = useRouter();
  const temple = temples.find((t) => t.id === templeId);
  const today = todayIn(temple?.timezone),
    current = reportingMonday(today);
  const [week, setWeek] = useState(initialWeek || current);
  const [year, setYear] = useState(Number(week.slice(0, 4)));
  const weeks: string[] = [];
  let monday = reportingMonday(
    String(Math.max(1, Math.min(9999, year || 1))).padStart(4, "0") + "-01-01",
  );
  if (Number(monday.slice(0, 4)) < year) monday = shiftDate(monday, 0, 7);
  for (
    ;
    monday <= current && Number(monday.slice(0, 4)) === year;
    monday = shiftDate(monday, 0, 7)
  )
    weeks.push(monday);
  const [q, setQ] = useState(existing || emptyQuantities());
  const [pending, setPending] = useState(existing?.pending || 0);
  const [tags, setTags] = useState(existing?.tags || {});
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false);
  const [msg, message] = useState(""),
    [link, setLink] = useState("");
  const locked =
    existing && !admin && today > coordinatorDeadline(existing.submitted_on);
  const totals = weeklyTotals(q, pending);
  function select(t: string, w: string) {
    setWeek(w);
    if (!preview) {
      setLoading(true);
      router.push("/portal?temple=" + t + "&week=" + w);
    }
  }
  return (
    <form
      className="panel workspace-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (preview || busy || locked || loading) return;
        setBusy(true);
        try {
          const result = await submitDistribution({
            temple: templeId,
            week,
            quantities: Object.fromEntries(
              weeklyCategories.map(([k]) => [k, q[k]]),
            ),
            pending,
            tags,
            id: existing?.id,
            version: existing?.version,
          });
          message(result.message);
          if (result.id) {
            if (result.ok) {
              router.replace("/portal?edit=" + result.id);
              router.refresh();
            } else setLink("/portal?edit=" + result.id);
          }
        } catch {
          message(
            "Unable to confirm the save. Reopen the reporting week to check its latest version.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-grid">
        <div className="weekly-report-select">
          <label htmlFor={admin ? "report-temple-trigger" : "report-temple"}>
            Temple Name
          </label>
          {admin ? (
            <Select
              id="report-temple"
              value={templeId}
              disabled={loading}
              onChange={(e) => select(e.target.value, week)}
            >
              {temples.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          ) : (
            <input
              id="report-temple"
              value={temple?.name || "Preview temple"}
              readOnly
            />
          )}
        </div>
        <label>
          Reporting year
          <input
            type="number"
            min="1"
            max={current.slice(0, 4)}
            value={year}
            onChange={(e) => setYear(Math.trunc(Number(e.target.value)))}
          />
        </label>
        <div className="weekly-report-select">
          <label htmlFor="report-week-trigger">Reporting Week</label>
          <Select
            id="report-week"
            placeholder="Select week"
            disabled={loading}
            value={weeks.includes(week) ? week : ""}
            onChange={(e) => select(templeId || "", e.target.value)}
          >
            {[...weeks].reverse().map((w) => (
              <option key={w} value={w}>
                {dateLabel(w)} – {dateLabel(shiftDate(w, 0, 6))}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {existing && (
        <p className="notice">
          {locked
            ? "Coordinator editing has closed."
            : "Editing the existing weekly report."}
        </p>
      )}
      <fieldset
        className="weekly-report-fields"
        disabled={!!locked || busy || loading || !weeks.includes(week)}
      >
        <div className="form-grid">
          {weeklyCategories.map(([key, label, help]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                min="0"
                step="1"
                required
                value={q[key]}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (
                    Number.isSafeInteger(n) &&
                    n >= 0 &&
                    n <= Number.MAX_SAFE_INTEGER / 10
                  )
                    setQ({ ...q, [key]: n });
                }}
              />
              {help && <small>{help}</small>}
            </label>
          ))}
        </div>
        {!!existing?.pending && (
          <label>
            Category breakdown pending
            <input
              type="number"
              min="0"
              max={existing.pending}
              value={pending}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isSafeInteger(n) && n >= 0 && n <= existing.pending)
                  setPending(n);
              }}
            />
            <small>
              Move confirmed books into the categories above and reduce the
              pending amount by the same quantity.
            </small>
          </label>
        )}
        {Object.entries({ centres, teams, individuals, campaigns }).map(
          ([k, items]) => {
            const options = items.filter(
              (i) => !i.temple_id || i.temple_id === templeId,
            );
            return (
              !!options.length && (
                <div className="weekly-report-select" key={k}>
                  <label htmlFor={`report-${k}-trigger`}>Participating {k}</label>
                  <Select
                    id={`report-${k}`}
                    multiple
                    placeholder={`Select ${k}`}
                    values={tags[k] || []}
                    onValuesChange={(values) =>
                      setTags((previous) => ({ ...previous, [k]: values }))
                    }
                  >
                    {options.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </Select>
                  {options
                    .filter((i) => i.logo_url && tags[k]?.includes(i.id))
                    .map((i) => (
                      <Image unoptimized
                        key={i.id}
                        src={i.logo_url!}
                        alt={i.name + " logo"}
                        width={48}
                        height={48}
                      />
                    ))}
                </div>
              )
            );
          },
        )}
        <p aria-live="polite">
          Total books distributed <strong>{totals.books}</strong> · Total sets
          distributed <strong>{totals.sets}</strong> · Points <strong>{formatPoints(distributionPoints(q))}</strong>
        </p>
        {!preview && (
          <button className="button" disabled={busy}>
            {existing ? "Save changes" : "Submit weekly report"}
          </button>
        )}
      </fieldset>
      {msg && (
        <p role="status">
          {msg} {link && <Link href={link}>Open existing report</Link>}
        </p>
      )}
    </form>
  );
}
