"use client";

import { useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";

const listeners = new Set<() => void>();
let historyPatched = false;

function notify() {
  listeners.forEach((listener) => listener());
}

function watchHistory() {
  if (historyPatched || typeof window === "undefined") return;
  historyPatched = true;
  const push = history.pushState.bind(history);
  const replace = history.replaceState.bind(history);
  history.pushState = (...args) => {
    push(...args);
    notify();
  };
  history.replaceState = (...args) => {
    replace(...args);
    notify();
  };
  window.addEventListener("popstate", notify);
}

export function isPortalPath(path: string | null | undefined) {
  if (!path) return false;
  const name = path.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  return name === "/portal" || name.startsWith("/portal/");
}

/** Router path, corrected by the address bar after a sign-in redirect. */
export function useBrowserPath() {
  const routed = usePathname() || "";
  const [located, setLocated] = useState(routed);
  useLayoutEffect(() => {
    watchHistory();
    const sync = () => {
      const current = window.location.pathname || routed;
      setLocated((prev) => (prev === current ? prev : current));
    };
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, [routed]);
  if (isPortalPath(located)) return located;
  return routed || located;
}
