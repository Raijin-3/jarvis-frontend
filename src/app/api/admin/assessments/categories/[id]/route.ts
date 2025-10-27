import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, buildAuthHeaders } from "../../helpers";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = await buildAuthHeaders({ "Content-Type": "application/json" });
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/v1/admin/assessments/categories/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin assessment category PUT error:", error);
    return NextResponse.json({ error: "Failed to update assessment category" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = await buildAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/v1/admin/assessments/categories/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin assessment category DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete assessment category" }, { status: 500 });
  }
}
