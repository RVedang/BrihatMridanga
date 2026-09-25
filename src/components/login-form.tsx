"use client";
import { useActionState, useState } from "react";
import { Landmark, UserRound } from "lucide-react";
import { signIn } from "@/app/login/actions";

export type SignInIntent = "user" | "coordinator";

export function LoginForm({
  initialIntent = "user",
}: {
  initialIntent?: SignInIntent;
}) {
  const [intent, setIntent] = useState<SignInIntent>(initialIntent);
  const [state, action, pending] = useActionState(signIn, { message: "" });
  const coordinator = intent === "coordinator";

  return (
    <div className="login-form">
      <div className="login-roles" role="tablist" aria-label="Sign-in type">
        <button
          type="button"
          role="tab"
          aria-pressed={!coordinator}
          onClick={() => setIntent("user")}
        >
          <UserRound size={16} strokeWidth={1.8} />
          User
        </button>
        <button
          type="button"
          role="tab"
          aria-pressed={coordinator}
          onClick={() => setIntent("coordinator")}
        >
          <Landmark size={16} strokeWidth={1.8} />
          Temple portal
        </button>
      </div>
      <form action={action}>
        <input type="hidden" name="intent" value={intent} />
        <label>
          Email
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        {state.message && (
          <p role="alert" className="error">
            {state.message}
          </p>
        )}
        <button className="button" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
