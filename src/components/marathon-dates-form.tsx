"use client";
import { useActionState } from "react";
import { setMarathonDates } from "@/app/portal/marathon-actions";
import type { MarathonEntry } from "@/lib/marathon-data";
export function MarathonDatesForm({ entry }: { entry: MarathonEntry }) {
  const [message, action, pending] = useActionState(setMarathonDates, "");
  return (
    <details>
      <summary>{entry.name}</summary>
      <form action={action} className="form-grid">
        <input type="hidden" name="temple" value={entry.temple_id} />
        <label>
          Start date
          <input
            name="start"
            type="date"
            defaultValue={entry.starts_on || ""}
            required
          />
        </label>
        <label>
          End date
          <input
            name="end"
            type="date"
            defaultValue={entry.ends_on || ""}
            required
          />
        </label>
        <div>
          <button className="button" disabled={pending}>
            Save dates
          </button>
          <p role="status">{message}</p>
        </div>
      </form>
    </details>
  );
}
