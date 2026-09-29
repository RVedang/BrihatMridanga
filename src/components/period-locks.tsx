"use client";
import { useActionState } from "react";
import type { Temple } from "@/lib/data";
import { setPeriodLock, type ActionResult } from "@/app/portal/actions";
import { Select } from "./select";
import { MonthField } from "./date-field";
import { monthLabel, todayIn } from "@/lib/dates";

export type PeriodLock = { temple_id: string; month: string };

export function PeriodLocks({
  temples,
  locks,
}: {
  temples: Temple[];
  locks: PeriodLock[];
}) {
  const [state, action, pending] = useActionState(setPeriodLock, {
    ok: false,
    message: "",
  } as ActionResult);
  const name = (id: string) => temples.find((t) => t.id === id)?.name || "Temple";
  return (
    <section className="panel workspace-form" aria-labelledby="period-locks-title">
      <h2 id="period-locks-title">Closed months</h2>
      <p className="muted">
        No one can add or correct reports in a closed month for that temple.
        Reopen the month to make a correction.
      </p>
      <form action={action} className="form-grid">
        <label>
          Temple
          <Select name="temple_id" required searchable defaultValue={temples[0]?.id || ""}>
            {temples.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </label>
        <label>
          Month
          <MonthField
            name="month"
            required
            defaultValue={todayIn().slice(0, 7)}
            aria-label="Month to close"
          />
        </label>
        <div className="form-actions full">
          <button className="button" name="intent" value="close" disabled={pending}>
            Close month
          </button>
        </div>
      </form>
      {state.message && (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "notice" : "error"}>
          {state.message}
        </p>
      )}
      {locks.length ? (
        <ul className="record-list" style={{ marginTop: 20 }}>
          {locks.map((l) => (
            <li key={`${l.temple_id}-${l.month}`}>
              <form action={action} className="period-lock-row">
                <input type="hidden" name="temple_id" value={l.temple_id} />
                <input type="hidden" name="month" value={l.month.slice(0, 7)} />
                <span>
                  {name(l.temple_id)} · {monthLabel(l.month.slice(0, 7))}
                </span>
                <button
                  className="button secondary"
                  name="intent"
                  value="reopen"
                  disabled={pending}
                >
                  Reopen
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ marginTop: 20 }}>
          No months are closed.
        </p>
      )}
    </section>
  );
}
