import "server-only";
import { displayNameFromUser, type Profile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type ServerClient = Awaited<ReturnType<typeof supabase>>;

export async function pathAfterSignIn(client: ServerClient, intent: string) {
  const coordinator = intent === "coordinator";
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return "/login";

  const { data: profile } = await client
    .from("profiles")
    .select("id, role, temple_id, display_name")
    .eq("id", user.id)
    .maybeSingle();
  const row = profile as Profile | null;

  if (
    row?.role === "admin" ||
    (row?.role === "temple_coordinator" && row.temple_id)
  )
    return "/portal";
  if (coordinator) return "/onboarding";
  if (!row) {
    await client.rpc("claim_user_profile", {
      display_name: displayNameFromUser(user),
    });
  }
  return "/account";
}
