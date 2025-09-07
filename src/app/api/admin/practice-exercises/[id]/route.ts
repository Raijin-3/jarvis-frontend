import { NextResponse } from "next/server";
import { apiPut, apiDelete } from "@/lib/api";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = await apiPut(`/v1/practice-exercises/${params.id}`, body);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update practice" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const data = await apiDelete(`/v1/practice-exercises/${params.id}`);
    return NextResponse.json(data ?? { ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete practice" }, { status: 500 });
  }
}

