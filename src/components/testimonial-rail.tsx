"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function TestimonialRail({ children }: { children: ReactNode }) {
  const id = useId();
  const rail = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const update = () =>
      setEdges({
        start: element.scrollLeft < 2,
        end:
          element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
      });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    element.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", update);
    };
  }, []);
  function move(direction: number) {
    const element = rail.current;
    if (!element) return;
    const card = element.firstElementChild as HTMLElement | null;
    element.scrollBy({
      left: direction * ((card?.offsetWidth || 300) + 20),
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  return (
    <div className="testimonial-carousel">
      <div className="testimonial-controls">
        <button
          type="button"
          className="icon-btn"
          aria-label="Previous testimonials"
          aria-controls={id}
          disabled={edges.start}
          onClick={() => move(-1)}
        >
          <ArrowLeft size={19} />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Next testimonials"
          aria-controls={id}
          disabled={edges.end}
          onClick={() => move(1)}
        >
          <ArrowRight size={19} />
        </button>
      </div>
      <div
        id={id}
        ref={rail}
        className="testimonial-scroll"
        role="region"
        aria-label="Recent testimonials"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            move(event.key === "ArrowRight" ? 1 : -1);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
