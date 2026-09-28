"use client";
import Link from "next/link";
import { ReadingProgress } from "@/components/reading-progress";
import { isPortalPath, useBrowserPath } from "@/lib/use-browser-path";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const links: [string, string][] = [
  ["/", "Home"],
  ["/dashboard", "Dashboard"],
  ["/temples", "Temples"],
  ["/campaigns", "Campaigns"],
  ["/stories", "Stories"],
  ["/resources", "Resources"],
  ["/events", "Events"],
  ["/reports", "Reports"],
  ["/about", "About"],
];

export function Navigation() {
  const path = useBrowserPath(),
    [open, setOpen] = useState(false);
  const portalOpen = isPortalPath(path);
  const nav = useRef<HTMLElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const element = nav.current;
    if (!element) return;
    const sync = () => {
      const mark = indicator.current;
      const active = element.querySelector<HTMLElement>(
        '[aria-current="page"]',
      );
      if (!mark) return;
      if (!active) {
        mark.style.opacity = "0";
        return;
      }
      mark.style.opacity = "1";
      mark.style.width = `${active.offsetWidth}px`;
      mark.style.height = `${active.offsetHeight}px`;
      mark.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    };
    const observer = new ResizeObserver(sync);
    observer.observe(element);
    sync();
    return () => observer.disconnect();
  }, [path, open]);
  useEffect(() => {
    if (!open) return;
    const toggle = toggleRef.current;
    const phone = toggle ? getComputedStyle(toggle).display !== "none" : false;
    const previous = document.body.style.overflow;
    if (phone) document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle?.focus();
        return;
      }
      if (event.key !== "Tab" || !phone || !nav.current || !toggle) return;
      const items = [toggle, ...nav.current.querySelectorAll<HTMLElement>("a[href]")];
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!items.includes(document.activeElement as HTMLElement)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);
  return (
    <>
      <ReadingProgress />
      <button
        ref={toggleRef}
        className="menu-toggle"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="navigation"
        onClick={() => setOpen(!open)}
      >
        <span className={open ? "menu-glyph is-open" : "menu-glyph"} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
      <nav
        ref={nav}
        id="navigation"
        className={open ? "navigation open" : "navigation"}
        aria-label="Main navigation"
      >
        <span
          ref={indicator}
          className={
            portalOpen
              ? "nav-active-indicator is-idle"
              : "nav-active-indicator"
          }
          aria-hidden="true"
        />
        {links.map(([href, label]) => {
          const current =
            !portalOpen &&
            (path === href || (href !== "/" && path.startsWith(`${href}/`)));
          return (
            <Link
              key={href}
              onClick={() => setOpen(false)}
              className={current ? "nav-link active" : "nav-link"}
              href={href}
              aria-current={current ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
