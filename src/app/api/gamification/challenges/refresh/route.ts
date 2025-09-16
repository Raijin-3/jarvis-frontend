import { NextResponse } from "next/server";
import { apiPost } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body?.userId as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    const data = await apiPost(`/v1/gamification/challenges/refresh/${userId}`, {});
    return NextResponse.json(data ?? { success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to refresh challenges" }, { status: 500 });
  }
}

