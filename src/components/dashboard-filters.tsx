"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import type { Campaign, Temple, RecordItem, DashboardFilters } from "@/lib/data";
import { partitionCampaigns } from "@/lib/campaign";
import { Select } from "@/components/select";
import { DateField } from "@/components/date-field";
import { CampaignSelect } from "@/components/campaign-select";
import { categoryLabels } from "@/lib/catalog";

export function DashboardFilterForm({
  filters,
  defaults,
  campaigns,
  temples,
  centres,
  countries,
  languages,
  active,
}: {
  filters: DashboardFilters;
  defaults: { start: string; end: string };
  campaigns: Campaign[];
  temples: Temple[];
  centres: RecordItem[];
  countries: string[];
  languages: string[];
  active: number;
}) {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState(filters.country || "");
  const [temple, setTemple] = useState(filters.temple || "");
  const [centre, setCentre] = useState(filters.centre || "");
  const [campaign, setCampaign] = useState(filters.campaign || "");
  useEffect(() => {
    setCountry(filters.country || "");
    setTemple(filters.temple || "");
    setCentre(filters.centre || "");
    setCampaign(filters.campaign || "");
  }, [filters.country, filters.temple, filters.centre, filters.campaign]);
  const templesShown = country
    ? temples.filter((t) => t.country === country)
    : temples;
  const centresShown = centres.filter(
    (c) =>
      (!temple || c.temple_id === temple) &&
      (!country ||
        temples.some((t) => t.id === c.temple_id && t.country === country)),
  );
  const { regional, movement } = partitionCampaigns(
    campaigns,
    temples,
    country || undefined,
    temple || undefined,
  );
  const campaignOk = [...movement, ...regional].some((c) => c.id === campaign);
  useEffect(() => {
    if (campaign && !campaignOk) setCampaign("");
  }, [campaign, campaignOk]);
  useEffect(() => {
    if (
      temple &&
      country &&
      !temples.some((t) => t.id === temple && t.country === country)
    )
      setTemple("");
  }, [country, temple, temples]);
  useEffect(() => {
    if (
      centre &&
      ((temple && !centres.some((c) => c.id === centre && c.temple_id === temple)) ||
        (country &&
          !centres.some(
            (c) =>
              c.id === centre &&
              temples.some((t) => t.id === c.temple_id && t.country === country),
          )))
    )
      setCentre("");
  }, [centre, temple, country, centres, temples]);
  const year = new Date().getUTCFullYear();
  const preset = (label: string, start: string, end: string) => {
    const params = new URLSearchParams();
    params.set("start", start);
    params.set("end", end);
    for (const k of ["campaign", "country", "temple", "centre", "language", "category"] as const)
      if (filters[k]) params.set(k, filters[k]!);
    const current = filters.start === start && filters.end === end;
    return (
      <Link
        key={label}
        href={`/dashboard?${params}`}
        className={current ? "chip chip-on" : "chip"}
        aria-current={current ? "true" : undefined}
      >
        {label}
      </Link>
    );
  };
  const today = new Date().toISOString().slice(0, 10);
  const yearAgo = new Date();
  yearAgo.setUTCFullYear(yearAgo.getUTCFullYear() - 1);
  yearAgo.setUTCDate(yearAgo.getUTCDate() + 1);
  return (
    <div className={open ? "filters open" : "filters"}>
      <button
        type="button"
        className="filters-toggle"
        aria-expanded={open}
        aria-controls="dashboard-filters"
        onClick={() => setOpen(!open)}
      >
        <SlidersHorizontal size={16} />
        Filters
        {active > 0 && <span className="filters-count">{active}</span>}
        <ChevronDown size={16} className="filters-chevron" />
      </button>
      <div className="filters-body" id="dashboard-filters">
        <div className="chips" aria-label="Quick date ranges">
          {preset("This year", `${year}-01-01`, `${year}-12-31`)}
          {preset("Last year", `${year - 1}-01-01`, `${year - 1}-12-31`)}
          {preset(
            "Last 12 months",
            yearAgo.toISOString().slice(0, 10),
            today,
          )}
          {preset("All time", "2000-01-01", `${year}-12-31`)}
        </div>
        <form method="get" className="filters-form" aria-label="Dashboard filters">
          <label>
            Start date
            <DateField
              name="start"
              required
              defaultValue={filters.start || defaults.start}
            />
          </label>
          <label>
            End date
            <DateField
              name="end"
              required
              defaultValue={filters.end || defaults.end}
            />
          </label>
          <label>
            Country
            <Select
              name="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Temple
            <Select
              key={`temple-${country || "all"}`}
              name="temple"
              value={temple}
              searchable
              onChange={(e) => setTemple(e.target.value)}
            >
              <option value="">All temples</option>
              {templesShown.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {country ? "" : ` · ${t.country}`}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Center
            <Select
              key={`centre-${country}-${temple}`}
              name="centre"
              value={centre}
              onChange={(e) => setCentre(e.target.value)}
            >
              <option value="">All Centers</option>
              {centresShown.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Campaign
            <CampaignSelect
              campaigns={campaigns}
              temples={temples}
              country={country || undefined}
              temple={temple || undefined}
              value={campaignOk ? campaign : ""}
              onChange={setCampaign}
            />
          </label>
          <label>
            Language
            <Select name="language" defaultValue={filters.language || ""}>
              <option value="">All languages</option>
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Book type
            <Select name="category" defaultValue={filters.category || ""}>
              <option value="">All book types</option>
              {Object.entries(categoryLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </label>
          <div className="filters-actions">
            <button className="button" type="submit">
              Apply filters
            </button>
            <Link href="/dashboard" className="text-link">
              Reset
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
