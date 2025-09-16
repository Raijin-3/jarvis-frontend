import { NextResponse, type NextRequest } from "next/server";

// Clears Supabase auth-related cookies (sb-*). Useful for debugging.
export async function POST(request: NextRequest) {
  const cleared: string[] = [];
  const response = NextResponse.json({ ok: true, cleared });

  try {
    const all = request.cookies.getAll();
    for (const c of all) {
      if (c.name.startsWith("sb-")) {
        response.cookies.delete(c.name);
        cleared.push(c.name);
      }
    }
    // Also clear common generic names if present
    for (const name of ["sb-access-token", "sb-refresh-token"]) {
      if (request.cookies.get(name)) {
        response.cookies.delete(name);
        cleared.push(name);
      }
    }
  } catch {}

  return response;
}

