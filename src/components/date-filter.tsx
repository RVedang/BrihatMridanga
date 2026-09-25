"use client";
import { useState } from "react";
import { DateRangeFields } from "@/components/date-field";
import { Select } from "@/components/select";
import type { RecordItem, Temple } from "@/lib/data";

export function DateFilter({
  start,
  end,
  campaign,
  countries,
  country,
  temples,
  temple,
  centres,
  centre,
  min,
  max,
}: {
  start: string;
  end: string;
  campaign?: string;
  countries?: string[];
  country?: string;
  temples?: Temple[];
  temple?: string;
  centres?: RecordItem[];
  centre?: string;
  min?: string;
  max?: string;
}) {
  const [countryName, setCountryName] = useState(country || "");
  const [templeId, setTempleId] = useState(temple || "");
  const templeName = (id: string) =>
    temples?.find((item) => item.id === id)?.name || "Temple";
  const shownTemples = (temples || []).filter(
    (item) => !countryName || item.country === countryName,
  );
  const shownCentres = (centres || []).filter((item) => {
    if (templeId) return item.temple_id === templeId;
    if (!countryName) return true;
    return shownTemples.some((entry) => entry.id === item.temple_id);
  });
  return (
    <form
      method="get"
      className="filter-bar"
      aria-label="Filter distribution dates"
    >
      {campaign && <input type="hidden" name="campaign" value={campaign} />}
      {countries && countries.length ? (
        <label>
          Country
          <Select
            name="country"
            searchable
            placeholder="All countries"
            value={countryName}
            onChange={(e) => {
              const next = e.target.value;
              setCountryName(next);
              const current = temples?.find((item) => item.id === templeId);
              if (next && current && current.country !== next) setTempleId("");
            }}
          >
            {countries.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>
      ) : null}
      {temples && temples.length ? (
        <label>
          Temple
          <Select
            key={`temple-${countryName || "all"}`}
            name="temple"
            searchable
            placeholder="All temples"
            value={
              shownTemples.some((item) => item.id === templeId) ? templeId : ""
            }
            onChange={(e) => setTempleId(e.target.value)}
          >
            {shownTemples.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </label>
      ) : null}
      {centres && (
        <label>
          Center
          <Select
            key={`centre-${countryName || "all"}-${templeId || "all"}`}
            name="centre"
            searchable
            placeholder="All Centers"
            defaultValue={
              centre && shownCentres.some((item) => item.id === centre)
                ? centre
                : ""
            }
          >
            {shownCentres.map((item) => (
              <option key={item.id} value={item.id}>
                {templeId || !temples?.length
                  ? item.name
                  : `${item.name} · ${templeName(item.temple_id)}`}
              </option>
            ))}
          </Select>
        </label>
      )}
      <DateRangeFields start={start} end={end} min={min} max={max} />
      <button className="button" type="submit">
        Apply
      </button>
    </form>
  );
}
