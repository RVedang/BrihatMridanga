import "server-only";
import { redirect } from "next/navigation";
import { supabase } from "./supabase";

export type Profile = {
  id: string;
  role: "admin" | "temple_coordinator" | "user";
  temple_id: string | null;
  display_name: string;
};

export function displayNameFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const meta = user.user_metadata || {};
  const named = [meta.full_name, meta.name, meta.display_name]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .find(Boolean);
  if (named) return named.slice(0, 160);
  const email = user.email?.split("@")[0]?.replace(/[._]+/g, " ").trim();
  return email ? email.slice(0, 160) : "Friend";
}

export async function currentSession() {
  const client = await supabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { client, user: null, profile: null as Profile | null };
  const { data: profile } = await client
    .from("profiles")
    .select("id, role, temple_id, display_name")
    .eq("id", user.id)
    .maybeSingle();
  return { client, user, profile: (profile as Profile | null) || null };
}

export async function requireActor() {
  const { client, user, profile } = await currentSession();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");
  if (profile.role === "user") redirect("/account");
  if (profile.role !== "admin" && profile.role !== "temple_coordinator")
    redirect("/account");
  return { client, profile };
}

export async function requireSignedIn() {
  const session = await currentSession();
  if (!session.user) redirect("/login");
  return session;
}
