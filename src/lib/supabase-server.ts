// lib/supabase-server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function supabaseServer() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookieStore).getAll();
        },
        // Next.js 15+ prohibits setting cookies from Server Components.
        // Provide a no-op to avoid runtime errors during token refresh.
        // Any auth-changing actions should be handled via Route Handlers or Server Actions.
        setAll(_cookiesToSet) {
          // no-op on RSC
        },
      },
    }
  );
}
