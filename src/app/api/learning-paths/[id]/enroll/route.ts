import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sb = supabaseServer()
    const { data: { user }, error: authError } = await sb.auth.getUser()
    
    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Try to get token from session
    const { data: { session }, error: sessionError } = await sb.auth.getSession()
    
    if (sessionError) {
      console.error("Session error:", sessionError)
      return NextResponse.json({ error: "Session invalid" }, { status: 401 })
    }

    const token = request.headers.get("authorization")?.replace("Bearer ", "") || session?.access_token
    
    if (!token) {
      console.error("No token available")
      return NextResponse.json({ error: "No authentication token" }, { status: 401 })
    }

    // Check if external API is available or return mock enrollment response
    if (!process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL === 'http://localhost:8080') {
      console.warn("External API not configured, returning mock enrollment success for path:", params.id)
      
      // Return mock enrollment response
      return NextResponse.json({
        success: true,
        message: "Successfully enrolled in learning path",
        path_id: params.id,
        user_id: user.id,
        enrolled_at: new Date().toISOString()
      })
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/learning-paths/${params.id}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("External API error:", response.status, error)
        
        // If it's a JWT error, provide helpful message
        if (response.status === 401 || error.includes('JWT')) {
          console.warn("JWT authentication failed with external API, this might indicate token format mismatch")
        }
        
        return NextResponse.json({ error }, { status: response.status })
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError: any) {
      console.error("Failed to connect to external API:", fetchError.message)
      return NextResponse.json({ error: "External API unavailable" }, { status: 503 })
    }
  } catch (error: any) {
    console.error("Learning path enrollment error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}