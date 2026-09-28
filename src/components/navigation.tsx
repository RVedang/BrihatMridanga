"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReadingProgress } from "@/components/reading-progress";
import { useEffect, useRef, useState } from "react";

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
  const path = usePathname(),
    [open, setOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = nav.current;
    if (!element) return;
    const sync = () => {
      const active = element.querySelector<HTMLElement>(
        '[aria-current="page"]',
      );
      if (!active || !indicator.current) return;
      indicator.current.style.width = `${active.offsetWidth}px`;
      indicator.current.style.height = `${active.offsetHeight}px`;
      indicator.current.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    };
    const observer = new ResizeObserver(sync);
    observer.observe(element);
    sync();
    return () => observer.disconnect();
  }, [path, open]);
  return (
    <>
      <ReadingProgress />
      <button
        className="menu-toggle"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <svg className="menu-glyph" viewBox="5 5 14 14" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="M6 6 18 18" />
          </svg>
        ) : (
          <svg className="menu-glyph" viewBox="3 4 18 16" aria-hidden="true">
            <path d="M4 5h16" />
            <path d="M4 12h16" />
            <path d="M4 19h16" />
          </svg>
        )}
      </button>
      <nav
        ref={nav}
        id="navigation"
        className={open ? "navigation open" : "navigation"}
        aria-label="Main navigation"
      >
        <span
          ref={indicator}
          className="nav-active-indicator"
          aria-hidden="true"
        />
        {links.map(([href, label]) => {
          const current =
            path === href || (href !== "/" && path.startsWith(`${href}/`));
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
