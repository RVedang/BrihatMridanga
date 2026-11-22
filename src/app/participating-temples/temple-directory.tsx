"use client";

import { ChevronRight, Mail, MapPin, Phone, Search } from "lucide-react";
import { useState } from "react";
import { Select } from "@/components/select";
import { contactName, phoneLink, type MarathonTemple } from "@/lib/marathon";
import styles from "./page.module.css";

export function TempleDirectory({ temples }: { temples: MarathonTemple[] }) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [expandedName, setExpandedName] = useState("");
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

  const selected =
    visible.find((temple) => temple.name === selectedName) ?? visible[0];
  const profile = selected && (
    <section className={styles.profile} aria-label={selected.name}>
      <header>
        <p>
          <MapPin size={16} aria-hidden="true" />
          {[selected.city, selected.country].filter(Boolean).join(", ")}
        </p>
        <h2>{selected.name}</h2>
      </header>
      <div className={styles.contact}>
        {selected.spoc && (
          <p>
            <span>Contact person</span>
            <strong>{contactName(selected.spoc)}</strong>
          </p>
        )}
        {selected.email && (
          <a href={`mailto:${selected.email}`}>
            <Mail size={18} aria-hidden="true" />
            <span>
              <small>Email</small>
              {selected.email}
            </span>
          </a>
        )}
        {selected.phone && (
          <a href={phoneLink(selected)}>
            <Phone size={18} aria-hidden="true" />
            <span>
              <small>Call</small>
              {selected.phone}
            </span>
          </a>
        )}
        {!selected.email && !selected.phone && "Contact details pending"}
      </div>
    </section>
  );

  return (
    <div className={styles.directory}>
      <div className={styles.filters}>
        <label>
          <span>Search temples</span>
          <span className={styles.searchBox}>
            <Search size={18} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Temple, city or contact"
              type="search"
            />
          </span>
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

      {selected ? (
        <div className={styles.browser}>
          <div
            className={styles.navigator}
            role="region"
            aria-label="Temple list"
            tabIndex={0}
          >
            <ul className={styles.index} aria-label="Temples">
              {visible.map((temple) => (
                <li key={temple.name}>
                  <button
                    className={styles.desktopToggle}
                    type="button"
                    aria-pressed={selected === temple}
                    onClick={() => setSelectedName(temple.name)}
                  >
                    {temple.name}
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                  <button
                    className={styles.mobileToggle}
                    type="button"
                    aria-expanded={expandedName === temple.name}
                    onClick={() => setExpandedName((name) => name === temple.name ? "" : temple.name)}
                  >
                    {temple.name}
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                  {expandedName === temple.name && (
                    <div className={styles.mobileProfile}>
                      {temple.spoc && (
                        <div>
                          <small className={styles.contactPersonLabel}>Contact person</small>
                          <strong>{contactName(temple.spoc)}</strong>
                        </div>
                      )}
                      {temple.email && (
                        <a href={`mailto:${temple.email}`}>
                          <Mail size={15} aria-hidden="true" />{temple.email}
                        </a>
                      )}
                      {temple.phone && (
                        <a href={phoneLink(temple)}>
                          <Phone size={15} aria-hidden="true" />Call {temple.phone}
                        </a>
                      )}
                      {!temple.email && !temple.phone && "Contact details pending"}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.desktopProfile}>{profile}</div>
        </div>
      ) : (
        <p className={styles.noResults}>No temples match your search.</p>
      )}
    </div>
  );
}
