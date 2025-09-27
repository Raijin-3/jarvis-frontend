import { NextRequest, NextResponse } from "next/server";
import { apiPost } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await apiPost("/v1/subject-selection/select", body);
    return NextResponse.json(data ?? { success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save subject selection" }, { status: 500 });
  }
}