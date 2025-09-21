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

    // Check if external API is available
    if (!process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL === 'http://localhost:8080') {
      console.warn("External API not configured, returning enhanced mock data for path:", params.id)
      
      // Return mock learning path with course structure
      const mockPathWithCourses = {
        "id": "data-analytics-beginner",
        "title": "Data Analytics Fundamentals",
        "description": "Start your analytics journey with essential skills in SQL, Excel, and data visualization.",
        "difficulty_level": "beginner",
        "career_goal": "data_analyst",
        "estimated_duration_weeks": 8,
        "color": "#4f46e5",
        "icon": "dys",
        "is_active": true,
        "steps": [
          {
            "id": "data-analytics-step-1",
            "title": "Data Analytics Learning Journey",
            "description": "Complete learning path with personalized course structure",
            "step_type": "course_structure",
            "order_index": 1,
            "estimated_hours": 120,
            "skills": ["SQL", "Excel", "Python", "Statistics", "Data Visualization"],
            "prerequisites": [],
            "is_required": true,
            "course_structure": {
              "courses": [
                {
                  "id": "course-data-analytics-fundamentals",
                  "title": "Data Analytics Fundamentals",
                  "description": "Core data analytics skills and concepts",
                  "subjects": [
                    {
                      "id": "subject-data-manipulation",
                      "title": "Data Manipulation",
                      "course_id": "course-data-analytics-fundamentals",
                      "order_index": 1,
                      "modules": [
                        {
                          "id": "module-sql-basics",
                          "title": "SQL Basics",
                          "subject_id": "subject-data-manipulation",
                          "order_index": 1,
                          "is_mandatory": true,
                          "assessment_based": false,
                          "sections": [
                            {
                              "id": "section-sql-intro",
                              "title": "Introduction to SQL",
                              "module_id": "module-sql-basics",
                              "order_index": 1
                            },
                            {
                              "id": "section-sql-queries",
                              "title": "Basic SQL Queries",
                              "module_id": "module-sql-basics",
                              "order_index": 2
                            }
                          ]
                        },
                        {
                          "id": "module-advanced-sql",
                          "title": "Advanced SQL",
                          "subject_id": "subject-data-manipulation", 
                          "order_index": 2,
                          "is_mandatory": false,
                          "assessment_based": true,
                          "sections": [
                            {
                              "id": "section-joins",
                              "title": "SQL Joins",
                              "module_id": "module-advanced-sql",
                              "order_index": 1
                            },
                            {
                              "id": "section-optimization",
                              "title": "Query Optimization",
                              "module_id": "module-advanced-sql", 
                              "order_index": 2
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "id": "subject-data-analysis",
                      "title": "Data Analysis",
                      "course_id": "course-data-analytics-fundamentals",
                      "order_index": 2,
                      "modules": [
                        {
                          "id": "module-excel-analysis",
                          "title": "Excel for Data Analysis",
                          "subject_id": "subject-data-analysis",
                          "order_index": 1,
                          "is_mandatory": true,
                          "assessment_based": false,
                          "sections": [
                            {
                              "id": "section-excel-basics",
                              "title": "Excel Fundamentals",
                              "module_id": "module-excel-analysis",
                              "order_index": 1
                            },
                            {
                              "id": "section-pivot-tables",
                              "title": "Pivot Tables and Charts",
                              "module_id": "module-excel-analysis",
                              "order_index": 2
                            }
                          ]
                        },
                        {
                          "id": "module-python-analysis",
                          "title": "Python for Data Analysis",
                          "subject_id": "subject-data-analysis",
                          "order_index": 2,
                          "is_mandatory": false,
                          "assessment_based": true,
                          "sections": [
                            {
                              "id": "section-python-basics",
                              "title": "Python Fundamentals",
                              "module_id": "module-python-analysis",
                              "order_index": 1
                            },
                            {
                              "id": "section-pandas",
                              "title": "Pandas Library",
                              "module_id": "module-python-analysis",
                              "order_index": 2
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "id": "subject-data-visualization",
                      "title": "Data Visualization",
                      "course_id": "course-data-analytics-fundamentals",
                      "order_index": 3,
                      "modules": [
                        {
                          "id": "module-visualization-principles",
                          "title": "Visualization Principles",
                          "subject_id": "subject-data-visualization",
                          "order_index": 1,
                          "is_mandatory": true,
                          "assessment_based": false,
                          "sections": [
                            {
                              "id": "section-chart-types",
                              "title": "Chart Types and Selection",
                              "module_id": "module-visualization-principles",
                              "order_index": 1
                            },
                            {
                              "id": "section-design-principles",
                              "title": "Design Principles",
                              "module_id": "module-visualization-principles",
                              "order_index": 2
                            }
                          ]
                        },
                        {
                          "id": "module-advanced-visualization",
                          "title": "Advanced Visualization Techniques",
                          "subject_id": "subject-data-visualization",
                          "order_index": 2,
                          "is_mandatory": false,
                          "assessment_based": true,
                          "sections": [
                            {
                              "id": "section-interactive-charts",
                              "title": "Interactive Charts",
                              "module_id": "module-advanced-visualization",
                              "order_index": 1
                            },
                            {
                              "id": "section-dashboards",
                              "title": "Dashboard Creation",
                              "module_id": "module-advanced-visualization",
                              "order_index": 2
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
      
      return NextResponse.json(mockPathWithCourses)
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/learning-paths/${params.id}/with-courses`, {
        headers: {
          "Authorization": `Bearer ${token}`,
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
    console.error("Learning path with courses error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
