import { NextResponse } from "next/server";
import { apiPost } from "@/lib/api";

export async function POST() {
  try {
    const data = await apiPost("/v1/assessments/start", {});
    return NextResponse.json(data ?? { ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to start" }, { status: 500 });
  }
}
