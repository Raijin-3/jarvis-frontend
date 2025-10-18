import { NextResponse } from "next/server";
import { apiGet, apiPost } from "@/lib/api";

export async function GET(_: Request, { params }: { params: Promise<{ sectionId: string }> }) {
  try {
    const { sectionId } = await params;
    const data = await apiGet(`/v1/admin/section-exercises/section/${sectionId}`);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load section exercises" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ sectionId: string }> }) {
  try {
    const { sectionId } = await params;
    const body = await req.json().catch(() => ({}));
    const data = await apiPost(`/v1/admin/section-exercises/section/${sectionId}`, body);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to create section exercise" },
      { status: 500 },
    );
  }
}
