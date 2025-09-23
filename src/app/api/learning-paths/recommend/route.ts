import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    // Handle test token for development
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (token !== "test-token") {
      // Production authentication flow
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

      const sessionToken = session?.access_token

      if (!sessionToken) {
        console.error("No token available")
        return NextResponse.json({ error: "No authentication token" }, { status: 401 })
      }
    }

    const body = await request.json()

    console.log("Making request to external API:", `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/learning-paths/recommend`)
    
    // Check if external API is available
    if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
      console.warn("External API not configured, returning mock data")
      // Return mock learning path recommendation
      const mockPath = {
        id: "data-analytics-beginner",
        title: "Data Analytics Fundamentals",
        description: "Start your analytics journey with essential skills in SQL, Excel, and data visualization.",
        difficulty: "Beginner",
        difficulty_level: "beginner",
        career_goal: "data_analyst",
        estimated_duration: "6-8 weeks",
        estimated_duration_weeks: 8,
        color: "#4f46e5",
        icon: "📊",
        skills: ["SQL", "Excel", "Data Visualization", "Statistics Basics"],
        steps: [
          {
            id: "sql-basics",
            title: "SQL Fundamentals",
            description: "Learn the basics of SQL for data retrieval and manipulation",
            step_type: "lesson",
            order_index: 1,
            estimated_hours: 20,
            skills: ["SQL", "Database Queries", "Data Filtering"],
            prerequisites: [],
            is_required: true,
            order: 1,
            estimated_duration: "2 weeks",
            completed: false
          },
          {
            id: "excel-analysis",
            title: "Excel for Data Analysis",
            description: "Master Excel functions, pivot tables, and charts",
            step_type: "practice",
            order_index: 2,
            estimated_hours: 15,
            skills: ["Excel", "Pivot Tables", "Data Analysis"],
            prerequisites: ["sql-basics"],
            is_required: true,
            order: 2,
            estimated_duration: "2 weeks",
            completed: false
          },
          {
            id: "data-viz",
            title: "Data Visualization Basics",
            description: "Create compelling charts and dashboards",
            step_type: "project",
            order_index: 3,
            estimated_hours: 25,
            skills: ["Data Visualization", "Chart Design", "Dashboard Creation"],
            prerequisites: ["excel-analysis"],
            is_required: true,
            order: 3,
            estimated_duration: "2 weeks",
            completed: false
          }
        ]
      }
      return NextResponse.json(mockPath)
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/learning-paths/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
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
    console.error("Learning path recommendation error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
