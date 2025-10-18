import { NextResponse } from "next/server";
import { apiDelete, apiPut } from "@/lib/api";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const data = await apiPut(`/v1/sections/${id}`, body);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update section" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await apiDelete(`/v1/sections/${id}`);
    return NextResponse.json(data ?? { ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete section" }, { status: 500 });
  }
}

