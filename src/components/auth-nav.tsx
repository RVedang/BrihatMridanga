"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LogIn, LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";

export function AuthNav({
  signedIn,
  showPortal,
}: {
  signedIn: boolean;
  showPortal: boolean;
}) {
  const path = usePathname();
  const portalOpen = path === "/portal" || path.startsWith("/portal/");
  if (signedIn)
    return (
      <div className="nav-login nav-auth">
        {showPortal && (
          <Link
            className={
              portalOpen
                ? "button secondary small is-active"
                : "button secondary small"
            }
            href="/portal"
            aria-current={portalOpen ? "page" : undefined}
          >
            <ClipboardList size={14} /> <span>Portal</span>
          </Link>
        )}
        <form action={signOut}>
          <button type="submit" className="button small">
            <LogOut size={14} /> <span>Sign out</span>
          </button>
        </form>
      </div>
    );
  return (
    <Link className="button small nav-login" href="/login">
      <LogIn size={14} /> <span>Login</span>
    </Link>
  );
}
