import { NextResponse } from "next/server";
import { apiPost } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const sb = supabaseServer();
    const { data, error } = await sb
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (e: any) {
    console.error('API error:', e);
    return NextResponse.json({ error: e?.message || "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const sb = supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Not authenticated. Please sign in to create courses." }, { status: 401 });
    }
    const title = String(body?.title || '').trim();
    const description = typeof body?.description === 'string' ? body.description.trim() : null;
    const difficulty = body?.difficulty || 'beginner';
    const category = body?.category || 'General';
    const status = body?.status || 'draft';

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Temporarily create course via direct HTTP call to backend API
    try {
      const API_URL = process.env.API_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/v1/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // For development, using a mock admin token - this should be properly authenticated in production
          "Authorization": "Bearer mock-admin-token"
        },
        body: JSON.stringify({
          title,
          description,
          difficulty,
          category,
          status,
          created_by: user?.id,
        }),
      });

      if (!res.ok) {
        // If backend fails, create directly in Supabase
        const { data, error } = await sb
          .from('courses')
          .insert({
            title,
            description,
            difficulty,
            category,
            status,
            created_by: user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json(data);
      }

      const data = await res.json();
      return NextResponse.json(data);
    } catch (backendError) {
      // console.log('Backend failed, trying direct Supabase:', backendError);
      // Fallback to direct Supabase
      const { data, error } = await sb
        .from('courses')
        .insert({
          title,
          description,
          difficulty,
          category,
          status,
          created_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (e: any) {
    console.error('API error:', e);
    const message = e?.message || "Failed to create course";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
