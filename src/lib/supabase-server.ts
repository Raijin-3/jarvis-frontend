// lib/supabase-server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function supabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("@supabase/ssr: Your project's URL and API key are required to create a Supabase client!");
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
