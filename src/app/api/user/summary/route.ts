import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { apiGet } from "@/lib/api";

export async function GET() {
  try {
    // Check if we have required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // During static generation, return default values
      return NextResponse.json({
        name: "Learner",
        xp: 1540,
        level: 2,
        tier: "Silver",
        role: "student",
      });
    }

    const sb = supabaseServer();
    const [{ data: { user } }, dash] = await Promise.all([
      sb.auth.getUser(),
      apiGet<any>("/v1/dashboard").catch(() => null),
    ]);

    const xp = Number(dash?.stats?.xp ?? 0);
    const level = Math.floor(xp / 1000) + 1;
    const name =
      (dash?.user?.displayName && String(dash.user.displayName).trim()) ||
      (user?.user_metadata?.full_name && String(user.user_metadata.full_name).trim()) ||
      (user?.user_metadata?.name && String(user.user_metadata.name).trim()) ||
      (user?.email ? user.email.split("@")[0] : undefined) ||
      "Learner";
    const tier = String(dash?.stats?.tier || "Silver");

    // Get user role from profile
    let role = "student"; // default role
    if (user?.id) {
      try {
        // Get user role from backend API
        const profileResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/profile/${user.id}`,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(user?.access_token && { 'Authorization': `Bearer ${user.access_token}` }),
            },
            cache: 'no-store',
          }
        );
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          role = profile?.role || "student";
        }
      } catch (error) {
        console.warn("Could not fetch user role:", error);
        // Keep default role as student
      }
    }

    return NextResponse.json({ name, xp, level, tier, role });
  } catch (e: any) {
    console.error("Error in /api/user/summary:", e);
    return NextResponse.json(
      { name: "Learner", xp: 1540, level: 2, tier: "Silver", role: "student" },
      { status: 200 },
    );
  }
}

