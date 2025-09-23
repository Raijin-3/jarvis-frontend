import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
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

    // Always try to call the real API for learning path refresh
    // Only fall back to mock data if API is completely unavailable

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/learning-paths/user/refresh`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("External API error:", response.status, error)
        return NextResponse.json({ error }, { status: response.status })
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError: any) {
      console.error("Failed to connect to external API:", fetchError.message)
      return NextResponse.json({ error: "External API unavailable" }, { status: 503 })
    }
  } catch (error: any) {
    console.error("Learning path refresh error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
