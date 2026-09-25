import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { projectUrl } from "@/lib/supabase";
import { displayNameFromUser, type Profile } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const intent =
    request.nextUrl.searchParams.get("intent") ||
    request.cookies.get("bm_signin_intent")?.value ||
    "user";
  const coordinator = intent === "coordinator";

  const client = createServerClient(
    projectUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll() {},
      },
    },
  );
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user)
    return NextResponse.redirect(new URL("/login", url.origin));

  const { data: profile } = await client
    .from("profiles")
    .select("id, role, temple_id, display_name")
    .eq("id", user.id)
    .maybeSingle();
  const row = profile as Profile | null;

  let path = "/account";
  if (row?.role === "admin" || (row?.role === "temple_coordinator" && row.temple_id))
    path = "/portal";
  else if (coordinator || !row) {
    if (coordinator) path = "/onboarding";
    else {
      await client.rpc("claim_user_profile", {
        display_name: displayNameFromUser(user),
      });
      path = "/account";
    }
  } else {
    path = "/account";
  }

  const response = NextResponse.redirect(new URL(path, url.origin));
  response.cookies.set("bm_signin_intent", "", { path: "/", maxAge: 0 });
  return response;
}
