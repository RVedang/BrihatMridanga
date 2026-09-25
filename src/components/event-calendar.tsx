"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Campaign, Content, Temple } from "@/lib/data";
import { dateLabel } from "@/lib/dates";
import { Empty } from "@/components/ui";
import { ListingCard } from "@/components/listing-card";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function monthName(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1)).toLocaleString("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function shiftMonth(year: number, month: number, delta: number) {
  const next = new Date(Date.UTC(year, month + delta, 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
}

type Mark = {
  id: string;
  href: string;
  title: string;
  kind: "event" | "campaign" | "regional";
};

function initialCursor(events: Content[], campaigns: Campaign[]) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const first = `${year}-${pad(month + 1)}-01`;
  const last = `${year}-${pad(month + 1)}-${pad(days)}`;
  const inThisMonth =
    events.some((event) => {
      const date = event.starts_at?.slice(0, 10);
      return Boolean(date && date >= first && date <= last);
    }) ||
    campaigns.some(
      (campaign) => campaign.starts_on <= last && campaign.ends_on >= first,
    );
  if (inThisMonth) return { year, month };
  const dates = [
    ...events.map((event) => event.starts_at?.slice(0, 10) || ""),
    ...campaigns.map((campaign) => campaign.starts_on),
  ]
    .filter(Boolean)
    .sort();
  if (!dates.length) return { year, month };
  const pick = dates.find((date) => date >= first) || dates[0];
  return {
    year: Number(pick.slice(0, 4)),
    month: Number(pick.slice(5, 7)) - 1,
  };
}

export function EventCalendar({
  events,
  campaigns,
  temples,
  search = "",
}: {
  events: Content[];
  campaigns: Campaign[];
  temples: Temple[];
  search?: string;
}) {
  const now = new Date();
  const [{ year, month }, setCursor] = useState(() =>
    search ? initialCursor(events, campaigns) : {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth(),
    },
  );
  const templeName = (id: string | null) =>
    id ? temples.find((temple) => temple.id === id)?.name || "Temple" : "";
  const first = `${year}-${pad(month + 1)}-01`;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const last = `${year}-${pad(month + 1)}-${pad(days)}`;
  const offset = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const today = now.toISOString().slice(0, 10);

  const marksByDay = useMemo(() => {
    const map = new Map<string, Mark[]>();
    const add = (date: string, mark: Mark) => {
      const list = map.get(date) || [];
      list.push(mark);
      map.set(date, list);
    };
    for (const event of events) {
      const date = event.starts_at?.slice(0, 10);
      if (!date || date < first || date > last) continue;
      add(date, {
        id: event.id,
        href: `/events/${event.id}`,
        title: event.title,
        kind: "event",
      });
    }
    for (const campaign of campaigns) {
      if (campaign.ends_on < first || campaign.starts_on > last) continue;
      const kind = campaign.temple_id ? "regional" : "campaign";
      const from = campaign.starts_on < first ? first : campaign.starts_on;
      const to = campaign.ends_on > last ? last : campaign.ends_on;
      for (let day = Number(from.slice(8)); day <= Number(to.slice(8)); day++) {
        const date = `${year}-${pad(month + 1)}-${pad(day)}`;
        add(date, {
          id: campaign.id,
          href: `/campaigns/${campaign.id}`,
          title: campaign.name,
          kind,
        });
      }
    }
    return map;
  }, [events, campaigns, first, last, month, year]);

  const monthEvents = events
    .filter((event) => {
      const date = event.starts_at?.slice(0, 10);
      return date && date >= first && date <= last;
    })
    .sort((a, b) => (a.starts_at || "").localeCompare(b.starts_at || ""));
  const monthCampaigns = campaigns
    .filter(
      (campaign) => campaign.starts_on <= last && campaign.ends_on >= first,
    )
    .sort((a, b) => a.starts_on.localeCompare(b.starts_on));

  return (
    <>
      <div className="calendar-toolbar">
        <button
          type="button"
          className="button secondary small"
          onClick={() => setCursor((c) => shiftMonth(c.year, c.month, -1))}
        >
          <ChevronLeft size={16} strokeWidth={1.8} /> Previous
        </button>
        <h2>{monthName(year, month)}</h2>
        <button
          type="button"
          className="button secondary small"
          onClick={() => setCursor((c) => shiftMonth(c.year, c.month, 1))}
        >
          Next <ChevronRight size={16} strokeWidth={1.8} />
        </button>
      </div>
      <p className="muted">
        Browse any month of the year. Dates are shown in UTC. Campaigns appear
        across every day they run; events appear on their start date.
      </p>
      <p className="calendar-key" aria-label="Calendar key">
        <span>
          <i className="cal-key cal-key-event" /> Event
        </span>
        <span>
          <i className="cal-key cal-key-campaign" /> Movement-wide campaign
        </span>
        <span>
          <i className="cal-key cal-key-regional" /> Regional campaign
        </span>
      </p>
      <div className="calendar">
        {WEEKDAYS.map((day) => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div key={`empty${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = `${year}-${pad(month + 1)}-${pad(i + 1)}`;
          const marks = marksByDay.get(date) || [];
          const regional = marks.some((mark) => mark.kind === "regional");
          const campaign = marks.some((mark) => mark.kind === "campaign");
          return (
            <div
              key={date}
              className={`cal-day${date === today ? " is-today" : ""}${
                regional ? " has-regional" : campaign ? " has-campaign" : ""
              }`}
            >
              <span className="cal-num">{i + 1}</span>
              {marks.map((mark) => (
                <Link
                  key={`${mark.kind}-${mark.id}`}
                  href={mark.href}
                  className={`cal-mark cal-mark-${mark.kind}`}
                >
                  {mark.title}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
      <div className="section-title">
        <h2>This month</h2>
      </div>
      {monthEvents.length || monthCampaigns.length ? (
        <div className="grid">
          {monthCampaigns.map((campaign) => {
            const regional = Boolean(campaign.temple_id);
            const temple = templeName(campaign.temple_id);
            return (
              <ListingCard
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                pill={regional ? "Regional campaign" : "Movement-wide campaign"}
                tone={regional ? "regional" : "campaign"}
                kicker={regional ? temple : "All temples"}
                title={campaign.name}
                dates={`${dateLabel(campaign.starts_on)} – ${dateLabel(campaign.ends_on)}`}
                go="View campaign"
              >
                {!regional && campaign.description ? (
                  <p>{campaign.description.slice(0, 160)}</p>
                ) : null}
              </ListingCard>
            );
          })}
          {monthEvents.map((event) => (
            <ListingCard
              key={event.id}
              href={`/events/${event.id}`}
              pill="Event"
              tone="event"
              kicker={event.location || undefined}
              title={event.title}
              dates={
                event.starts_at
                  ? `${new Date(event.starts_at).toLocaleString("en", {
                      timeZone: "UTC",
                    })} UTC`
                  : undefined
              }
              go="Event details"
            >
              {event.body ? <p>{event.body.slice(0, 160)}</p> : null}
            </ListingCard>
          ))}
        </div>
      ) : (
        <Empty
          title={
            search
              ? "No matching events or campaigns"
              : "Nothing listed this month"
          }
        >
          {search
            ? "Try another title, location or temple."
            : "Move to another month, or publish an event or campaign that falls in these dates."}
        </Empty>
      )}
    </>
  );
}
