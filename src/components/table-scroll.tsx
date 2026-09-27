"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function TableScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const overflow = el.scrollWidth - el.clientWidth > 2;
      const more =
        overflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      el.classList.toggle("can-scroll-x", more);
      el.tabIndex = overflow ? 0 : -1;
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    const table = el.querySelector("table");
    if (table) observer.observe(table);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="table-wrap">
      {children}
    </div>
  );
}
