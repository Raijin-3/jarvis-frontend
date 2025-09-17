import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Prefer server-only API_URL, then public override; default to localhost:8080 to avoid nulls in dev
const API_URL = process.env.API_URL;

async function getSupabaseFromRoute() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing Supabase env vars");

  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {}
      },
    },
  });
}

async function getBearerToken(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }
  try {
    const supabase = await getSupabaseFromRoute();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // console.log(body);
    
    // Prefer Authorization header token, fallback to Supabase session via cookies
    const token = await getBearerToken(req);
    
    if (!token) {
      return NextResponse.json({ error: "No auth token" }, { status: 401 });
    }

    console.log(`${API_URL}/v1/profile`);

    const res = await fetch(`${API_URL}/v1/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API /v1/profile failed: ${res.status} ${text}`);
    }
    
    const data = res.status === 204 ? null : await res.json();
    return NextResponse.json(data ?? { ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // Prefer Authorization header token, fallback to Supabase session via cookies
    const token = await getBearerToken(req);
    
    if (!token) {
      return NextResponse.json({ error: "No auth token" }, { status: 401 });
    }

    const res = await fetch(`${API_URL}/v1/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API /v1/profile failed: ${res.status} ${text}`);
    }
    
    const data = res.status === 204 ? null : await res.json();
    return NextResponse.json(data ?? {});
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load" }, { status: 500 });
  }
}
