"use client";

import { useId, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  X,
} from "lucide-react";
import type { TempleTeam } from "@/lib/data";
import { Select } from "@/components/select";
import { normalizeTeamSearch, teamDirectoryEntry } from "@/lib/team-directory";
import styles from "./temple-teams.module.css";

const PAGE_SIZE = 8;

export function TempleTeams({ teams }: { teams: TempleTeam[] }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [centre, setCentre] = useState("");
  const [page, setPage] = useState(0);
  const entries = useMemo(
    () =>
      teams
        .map(teamDirectoryEntry)
        .filter((entry) => entry.people.length > 0)
        .sort(
          (a, b) =>
            a.team.name.localeCompare(b.team.name, "en", {
              numeric: true,
              sensitivity: "base",
            }) ||
            (a.team.centre_name || "").localeCompare(
              b.team.centre_name || "",
              "en",
            ) ||
            a.team.id.localeCompare(b.team.id),
        ),
    [teams],
  );
  const centres = useMemo(
    () =>
      Array.from(
        new Map(
          entries.map(({ team }) => [
            team.centre_id || "unassigned",
            team.centre_name || "No centre listed",
          ]),
        ),
      ).sort((a, b) => a[1].localeCompare(b[1], "en")),
    [entries],
  );
  const terms = normalizeTeamSearch(query).split(" ").filter(Boolean);
  const filtered = entries.filter(
    (entry) =>
      (!centre || (entry.team.centre_id || "unassigned") === centre) &&
      terms.every((term) => entry.search.includes(term)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const start = currentPage * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const hasFilters = Boolean(query || centre);

  function reset() {
    setQuery("");
    setCentre("");
    setPage(0);
  }

  if (!entries.length) {
    return (
      <div
        className={styles.directory}
        role="region"
        aria-label="Team directory"
      >
        <div className={styles.empty}>
          <Users size={24} aria-hidden="true" />
          <p>No teams with listed members yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.directory} role="region" aria-label="Team directory">
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className="visually-hidden">
            Search teams, leads or members
          </span>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search teams, leads or members…"
            value={query}
            aria-controls={`${id}-results`}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
          />
        </label>
        {centres.length > 1 && (
          <div className={styles.centreFilter}>
            <Select
              value={centre}
              aria-label="Filter teams by centre"
              searchable
              onChange={(event) => {
                setCentre(event.target.value);
                setPage(0);
              }}
            >
              <option value="">All centres</option>
              {centres.map(([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
      <div className={styles.resultBar}>
        <p role="status">
          <strong>{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "team" : "teams"}
          {hasFilters ? ` found · ${entries.length} total` : " in this temple"}
        </p>
        {hasFilters ? (
          <button type="button" onClick={reset} className={styles.clear}>
            <X size={14} aria-hidden="true" />
            Clear filters
          </button>
        ) : (
          <span className={styles.hint}>Select a team to view members</span>
        )}
      </div>
      <div className={styles.columns} aria-hidden="true">
        <span>Team</span>
        <span>Centre</span>
        <span>Team lead</span>
        <span>Members</span>
        <span />
      </div>
      <div id={`${id}-results`}>
        {visible.length ? (
          visible.map(({ team, lead, people }) => (
            <details
              key={`${team.id}-${currentPage}-${query}-${centre}`}
              className={styles.row}
            >
              <summary>
                <span className={styles.teamName}>{team.name}</span>
                <span className={styles.centre}>
                  {team.centre_name || "No centre listed"}
                </span>
                <span className={lead ? styles.lead : styles.unlisted}>
                  <span className={styles.mobileLabel}>Lead: </span>
                  {lead?.name || "Not listed"}
                </span>
                <span className={styles.count}>
                  <Users size={14} aria-hidden="true" />
                  {people.length}
                  <span className="visually-hidden">
                    {people.length === 1 ? " member" : " members"}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  className={styles.chevron}
                  aria-hidden="true"
                />
              </summary>
              <div className={styles.detail}>
                <p className={styles.detailLabel}>Team members</p>
                {people.length ? (
                  <ul className={styles.members}>
                    {people.map((member) => (
                      <li key={member.id}>
                        <span>{member.name}</span>
                        {member.coordinator && (
                          <span className={styles.badge}>Team lead</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.emptyMembers}>
                    No members listed for this team yet.
                  </p>
                )}
              </div>
            </details>
          ))
        ) : (
          <div className={styles.empty}>
            <Search size={24} aria-hidden="true" />
            <p>No teams match your search.</p>
            <button type="button" onClick={reset}>
              Show all teams
            </button>
          </div>
        )}
      </div>
      {filtered.length > 0 && (
        <div className={styles.footer}>
          <span>
            {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </span>
          {pages > 1 && (
            <nav
              aria-label="Team directory pages"
              className={styles.pagination}
            >
              <button
                type="button"
                aria-label="Previous teams"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <span aria-live="polite">
                Page {currentPage + 1} of {pages}
              </span>
              <button
                type="button"
                aria-label="Next teams"
                disabled={currentPage === pages - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
