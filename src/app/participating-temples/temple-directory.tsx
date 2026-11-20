"use client";

import { useState } from "react";
import { Select } from "@/components/select";
import { contactName, phoneLink, type MarathonTemple } from "@/lib/marathon";
import styles from "./page.module.css";

export function TempleDirectory({ temples }: { temples: MarathonTemple[] }) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const countries = [
    ...new Set(temples.map((temple) => temple.country)),
  ].sort();
  const term = search.trim().toLocaleLowerCase();
  const visible = temples
    .filter(
      (temple) =>
        (!country || temple.country === country) &&
        (!term ||
          `${temple.name} ${temple.city} ${contactName(temple.spoc)}`
            .toLocaleLowerCase()
            .includes(term)),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={styles.directory}>
      <div className={styles.filters}>
        <label>
          <span>Search temples</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Temple, city or contact"
            type="search"
          />
        </label>
        <fieldset className={styles.countryFilter}>
          <legend>Country</legend>
          <Select
            aria-label="Country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
          >
            <option value="">All countries</option>
            {countries.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </fieldset>
        <p aria-live="polite">
          {visible.length} {visible.length === 1 ? "temple" : "temples"}
        </p>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Temple</th>
              <th scope="col">Location</th>
              <th scope="col">Contact</th>
              <th scope="col">Reach out</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((temple) => (
              <tr key={temple.name}>
                <th scope="row">{temple.name}</th>
                <td>
                  {temple.city}, {temple.country}
                </td>
                <td>{temple.spoc ? contactName(temple.spoc) : "—"}</td>
                <td className={styles.links}>
                  {temple.email && (
                    <a href={`mailto:${temple.email}`}>{temple.email}</a>
                  )}
                  {temple.phone && (
                    <a href={phoneLink(temple)}>{temple.phone}</a>
                  )}
                  {!temple.email && !temple.phone && "Contact details pending"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className={styles.noResults}>No temples match your search.</p>
        )}
      </div>
    </div>
  );
}
