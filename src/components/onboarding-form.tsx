"use client";
import { useActionState } from "react";
import { registerTemple } from "@/app/onboarding/actions";
import { Select } from "@/components/select";
import { TIMEZONES } from "@/lib/timezones";

export function OnboardingForm({
  defaultName,
}: {
  defaultName: string;
}) {
  const [state, action, pending] = useActionState(registerTemple, {
    message: "",
  });
  return (
    <form action={action} className="login-form">
      <label>
        Your name
        <input
          name="display_name"
          required
          maxLength={160}
          defaultValue={defaultName}
          autoComplete="name"
        />
      </label>
      <label>
        Temple name
        <input name="name" required maxLength={160} autoComplete="organization" />
      </label>
      <label>
        Country
        <input name="country" required maxLength={80} autoComplete="country-name" />
      </label>
      <label>
        City
        <input name="city" maxLength={120} autoComplete="address-level2" />
      </label>
      <label>
        Temple information
        <textarea
          name="information"
          rows={4}
          maxLength={2000}
          placeholder="A short introduction for the public temple page"
        />
      </label>
      <label>
        Contact details
        <textarea
          name="contact"
          rows={3}
          maxLength={500}
          placeholder="Phone, email, address, or visiting hours"
        />
      </label>
      <label>
        Time zone
        <Select name="timezone" defaultValue="Asia/Kolkata" required>
          {TIMEZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </label>
      <label>
        Primary centre name (optional)
        <input
          name="centre_name"
          maxLength={160}
          placeholder="e.g. Main temple, college preaching"
        />
      </label>
      {state.message && (
        <p role="alert" className="error">
          {state.message}
        </p>
      )}
      <button className="button" disabled={pending}>
        {pending ? "Saving…" : "Create temple page"}
      </button>
    </form>
  );
}
