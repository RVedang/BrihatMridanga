import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { isConfigured } from "@/lib/supabase";
import { currentSession } from "@/lib/auth";
import { LoginForm, type SignInIntent } from "@/components/login-form";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; as?: string }>;
}) {
  const q = await searchParams;
  if (isConfigured()) {
    const { user } = await currentSession();
    if (user) redirect("/auth/continue");
  }
  const initialIntent: SignInIntent =
    q.as === "coordinator" ? "coordinator" : "user";
  return (
    <div className="container login-shell">
      <div className="login">
        <div className="login-mark" aria-hidden="true">
          <BookOpen size={22} strokeWidth={1.8} />
        </div>
        <h1>Sign in</h1>
        {q.message && (
          <p className="notice">
            {q.message === "access-required"
              ? "This account is not ready yet. Sign in as a user, or open the temple portal to add your temple."
              : "Sign-in could not be completed. Please try again."}
          </p>
        )}
        {isConfigured() ? (
          <LoginForm initialIntent={initialIntent} />
        ) : (
          <p className="notice">
            Sign-in is being prepared.{" "}
            <Link href="/preview">Preview the reporting form</Link> in the
            meantime.
          </p>
        )}
      </div>
    </div>
  );
}
