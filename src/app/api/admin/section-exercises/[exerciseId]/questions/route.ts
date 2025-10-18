import { NextResponse } from "next/server";
import { apiGet, apiPost } from "@/lib/api";

export async function GET(_: Request, { params }: { params: Promise<{ exerciseId: string }> }) {
  try {
    const { exerciseId } = await params;
    const data = await apiGet(`/v1/admin/section-exercises/${exerciseId}/questions`);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load exercise questions" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ exerciseId: string }> }) {
  try {
    const { exerciseId } = await params;
    const body = await req.json().catch(() => ({}));
    const data = await apiPost(`/v1/admin/section-exercises/${exerciseId}/questions`, body);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to create exercise question" },
      { status: 500 },
    );
  }
}
