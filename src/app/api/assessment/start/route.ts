import { NextResponse } from "next/server";
import { apiPost } from "@/lib/api";

export async function POST() {
  try {
    const data = await apiPost("/v1/assessments/start", {});
    return NextResponse.json(data);
  } catch (e: any) {
    console.error("Assessment start error:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to start assessment" },
      { status: 500 },
    );
  }
}
