import { NextResponse } from "next/server";
import { apiPost } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = await apiPost("/v1/assessments/finish", body);
    return NextResponse.json(data ?? { ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to submit" }, { status: 500 });
  }
}
