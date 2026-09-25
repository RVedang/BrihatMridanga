import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import styles from "@/app/agenda.module.css";

/** Homepage agenda presentation; dates, metadata and destinations come from the page. */
export function AgendaCard({
  href,
  pill,
  kicker,
  title,
  dates,
  start,
  go,
}: {
  href: string;
  pill: string;
  kicker?: string;
  title: string;
  dates?: string;
  start?: string;
  go: string;
}) {
  const date = start ? new Date(`${start}T00:00:00Z`) : null;
  const validDate = date && !Number.isNaN(date.getTime());
  return (
    <Link href={href} className={styles.item} data-reveal>
      <span className={styles.date} aria-hidden="true">
        {validDate ? (
          <>
            <span>
              {date.toLocaleDateString("en-GB", {
                month: "short",
                timeZone: "UTC",
              })}
            </span>
            <strong>{date.getUTCDate()}</strong>
          </>
        ) : (
          <CalendarDays size={26} />
        )}
      </span>
      <div className={styles.detail}>
        <div className={styles.meta}>
          <span>{pill}</span>
          {kicker && <span>{kicker}</span>}
        </div>
        <h3>{title}</h3>
        {dates && <p>{dates}</p>}
        <span className={styles.go}>{go}</span>
      </div>
      <span className={styles.arrow} aria-hidden="true">
        <ArrowUpRight size={20} />
      </span>
    </Link>
  );
}
