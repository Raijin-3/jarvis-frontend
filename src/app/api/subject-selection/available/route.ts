import { NextResponse } from "next/server";
import { apiGet } from "@/lib/api";

export async function GET() {
  try {
    const data = await apiGet("/v1/subject-selection/available");
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to get available subjects" }, { status: 500 });
  }
}