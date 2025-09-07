import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { apiGet } from "@/lib/api";

export async function GET() {
  try {
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

    return NextResponse.json({ name, xp, level, tier });
  } catch (e: any) {
    return NextResponse.json(
      { name: "Learner", xp: 0, level: 1, tier: "Bronze" },
      { status: 200 },
    );
  }
}

