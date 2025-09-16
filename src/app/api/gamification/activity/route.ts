import { NextResponse } from "next/server";
import { apiPost } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.userId || !body.activityType) {
      return NextResponse.json(
        { error: "userId and activityType are required" },
        { status: 400 }
      );
    }

    // Forward to the NestJS gamification service
    const data = await apiPost(`/v1/gamification/activity/${body.userId}`, {
      activityType: body.activityType,
      referenceId: body.referenceId,
      referenceType: body.referenceType,
      durationMinutes: body.durationMinutes
    });

    return NextResponse.json(data ?? { success: true });
  } catch (e: any) {
    console.error('Gamification activity recording failed:', e);
    return NextResponse.json(
      { error: e?.message || "Failed to record activity" },
      { status: 500 }
    );
  }
}