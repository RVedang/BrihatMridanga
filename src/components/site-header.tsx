import Link from "next/link";
import Image from "next/image";
import { isConfigured } from "@/lib/supabase";
import { currentSession } from "@/lib/auth";
import { AuthNav } from "@/components/auth-nav";
import { Navigation } from "@/components/navigation";

export async function SiteHeader() {
  let signedIn = false;
  let showPortal = false;
  if (isConfigured()) {
    try {
      const { user, profile } = await currentSession();
      signedIn = Boolean(user);
      showPortal =
        profile?.role === "admin" || profile?.role === "temple_coordinator";
    } catch {
      signedIn = false;
      showPortal = false;
    }
  }
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Brihat Mridanga home">
        <Image
          className="brand-logo"
          src="/brand/logo-mark.png"
          alt="Srila Prabhupada’s ISKCON Brihat Mridanga"
          width={787}
          height={284}
          priority
        />
      </Link>
      <AuthNav signedIn={signedIn} showPortal={showPortal} />
      <Navigation />
    </header>
  );
}
