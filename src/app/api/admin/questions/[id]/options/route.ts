import { NextResponse } from "next/server";
import { apiPost } from "@/lib/api";

export async function POST(req: Request, { params }: { params: { questionId: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = await apiPost(`/v1/questions/${params.questionId}/options`, body);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create option" }, { status: 500 });
  }
}

