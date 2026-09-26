"use client";

import { useEffect, useRef } from "react";

const revealTargets =
  "[data-reveal], .page-intro, .section-title, .card, .place-card, .testimonial-card, .stat-card, .stats > div, .chart-card, .home-rail-heading, .home-sankirtan-feature > .story-photo, .home-sankirtan-feature > div, .home-sankirtan-item, .about-card, .about-meaning, .about-vision, .about-mission, .about-lead, .empty, .login";

/** Enhance server-rendered content without moving data or pages into the client. */
export function PresentationMotion() {
  useEffect(() => {
    const root = document.getElementById("main");
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || !("IntersectionObserver" in window)) return;
    const seen = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (preference.matches) continue;
          const target = entry.target;
          const photo = target.matches(".story-photo");
          // Observer callbacks can arrive after a frame has already painted.
          // Never reset opacity: server-rendered content must remain visible.
          const from = photo
            ? {
                transform: "scale(1.035)",
              }
            : {
                transform: "translateY(24px)",
              };
          const animation = target.animate(
            [
              from,
              {
                transform: "translate(0, 0) scale(1)",
              },
            ],
            {
              duration: 650,
              easing: "cubic-bezier(.16,.65,.3,1)",
            },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        }
      },
      { threshold: 0, rootMargin: "0px" },
    );
    const scan = () =>
      root.querySelectorAll(revealTargets).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        // Animate the containing card once, rather than its children again.
        if (element.parentElement?.closest(revealTargets)) return;
        // Visible content also gets an entrance, without ever being hidden.
        observer.observe(element);
      });
    scan();
    // Includes streamed server content and subsequent client-side navigation.
    const mutations = new MutationObserver((records) => {
      if (
        records.some((record) =>
          Array.from(record.addedNodes).some((node) => node instanceof Element),
        )
      )
        scan();
    });
    mutations.observe(root, { childList: true, subtree: true });
    const stop = () => {
      if (preference.matches) {
        animations.forEach((animation) => animation.cancel());
        animations.clear();
      }
    };
    preference.addEventListener("change", stop);
    root.addEventListener("focusin", stopOnFocus);
    function stopOnFocus() {
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    }
    window.addEventListener("beforeprint", stopOnFocus);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      stopOnFocus();
      preference.removeEventListener("change", stop);
      root.removeEventListener("focusin", stopOnFocus);
      window.removeEventListener("beforeprint", stopOnFocus);
    };
  }, []);
  return null;
}

const formatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const formatted = formatter.format(value);
  useEffect(() => {
    const element = ref.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (
      !element ||
      preference.matches ||
      !("IntersectionObserver" in window) ||
      !Number.isFinite(value) ||
      value <= 0
    )
      return;
    let frame = 0;
    let iconAnimation: Animation | undefined;
    const finish = () => {
      cancelAnimationFrame(frame);
      iconAnimation?.cancel();
      element.textContent = formatter.format(value);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (preference.matches) return;
        const card = element.closest(".stat-card");
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / 700, 1);
          element.textContent = formatter.format(
            progress === 1
              ? value
              : Math.floor(value * (1 - Math.pow(1 - progress, 3))),
          );
          if (progress < 1) frame = requestAnimationFrame(tick);
          else {
            const icon = card?.querySelector(".stat-icon");
            if (icon && !preference.matches)
              iconAnimation = icon.animate(
                [
                  { transform: "scale(1)" },
                  { transform: "scale(1.18)", offset: 0.45 },
                  { transform: "scale(1)" },
                ],
                { duration: 500, easing: "ease-out" },
              );
          }
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0, rootMargin: "0px" },
    );
    observer.observe(element);
    preference.addEventListener("change", finish);
    window.addEventListener("beforeprint", finish);
    return () => {
      observer.disconnect();
      finish();
      preference.removeEventListener("change", finish);
      window.removeEventListener("beforeprint", finish);
    };
  }, [value]);
  return (
    <span className="animated-number">
      <span className="visually-hidden">{formatted}</span>
      <span ref={ref} aria-hidden="true">
        {formatted}
      </span>
    </span>
  );
}
