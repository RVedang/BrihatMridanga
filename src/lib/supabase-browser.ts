"use client";
import { createBrowserClient } from "@supabase/ssr";

function projectUrl(raw = process.env.NEXT_PUBLIC_SUPABASE_URL || "") {
  return raw.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
}

export function browserSupabase() {
  return createBrowserClient(
    projectUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
