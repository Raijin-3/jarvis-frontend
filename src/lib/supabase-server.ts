// lib/supabase-server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function supabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("@supabase/ssr: Supabase URL and anon (or service) key are required to create a Supabase client. Provide NEXT_PUBLIC_ or server-side SUPABASE_ env vars.");
  }

  const cookieStore = cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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
