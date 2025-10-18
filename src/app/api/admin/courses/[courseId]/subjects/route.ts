import { NextResponse } from "next/server";
import { apiPost } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const body = await req.json().catch(() => ({}));
    const { courseId } = await params;
    const data = await apiPost(`/v1/courses/${courseId}/subjects`, body);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create subject" }, { status: 500 });
  }
}

