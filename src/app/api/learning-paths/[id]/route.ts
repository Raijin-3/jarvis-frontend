import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(
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

    // Check if external API is available or return mock data for specific IDs
    if (!process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL === 'http://localhost:8080') {
      console.warn("External API not configured, returning mock data for path:", params.id)
      
      // Return mock learning path details
      const mockPaths: Record<string, any> = {
        "data-analytics-beginner": {
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
            },
            {
              id: "advanced-sql",
              title: "Advanced SQL Techniques",
              description: "Learn complex queries, joins, and optimization",
              step_type: "lesson",
              order_index: 4,
              estimated_hours: 18,
              skills: ["Advanced SQL", "Query Optimization", "Complex Joins"],
              prerequisites: ["sql-basics"],
              is_required: false,
              order: 4,
              estimated_duration: "2 weeks",
              completed: false
            },
            {
              id: "python-intro",
              title: "Introduction to Python for Analytics",
              description: "Basic Python programming for data analysis",
              step_type: "lesson",
              order_index: 5,
              estimated_hours: 30,
              skills: ["Python", "Pandas", "Data Analysis"],
              prerequisites: ["data-viz"],
              is_required: false,
              order: 5,
              estimated_duration: "3 weeks",
              completed: false
            },
            {
              id: "statistics-fundamentals",
              title: "Statistics for Data Analysis",
              description: "Essential statistical concepts and methods",
              step_type: "lesson",
              order_index: 6,
              estimated_hours: 22,
              skills: ["Statistics", "Probability", "Hypothesis Testing"],
              prerequisites: [],
              is_required: true,
              order: 6,
              estimated_duration: "2 weeks",
              completed: false
            }
          ]
        }
      }
      
      const mockPath = mockPaths[params.id]
      if (mockPath) {
        return NextResponse.json(mockPath)
      } else {
        return NextResponse.json({ error: "Path not found" }, { status: 404 })
      }
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/learning-paths/${params.id}`, {
        headers: {
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
    console.error("Learning path details error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}