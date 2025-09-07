import { NextResponse } from "next/server";
import { apiDelete, apiPut } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase-server";

export async function PUT(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const body = await req.json().catch(() => ({}));
    const { courseId } = await params;
    
    try {
      const data = await apiPut(`/v1/courses/${courseId}`, body);
      return NextResponse.json(data);
    } catch (apiError) {
      console.log('Backend failed, trying direct Supabase:', apiError);
      // Fallback to direct Supabase
      const sb = supabaseServer();
      const updateData = {
        ...body,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await sb
        .from('courses')
        .update(updateData)
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update course" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const body = await req.json().catch(() => ({}));
    const { courseId } = await params;
    
    try {
      const data = await apiPut(`/v1/courses/${courseId}`, body);
      return NextResponse.json(data);
    } catch (apiError) {
      console.log('Backend failed, trying direct Supabase:', apiError);
      // Fallback to direct Supabase
      const sb = supabaseServer();
      const updateData = {
        ...body,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await sb
        .from('courses')
        .update(updateData)
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params;
    
    try {
      const data = await apiDelete(`/v1/courses/${courseId}`);
      return NextResponse.json(data ?? { ok: true });
    } catch (apiError) {
      console.log('Backend failed, trying direct Supabase:', apiError);
      // Fallback to direct Supabase
      const sb = supabaseServer();
      const { error } = await sb
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete course" }, { status: 500 });
  }
}

