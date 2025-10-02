import { NextResponse } from "next/server";
import { apiPost } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id } = await params;
    const data = await apiPost(`/v1/sections/${id}/generate-and-add-quiz`, body);
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('Generate and add quiz error:', e);
    return NextResponse.json({ error: e?.message || "Failed to generate and add quiz" }, { status: 500 });
  }
}
