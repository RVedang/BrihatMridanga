import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { pathAfterSignIn } from "@/lib/after-sign-in";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const intent =
    request.nextUrl.searchParams.get("intent") ||
    request.cookies.get("bm_signin_intent")?.value ||
    "user";
  const path = await pathAfterSignIn(await supabase(), intent);
  const jar = await cookies();
  jar.set("bm_signin_intent", "", { path: "/", maxAge: 0 });
  redirect(path);
}
