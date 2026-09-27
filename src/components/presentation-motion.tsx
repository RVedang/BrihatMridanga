"use client";

import { useEffect, useRef } from "react";
import { animate, type AnimationPlaybackControls } from "framer-motion";

/** Tweak scroll-reveal timing here; hero motion lives in CSS variables. */
const MOTION = {
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  duration: 0.7,
  photoDuration: 0.85,
  stagger: 0.1,
  staggerCap: 0.45,
  distance: 28,
  scale: 0.97,
};

const revealTargets =
  "[data-reveal], .page-intro, .section-title, .card, .place-card, .testimonial-card, .stat-card, .stats > div, .chart-card, .home-rail-heading, .home-sankirtan-feature > .story-photo, .home-sankirtan-feature > div, .home-sankirtan-item, .about-card, .about-meaning-stage, .about-meaning-panel, .about-vision-stage, .about-vision-quote, .about-mission-copy > h2, .about-mission-lead, .about-mission-pill, .about-mission-figure, .about-lead h2, .about-lead-points li, .about-lead-frame, .about-region, .about-actions, .empty, .login";

function skipReveal(target: Element) {
  return Boolean(
    target.closest("section[aria-label='Our inspiration']") ||
      target.closest(".page-intro"),
  );
}

/** Enhance server-rendered content without moving data or pages into the client. */
export function PresentationMotion() {
  useEffect(() => {
    const root = document.getElementById("main");
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || !("IntersectionObserver" in window)) return;
    const seen = new WeakSet<Element>();
    const animations = new Map<Element, AnimationPlaybackControls>();
    const finish = (target: Element, animation: AnimationPlaybackControls) => {
      animation.cancel();
      const node = target as HTMLElement;
      node.style.removeProperty("opacity");
      node.style.removeProperty("transform");
      node.style.removeProperty("will-change");
      animations.delete(target);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        let stagger = 0;
        const incoming = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top ||
              a.boundingClientRect.left - b.boundingClientRect.left,
          );
        for (const entry of incoming) {
          observer.unobserve(entry.target);
          if (preference.matches) continue;
          const target = entry.target as HTMLElement;
          const photo = target.matches(
            '[data-reveal="image"], .story-photo, .about-meaning-stage, .about-vision-stage, .about-mission-figure, .about-lead-frame',
          );
          target.style.willChange = "opacity, transform";
          const delay = Math.min(stagger++ * MOTION.stagger, MOTION.staggerCap);
          const animation = animate(
            target,
            {
              opacity: [0, 1],
              transform: photo
                ? [`scale(${MOTION.scale})`, "scale(1)"]
                : [`translateY(${MOTION.distance}px)`, "translateY(0px)"],
            },
            {
              duration: photo ? MOTION.photoDuration : MOTION.duration,
              delay,
              ease: MOTION.ease,
            },
          );
          animations.set(target, animation);
          void animation.then(() => finish(target, animation));
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );
    const scan = () =>
      root.querySelectorAll(revealTargets).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        if (skipReveal(element)) return;
        if (element.parentElement?.closest(revealTargets)) return;
        const node = element as HTMLElement;
        if (
          !preference.matches &&
          node.getBoundingClientRect().top > window.innerHeight
        ) {
          const photo = node.matches(
            '[data-reveal="image"], .story-photo, .about-meaning-stage, .about-vision-stage, .about-mission-figure, .about-lead-frame',
          );
          node.style.opacity = "0";
          node.style.transform = photo
            ? `scale(${MOTION.scale})`
            : `translateY(${MOTION.distance}px)`;
        }
        observer.observe(element);
      });
    scan();
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
        animations.forEach((animation, target) => finish(target, animation));
        animations.clear();
      }
    };
    preference.addEventListener("change", stop);
    root.addEventListener("focusin", stopOnFocus);
    function stopOnFocus() {
      animations.forEach((animation, target) => finish(target, animation));
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
    let counter: AnimationPlaybackControls | undefined;
    const finish = () => {
      counter?.stop();
      element.textContent = formatter.format(value);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (preference.matches) return;
        counter = animate(0, value, {
          duration: 1.05,
          ease: MOTION.ease,
          onUpdate: (latest) => {
            element.textContent = formatter.format(Math.floor(latest));
          },
          onComplete: () => {
            element.textContent = formatter.format(value);
          },
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
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
