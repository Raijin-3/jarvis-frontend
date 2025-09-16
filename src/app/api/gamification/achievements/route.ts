import { NextResponse } from "next/server";
import { apiGet } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    const data = await apiGet(`/v1/gamification/achievements/${userId}`);
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    console.error('Failed to fetch achievements:', e);
    return NextResponse.json(
      { error: e?.message || "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}