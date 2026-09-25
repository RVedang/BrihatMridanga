"use client";
import type { Campaign, Temple } from "@/lib/data";
import { partitionCampaigns } from "@/lib/campaign";
import { Select } from "@/components/select";

export function CampaignSelect({
  campaigns,
  temples,
  country,
  temple,
  value,
  onChange,
}: {
  campaigns: Campaign[];
  temples: Temple[];
  country?: string;
  temple?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const { movement, regional } = partitionCampaigns(
    campaigns,
    temples,
    country,
    temple,
  );
  const listed = new Set([...movement, ...regional].map((c) => c.id));
  const selected = value && listed.has(value) ? value : "";
  return (
    <Select
      name="campaign"
      value={onChange ? selected : undefined}
      defaultValue={onChange ? undefined : selected}
      onChange={(e) => onChange?.(e.target.value)}
    >
      <option value="">All campaigns</option>
      {movement.length > 0 && (
        <optgroup label="Movement-wide">
          {movement.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </optgroup>
      )}
      {regional.length > 0 && (
        <optgroup label="Regional">
          {regional.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </optgroup>
      )}
    </Select>
  );
}
