import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
function projectUrl(raw = process.env.NEXT_PUBLIC_SUPABASE_URL || "") {
  return raw.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (
    !projectUrl() ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return response;
  const client = createServerClient(
    projectUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  await client.auth.getUser();
  return response;
}
export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?|txt|xml)$).*)",
  ],
};
