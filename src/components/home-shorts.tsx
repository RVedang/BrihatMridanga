"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Play } from "lucide-react";
import styles from "./home-shorts.module.css";

const shorts = [
  { id: "EOGwyPpm870", title: "Read the books and make your life successful" },
  { id: "DszvstfJx80", title: "22 November 2026" },
  { id: "dDebC_Wxh28", title: "Distribute books… distribute books… distribute books!" },
  { id: "Zef3yW9E8Wc", title: "One word can change life" },
];

export function HomeShorts() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [playerOpen, setPlayerOpen] = useState(false);
  const touchStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const selected = shorts[selectedIndex];

  function select(index: number) {
    setSelectedIndex((index + shorts.length) % shorts.length);
    setPlayerOpen(false);
  }

  return (
    <section className={styles.section} aria-labelledby="shorts-heading">
      <div className="container">
        <header className={styles.header}>
          <p className={styles.eyebrow}>Brihat Mridanga Shorts</p>
          <h2 id="shorts-heading">A book can <em>change a life.</em></h2>
        </header>

        <div
          className={styles.deck}
          role="group"
          aria-label="Shorts deck"
          onPointerDown={(event) => {
            swiped.current = false;
            if (event.pointerType === "touch" && event.isPrimary) {
              touchStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
            }
          }}
          onPointerUp={(event) => {
            const start = touchStart.current;
            if (!start || start.id !== event.pointerId) return;
            touchStart.current = null;
            const x = event.clientX - start.x;
            const y = event.clientY - start.y;
            if (Math.abs(x) < 45 || Math.abs(x) < Math.abs(y) * 1.3) return;
            swiped.current = true;
            select(selectedIndex + (x < 0 ? 1 : -1));
          }}
          onPointerCancel={(event) => {
            if (touchStart.current?.id === event.pointerId) touchStart.current = null;
          }}
          onClickCapture={(event) => {
            if (swiped.current && event.detail > 0) {
              swiped.current = false;
              event.stopPropagation();
            }
          }}
          onPointerMove={(event) => {
            if (event.pointerType !== "mouse") return;
            const bounds = event.currentTarget.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - 0.5;
            const y = (event.clientY - bounds.top) / bounds.height - 0.5;
            event.currentTarget.style.setProperty("--tilt-x", `${-y * 12}deg`);
            event.currentTarget.style.setProperty("--tilt-y", `${x * 16}deg`);
          }}
        >
          {shorts.map((short, index) => {
            const slot = (index - selectedIndex + shorts.length) % shorts.length;
            return (
              <div key={short.id} className={styles.card} data-slot={slot}>
                {slot === 0 && playerOpen ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${short.id}?autoplay=1&playsinline=1&rel=0`}
                    title={short.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <button
                    type="button"
                    tabIndex={slot === 0 ? 0 : -1}
                    aria-label={`${slot === 0 ? "Play" : "Bring forward"} ${short.title}`}
                    onClick={() => {
                      if (slot === 0) setPlayerOpen(true);
                      else select(index);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://i.ytimg.com/vi/${short.id}/hqdefault.jpg`} alt="" loading="lazy" />
                    {slot === 0 && <span className={styles.play}><Play size={23} fill="currentColor" aria-hidden="true" /></span>}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.controls}>
          <button type="button" onClick={() => select(selectedIndex - 1)} aria-label="Previous Short">
            <ChevronLeft size={23} aria-hidden="true" />
          </button>
          <div className={styles.caption}>
            <a href={`https://www.youtube.com/shorts/${selected.id}`} target="_blank" rel="noopener noreferrer">
              <span aria-live="polite">{selected.title}</span>
              <ArrowUpRight size={16} aria-hidden="true" />
              <span className={styles.srOnly}> (opens on YouTube)</span>
            </a>
            <span className={styles.counter}>{selectedIndex + 1} / {shorts.length}</span>
          </div>
          <button type="button" onClick={() => select(selectedIndex + 1)} aria-label="Next Short">
            <ChevronRight size={23} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
