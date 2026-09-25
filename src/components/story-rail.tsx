"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const NATURAL = 280;
const GAP = 20;
/** A row this close to fitting is shrunk to fit, so it cannot nudge. */
const FIT = 24;
const EDGE = 1;

export function StoryRail({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const clipRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    const el = clipRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>(".card");
    const count = cards.length;
    const natural = count * NATURAL + Math.max(0, count - 1) * GAP;
    const overflow = natural - el.clientWidth;
    const nextFit = overflow > 0 && overflow <= FIT;
    setFit((current) => (current === nextFit ? current : nextFit));

    if (nextFit) {
      if (el.scrollLeft !== 0) el.scrollLeft = 0;
      setCanPrev(false);
      setCanNext(false);
      return;
    }

    const last = cards[count - 1];
    const hiddenRight = last
      ? last.getBoundingClientRect().right - el.getBoundingClientRect().right
      : 0;
    setCanPrev(el.scrollLeft > EDGE);
    setCanNext(hiddenRight > EDGE);
  }, []);

  useEffect(() => {
    const el = clipRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [sync, children]);

  const move = (direction: -1 | 1) => {
    const el = clipRef.current;
    if (!el || fit) return;
    const card = el.querySelector<HTMLElement>(".card");
    const stride = (card?.offsetWidth || NATURAL) + GAP;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const next =
      direction === 1
        ? Math.min(max, el.scrollLeft + stride)
        : Math.max(0, el.scrollLeft - stride);
    if (Math.abs(next - el.scrollLeft) < EDGE) return;
    el.scrollTo({
      left: next,
      behavior: "smooth",
    });
  };

  return (
    <div className="story-rail-block">
      <div className="section-title">
        <h2>{title}</h2>
      </div>
      <div className="story-rail-frame">
        {canPrev ? (
          <button
            type="button"
            className="story-rail-arrow is-prev"
            aria-label={`Previous ${title}`}
            onClick={() => move(-1)}
          >
            <ChevronLeft size={20} strokeWidth={2.2} />
          </button>
        ) : null}
        <div
          className={fit ? "story-rail-clip is-fit" : "story-rail-clip"}
          ref={clipRef}
        >
          <div className={fit ? "story-rail is-fit" : "story-rail"}>
            {children}
          </div>
        </div>
        {canNext ? (
          <button
            type="button"
            className="story-rail-arrow is-next"
            aria-label={`Next ${title}`}
            onClick={() => move(1)}
          >
            <ChevronRight size={20} strokeWidth={2.2} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
