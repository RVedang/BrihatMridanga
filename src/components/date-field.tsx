"use client";
import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "./select";

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function ymd(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}
function parse(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  return { y, m: m - 1, d };
}
function utcToday() {
  const n = new Date();
  return ymd(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
}
function pretty(value: string) {
  const p = parse(value);
  if (!p) return "Choose a date";
  return `${p.d} ${months[p.m].slice(0, 3)} ${p.y}`;
}

export function DateField({
  name,
  required,
  disabled,
  defaultValue = "",
  value,
  min,
  max,
  onChange,
  "aria-label": ariaLabel,
}: {
  name?: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: string;
  value?: string;
  min?: string;
  max?: string;
  onChange?: (value: string) => void;
  "aria-label"?: string;
}) {
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState(value ?? defaultValue);
  const selected = value ?? inner;
  const parsed = parse(selected) || parse(utcToday())!;
  const [view, setView] = useState({ y: parsed.y, m: parsed.m });

  useEffect(() => {
    if (value !== undefined) setInner(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: string) => {
    setInner(next);
    onChange?.(next);
    setOpen(false);
  };

  const first = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
  const days = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const today = utcToday();
  const isoFromUtc = (d: Date) =>
    ymd(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const canPrev = !(
    min && isoFromUtc(new Date(Date.UTC(view.y, view.m, 0))) < min
  );
  const canNext = !(
    max && isoFromUtc(new Date(Date.UTC(view.y, view.m + 1, 1))) > max
  );
  const cells: (number | null)[] = [
    ...Array.from({ length: first }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const shift = (delta: number) => {
    const d = new Date(Date.UTC(view.y, view.m + delta, 1));
    setView({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
  };

  return (
    <div className="date-field" ref={wrap}>
      <button
        type="button"
        id={id}
        className="date-field-trigger"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        onClick={() => {
          if (disabled) return;
          const p = parse(selected) || parse(utcToday())!;
          setView({ y: p.y, m: p.m });
          setOpen((v) => !v);
        }}
      >
        <CalendarDays size={16} strokeWidth={1.7} />
        <span className={selected ? "" : "placeholder"}>{pretty(selected)}</span>
      </button>
      {name && (
        <input type="hidden" name={name} value={selected} required={required} />
      )}
      {open && (
        <div className="date-pop" role="dialog" aria-label="Choose a date">
          <div className="date-pop-head">
            <button
              type="button"
              onClick={() => shift(-1)}
              disabled={!canPrev}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <strong>
              <span className="date-pop-month">{months[view.m]}</span>
              <span className="date-pop-year">{view.y}</span>
            </strong>
            <button
              type="button"
              onClick={() => shift(1)}
              disabled={!canNext}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="date-grid">
            {weekdays.map((d) => (
              <span key={d} className="date-dow">
                {d}
              </span>
            ))}
            {cells.map((day, i) => {
              if (!day) return <span key={`e${i}`} className="date-empty" />;
              const iso = ymd(view.y, view.m, day);
              const blocked = Boolean((min && iso < min) || (max && iso > max));
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={blocked}
                  className={[
                    "date-day",
                    iso === selected ? "is-selected" : "",
                    iso === today ? "is-today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => choose(iso)}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="date-pop-foot">
            {!required && (
              <button type="button" className="date-pop-action" onClick={() => choose("")}>
                Clear
              </button>
            )}
            <button
              type="button"
              className="date-pop-action"
              disabled={Boolean(
                (min && today < min) || (max && today > max),
              )}
              onClick={() => {
                const p = parse(today)!;
                setView({ y: p.y, m: p.m });
                choose(today);
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DateRangeFields({
  start,
  end,
  min,
  max,
}: {
  start: string;
  end: string;
  min?: string;
  max?: string;
}) {
  return (
    <div className="date-range">
      <span className="date-range-caption">
        Dates
        <span>Both included</span>
      </span>
      <div className="date-range-fields">
        <DateField
          name="start"
          required
          defaultValue={start}
          min={min}
          max={max}
          aria-label="Start date"
        />
        <span className="date-range-sep" aria-hidden="true">
          –
        </span>
        <DateField
          name="end"
          required
          defaultValue={end}
          min={min}
          max={max}
          aria-label="End date"
        />
      </div>
    </div>
  );
}

const hours = Array.from({ length: 24 }, (_, i) => pad(i));
const minutes = Array.from({ length: 12 }, (_, i) => pad(i * 5));

export function DateTimeField({
  name,
  required,
  defaultValue = "",
}: {
  name: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const [date, time] = defaultValue.includes("T")
    ? defaultValue.split("T")
    : [defaultValue.slice(0, 10), defaultValue.slice(11, 16) || "09:00"];
  const [day, setDay] = useState(date || "");
  const [hour, setHour] = useState((time || "09:00").slice(0, 2));
  const [minute, setMinute] = useState((time || "09:00").slice(3, 5) || "00");
  const minuteOptions = minutes.includes(minute)
    ? minutes
    : [...minutes, minute].sort();
  const value = day ? `${day}T${hour}:${minute}` : "";
  return (
    <div className="datetime-field">
      <input type="hidden" name={name} value={value} required={required} />
      <DateField value={day} required={required} onChange={setDay} />
      <div className="time-pair">
        <Select
          aria-label="Hour"
          value={hour}
          onChange={(e) => setHour(e.target.value)}
        >
          {hours.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </Select>
        <span>:</span>
        <Select
          aria-label="Minute"
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
        >
          {minuteOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
        <span className="time-utc">UTC</span>
      </div>
    </div>
  );
}
