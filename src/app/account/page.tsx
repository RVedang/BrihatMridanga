import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { isConfigured } from "@/lib/supabase";
import { requireSignedIn } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function Account() {
  if (!isConfigured()) redirect("/login");
  const { profile } = await requireSignedIn();
  if (!profile)
    return (
      <div className="container">
        <div className="login">
          <p className="eyebrow">Signed in</p>
          <h1>Account not ready</h1>
          <p className="lede">
            Your login worked, but this site still needs the latest database
            update before accounts can be stored. Try again shortly, or sign
            in through the temple portal to add a temple.
          </p>
          <form action={signOut}>
            <button className="button secondary">Sign out</button>
          </form>
        </div>
      </div>
    );
  const coordinator =
    profile.role === "admin" || profile.role === "temple_coordinator";
  return (
    <div className="container">
      <div className="login">
        <div className="login-mark" aria-hidden="true">
          <UserRound size={28} strokeWidth={1.3} />
        </div>
        <p className="eyebrow">Signed in</p>
        <h1>Welcome, {profile.display_name}</h1>
        <p className="lede">
          {coordinator
            ? "This account can open the temple portal to record distributions and update the temple page."
            : "You are signed in. Temple pages are updated from the temple portal."}
        </p>
        <div className="actions" style={{ marginTop: 8 }}>
          {coordinator ? (
            <Link href="/portal" className="button">
              Open temple portal
            </Link>
          ) : (
            <Link href="/onboarding" className="button secondary">
              Register your temple
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
