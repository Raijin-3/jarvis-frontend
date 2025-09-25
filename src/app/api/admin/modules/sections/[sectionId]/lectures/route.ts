import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Use configured API URL; default to local Nest API in dev
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function getAuthHeaders() {
  const supabase = supabaseServer();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

// POST /api/admin/modules/sections/[sectionId]/lectures - Create multiple lectures for section
export async function POST(request: Request, { params }: { params: Promise<{ sectionId: string }> }) {
  try {
    const headers = await getAuthHeaders();
    const body = await request.json();
    const { sectionId } = await params;

    const response = await fetch(`${API_BASE_URL}/v1/admin/modules/sections/${sectionId}/lectures`, {
      method: 'POST',
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
    console.error('Admin create lectures API error:', error);
    return NextResponse.json(
      { error: 'Failed to create lectures' },
      { status: 500 }
    );
  }
}
