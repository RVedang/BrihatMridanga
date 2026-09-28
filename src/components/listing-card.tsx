import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function ListingCard({
  href,
  pill,
  tone = "plain",
  accent,
  kicker,
  title,
  dates,
  children,
  go,
}: {
  href: string;
  pill: string;
  tone?: "plain" | "regional" | "campaign" | "event" | "year";
  accent?: string;
  kicker?: string;
  title: string;
  dates?: string;
  children?: React.ReactNode;
  go: string;
}) {
  return (
    <Link href={href} className={`card listing-card listing-card-${tone}`}>
      <div className="listing-card-top">
        <span className="listing-card-identity">
          {accent ? (
            <i
              className="mark-swatch"
              style={{ background: accent }}
              aria-hidden="true"
            />
          ) : null}
          <span className={`pill pill-${tone}`}>{pill}</span>
        </span>
        {kicker ? <span className="listing-card-kicker">{kicker}</span> : null}
      </div>
      <h3>{title}</h3>
      {dates ? <p className="listing-card-dates">{dates}</p> : null}
      {children}
      <span className="card-go">
        {go} <ArrowUpRight size={15} strokeWidth={1.6} />
      </span>
    </Link>
  );
}
