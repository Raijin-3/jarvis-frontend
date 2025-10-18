import { NextResponse } from "next/server";
import { apiDelete, apiPut } from "@/lib/api";

export async function PUT(req: Request, { params }: { params: { exerciseId: string; questionId: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = await apiPut(
      `/v1/admin/section-exercises/${params.exerciseId}/questions/${params.questionId}`,
      body,
    );
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to update exercise question" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: { params: { exerciseId: string; questionId: string } }) {
  try {
    const data = await apiDelete(
      `/v1/admin/section-exercises/${params.exerciseId}/questions/${params.questionId}`,
    );
    return NextResponse.json(data ?? { ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to delete exercise question" },
      { status: 500 },
    );
  }
}
