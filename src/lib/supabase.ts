import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function projectUrl(raw = process.env.NEXT_PUBLIC_SUPABASE_URL || "") {
  return raw.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
}

export function isConfigured() {
  return Boolean(
    projectUrl() && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export async function supabase() {
  if (!isConfigured()) throw new Error("Backend not configured");
  const jar = await cookies();
  return createServerClient(
    projectUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server components cannot set cookies; proxy refreshes them. */
          }
        },
      },
    },
  );
}
