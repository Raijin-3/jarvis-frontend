import { NextResponse } from "next/server";
import { apiGet } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const leaderboardName = searchParams.get('leaderboard') || 'total_points';
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const data = await apiGet(`/v1/gamification/leaderboard/${leaderboardName}?limit=${limit}`);
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    console.error('Failed to fetch leaderboard:', e);
    return NextResponse.json(
      { error: e?.message || "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}