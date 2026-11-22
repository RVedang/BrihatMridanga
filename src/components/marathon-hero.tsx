"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import {
  nearestTemple,
  type MarathonTemple,
  type Standing,
} from "@/lib/marathon";
import { MarathonContact } from "./marathon-contact";
import styles from "./marathon-hero.module.css";

const titles = [
  "Marathon Announcement",
  "Live Weekly Standings",
  "Śrīla Prabhupāda Quote",
];
export function MarathonHero({
  initial,
  temples,
}: {
  initial: { rows: Standing[]; refreshAt: string | null };
  temples: MarathonTemple[];
}) {
  const [active, setActive] = useState(0);
  const [restart, setRestart] = useState(0);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const [standings, setStandings] = useState(initial);
  const [contact, setContact] = useState<MarathonTemple>();
  const dialog = useRef<HTMLDialogElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const resumeAfterHover = useRef(false);
  const router = useRouter();
  const refresh = useRef<() => void>(() => {});
  useEffect(() => {
    if (hover || focused) return;
    const timer = window.setTimeout(
      () => {
        resumeAfterHover.current = false;
        setActive((n) => (n + 1) % 3);
      },
      resumeAfterHover.current ? 2500 : 5000,
    );
    return () => window.clearTimeout(timer);
  }, [active, restart, hover, focused]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(
      /\/rest\/v1\/?$/,
      "",
    );
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return;
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const abort = new AbortController();
    let request = 0;
    refresh.current = async () => {
      const sequence = ++request;
      try {
        const response = await fetch("/api/marathon", {
          signal: abort.signal,
          cache: "no-store",
        });
        if (response.ok) {
          const result = await response.json();
          if (sequence === request && !abort.signal.aborted)
            setStandings(result);
        }
      } catch {
        /* Keep the most recent successful standings. */
      }
    };
    const channel = client
      .channel("marathon-standings")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "marathon_change" },
        () => refresh.current(),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") refresh.current();
      });
    const visible = () => {
      if (!document.hidden) refresh.current();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      abort.abort();
      document.removeEventListener("visibilitychange", visible);
      void client.removeChannel(channel);
    };
  }, []);
  useEffect(() => {
    if (!standings.refreshAt) return;
    const timer = window.setTimeout(
      () => refresh.current(),
      Math.max(1000, Date.parse(standings.refreshAt) - Date.now() + 150),
    );
    return () => window.clearTimeout(timer);
  }, [standings.refreshAt]);

  function go(index: number) {
    resumeAfterHover.current = false;
    setActive((index + 3) % 3);
    setRestart((n) => n + 1);
  }
  function locate() {
    const fallback = () => router.push("/participating-temples");
    if (!navigator.geolocation || !temples.length) {
      fallback();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nearest = nearestTemple(
          temples,
          coords.latitude,
          coords.longitude,
        );
        if (!nearest) {
          fallback();
          return;
        }
        setContact(nearest);
        dialog.current?.showModal();
      },
      fallback,
      { timeout: 10000 },
    );
  }

  return (
    <section
      className={styles.hero}
      aria-label="Book distribution marathon carousel"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setHover(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        resumeAfterHover.current = true;
        setFocused(false);
        setHover(false);
      }}
      onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <div
        className={styles.stage}
        data-announcement={active === 0 || undefined}
        data-quote={active === 2 || undefined}
        onTouchStart={(e) => {
          const p = e.touches[0];
          touch.current = { x: p.clientX, y: p.clientY };
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const p = e.changedTouches[0];
          const dx = p.clientX - start.x;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(p.clientY - start.y))
            go(active + (dx < 0 ? 1 : -1));
        }}
      >
        <div key={active} className={styles.slide} aria-label={titles[active]}>
          {active === 0 ? (
            <div className={styles.announcement}>
              <div className={styles.announcementCopy}>
                <h1>
                  <span className={styles.welcomeLine}>Welcome to the</span>
                  <span className={styles.nameLine}>Srila Prabhupada</span>
                  <span className={styles.marathonLine}>Book Marathon</span>
                </h1>
                <p className={styles.tagline}>60 Days of Bliss</p>
                <div className={styles.ctas}>
                  <Link
                    className={styles.templeAction}
                    href="/participating-temples"
                  >
                    Participating Temples
                  </Link>
                  <button
                    className={styles.contactAction}
                    type="button"
                    onClick={locate}
                  >
                    Contact Nearest Centre
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className={styles.artworkFrame}>
                <img
                  className={styles.artwork}
                  src="/home/marathon-announcement.webp"
                  alt="Bhagavad-gītā As It Is standing on a horizontally laid Kṛṣṇa book, both by Śrīla Prabhupāda"
                />
              </div>
            </div>
          ) : active === 1 ? (
            <div className={styles.weeklySlide}>
              <h2>Live Weekly Standings</h2>
              {standings.rows.length ? (
                <div
                  tabIndex={0}
                  className={styles.standings}
                  aria-label="Weekly standings table"
                >
                  <table>
                    <thead>
                      <tr>
                        {["Rank", "Temple", "Points", "Books", "Sets"].map(
                          (label) => (
                            <th scope="col" key={label}>
                              {label}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {standings.rows.map((row) => (
                        <tr key={row.name}>
                          <td>{row.rank}</td>
                          <th scope="row">{row.name}</th>
                          <td>{Number(row.points).toFixed(2)}</td>
                          <td>{row.books}</td>
                          <td>{row.sets}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.weeklyEmpty}>
                  <p>Waiting for the first weekly marathon report.</p>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.quote}>
              <div className={styles.quotePhoto}>
                <img
                  src="/home/prabhupada-reading-quote.jpg"
                  alt="Śrīla Prabhupāda reading a book at his desk"
                />
              </div>
              <div className={styles.quoteCopy}>
                <p>Books are the Basis</p>
                <figure>
                  <span className={styles.quoteMark} aria-hidden="true">
                    “
                  </span>
                  <blockquote>
                    Whoever gets a book is benefitted. If he <strong>reads the
                    book</strong> he is benefitted still more, or if he <strong>
                    gives the book</strong> to someone else for reading, both he
                    and the other person is benefitted. Even if one does not read
                    the book but <strong>simply holds</strong> if and sees it, he
                    is benefitted. If he <strong>simply gives small donation
                    </strong> towards the work of Krsna consciousness <strong>he
                    is benefitted</strong>.
                  </blockquote>
                  <figcaption>
                    <strong>Śrīla Prabhupāda</strong>
                    <span>Letter to German Disciples — Bombay, May 06, 1977</span>
                  </figcaption>
                </figure>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          className={`${styles.arrow} ${styles.previous}`}
          aria-label="Previous slide"
          onClick={() => go(active - 1)}
        >
          <ChevronLeft aria-hidden />
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.next}`}
          aria-label="Next slide"
          onClick={() => go(active + 1)}
        >
          <ChevronRight aria-hidden />
        </button>
      </div>
      <div
        className={styles.controls}
        role="group"
        aria-label="Slide navigation"
      >
        <div className={styles.dots}>
          {titles.map((title, i) => (
            <button
              type="button"
              aria-label={title}
              aria-current={active === i ? "true" : undefined}
              key={title}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>
      <dialog
        ref={dialog}
        aria-label="Nearest participating temple"
        className={styles.dialog}
      >
        {contact && (
          <>
            <h2>{contact.name}</h2>
            <MarathonContact temple={contact} />
          </>
        )}
        <form method="dialog">
          <button type="submit" className="button secondary">
            Close
          </button>
        </form>
      </dialog>
    </section>
  );
}
