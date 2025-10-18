import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sb = supabaseServer()
    const { data: { user }, error: authError } = await sb.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { data: { session } } = await sb.auth.getSession()
    if (!session?.access_token) {
      return NextResponse.json({ error: "No session token" }, { status: 401 })
    }

    const response = await fetch(`${API_BASE_URL}/v1/admin/course-assignments/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Course assignment GET error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sb = supabaseServer()
    const { data: { user }, error: authError } = await sb.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { data: { session } } = await sb.auth.getSession()
    if (!session?.access_token) {
      return NextResponse.json({ error: "No session token" }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(`${API_BASE_URL}/v1/admin/course-assignments/${id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Course assignment PUT error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sb = supabaseServer()
    const { data: { user }, error: authError } = await sb.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { data: { session } } = await sb.auth.getSession()
    if (!session?.access_token) {
      return NextResponse.json({ error: "No session token" }, { status: 401 })
    }

    const response = await fetch(`${API_BASE_URL}/v1/admin/course-assignments/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error }, { status: response.status })
    }

    return NextResponse.json({ message: "Course assignment deleted successfully" })
  } catch (error: any) {
    console.error("Course assignment DELETE error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}