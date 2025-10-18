import { NextResponse } from "next/server";
import { apiPost } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log(req, params);
    const body = await req.json().catch(() => ({}));
    const { id } = await params;
    const data = await apiPost(`/v1/sections/${id}/practice-exercises`, body);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to add practice" }, { status: 500 });
  }
}
