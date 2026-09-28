"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { bindVerticalPan } from "@/components/vertical-pan";

export function TestimonialStrip({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return bindVerticalPan(el);
  }, []);

  return (
    <div ref={ref} className="testimonial-grid">
      {children}
    </div>
  );
}
