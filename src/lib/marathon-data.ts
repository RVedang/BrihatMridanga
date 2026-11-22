import "server-only";
import { isConfigured, supabase } from "./supabase";
import {
  hkmMumbaiContact,
  plannedMarathonTemples,
} from "./marathon-planned-temples";
import type { MarathonTemple, Standing } from "./marathon";
export type MarathonEntry = MarathonTemple & {
  temple_id: string;
  starts_on: string | null;
  ends_on: string | null;
};
export async function marathonDirectory(): Promise<MarathonEntry[]> {
  if (!isConfigured()) return [];
  const client = await supabase();
  const { data, error } = await client
    .from("marathon_temples")
    .select("*")
    .order("name");
  if (error && error.code !== "PGRST205") throw error;
  // Serve the corrected contact while the data migration is pending.
  return (data || []).map((temple: MarathonEntry) =>
    temple.name === "HKM Mumbai" &&
    temple.city === "Mumbai" &&
    temple.country === "India" &&
    temple.spoc === "Gaurmandal Prabhu" &&
    temple.email === "gmnd@hkmmumbai.org" &&
    temple.phone === "9784592103"
      ? { ...temple, ...hkmMumbaiContact }
      : temple,
  );
}
export async function marathonPublicDirectory(): Promise<MarathonTemple[]> {
  const saved = await marathonDirectory();
  return saved.length ? saved : plannedMarathonTemples;
}
export async function marathonStandings(): Promise<{
  rows: Standing[];
  refreshAt: string | null;
}> {
  if (!isConfigured()) return { rows: [], refreshAt: null };
  const client = await supabase();
  const { data, error } = await client.rpc("marathon_standings");
  if (error && error.code !== "PGRST202") throw error;
  return data || { rows: [], refreshAt: null };
}
