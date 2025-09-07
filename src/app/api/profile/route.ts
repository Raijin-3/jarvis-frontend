import { NextResponse } from "next/server";
import { apiGet, apiPut } from "@/lib/api";

export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = await apiPut("/v1/profile", body);
    return NextResponse.json(data ?? { ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const data = await apiGet("/v1/profile");
    return NextResponse.json(data ?? {});
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load" }, { status: 500 });
  }
}
