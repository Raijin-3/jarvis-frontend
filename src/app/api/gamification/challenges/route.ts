import { NextResponse } from "next/server";
import { apiGet, apiPost } from "@/lib/api";

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

    const data = await apiGet(`/v1/gamification/challenges/${userId}`);
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    console.error('Failed to fetch challenges:', e);
    return NextResponse.json(
      { error: e?.message || "Failed to fetch challenges" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Update challenge progress (align with backend signature)
    const data = await apiPost(
      `/v1/gamification/challenges/${body.userId}/${body.challengeId}`,
      { progressIncrement: body.progressIncrement ?? body.progress }
    );

    return NextResponse.json(data ?? { success: true });
  } catch (e: any) {
    console.error('Failed to update challenge progress:', e);
    return NextResponse.json(
      { error: e?.message || "Failed to update challenge progress" },
      { status: 500 }
    );
  }
}
