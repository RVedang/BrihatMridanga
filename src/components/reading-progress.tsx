"use client";
import { useEffect, useRef } from "react";

/** Passive scroll feedback; never changes the visitor's scroll position. */
export function ReadingProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const range = document.documentElement.scrollHeight - innerHeight;
      ref.current?.style.setProperty(
        "--reading-progress",
        String(range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0),
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
    };
  }, []);
  return <div ref={ref} className="reading-progress" aria-hidden="true" />;
}
