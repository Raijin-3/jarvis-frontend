import { NextResponse } from "next/server";
import { apiGet } from "@/lib/api";

export async function GET(_: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params;
    const data = await apiGet(`/v1/courses/${courseId}/full`);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch course" }, { status: 500 });
  }
}
