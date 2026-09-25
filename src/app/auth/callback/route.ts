import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { projectUrl } from "@/lib/supabase";

function safeNext(raw: string | null, intent: string) {
  const fallback = `/auth/continue?intent=${intent}`;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

function signInIntent(request: NextRequest) {
  const fromQuery = request.nextUrl.searchParams.get("intent");
  const fromCookie = request.cookies.get("bm_signin_intent")?.value;
  const value = fromQuery || fromCookie || "user";
  return value === "coordinator" ? "coordinator" : "user";
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const intent = signInIntent(request);
  const destination = safeNext(url.searchParams.get("next"), intent);
  if (!code) {
    return NextResponse.redirect(
      new URL("/login?message=sign-in-failed", url.origin),
    );
  }

  let response = NextResponse.redirect(new URL(destination, url.origin));
  const client = createServerClient(
    projectUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.redirect(new URL(destination, url.origin));
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error)
    return NextResponse.redirect(
      new URL("/login?message=sign-in-failed", url.origin),
    );
  response.cookies.set("bm_signin_intent", "", { path: "/", maxAge: 0 });
  return response;
}
