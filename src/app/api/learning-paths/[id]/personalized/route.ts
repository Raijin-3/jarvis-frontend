import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Helper function to create a simple hash from user ID for consistent personalization
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Generate user-specific personalization based on hash
function getUserPersonalization(hash: number, pathId: string) {
  const variants = [
    {
      title: "Data Analytics Fundamentals",
      description: "Master essential analytics skills with SQL, Excel, and Python. Tailored for beginners with practical projects.",
      careerGoal: "data_analyst",
      difficultyLevel: "beginner",
      estimatedWeeks: 8,
      icon: "📊",
      color: "#4f46e5",
      stepTitle: "Foundational Analytics Journey",
      estimatedHours: 120,
      skills: ["SQL", "Excel", "Python", "Statistics", "Data Visualization"],
      courseTitle: "Data Analytics Foundations",
      subjects: [
        {
          id: "subject-data-manipulation",
          title: "Data Manipulation & SQL",
          course_id: "course-data-analytics-fundamentals",
          order_index: 1,
          modules: [
            {
              id: "module-sql-basics",
              title: "SQL Fundamentals",
              subject_id: "subject-data-manipulation",
              order_index: 1,
              is_mandatory: true,
              assessment_score: 85
            },
            {
              id: "module-advanced-sql",
              title: "Advanced SQL Queries",
              subject_id: "subject-data-manipulation",
              order_index: 2,
              is_mandatory: false,
              assessment_score: 75
            }
          ]
        },
        {
          id: "subject-data-analysis",
          title: "Data Analysis Tools",
          course_id: "course-data-analytics-fundamentals",
          order_index: 2,
          modules: [
            {
              id: "module-excel-analysis",
              title: "Excel Data Analysis",
              subject_id: "subject-data-analysis",
              order_index: 1,
              is_mandatory: true,
              assessment_score: null
            }
          ]
        }
      ]
    },
    {
      title: "Advanced Business Intelligence",
      description: "Deep dive into BI tools, dashboard creation, and strategic analytics. Perfect for intermediate learners.",
      careerGoal: "business_analyst",
      difficultyLevel: "intermediate",
      estimatedWeeks: 12,
      icon: "📈",
      color: "#059669",
      stepTitle: "Advanced BI Mastery Path",
      estimatedHours: 180,
      skills: ["Business Intelligence", "Tableau", "Power BI", "Strategic Analysis", "KPIs"],
      courseTitle: "Business Intelligence Excellence",
      subjects: [
        {
          id: "subject-bi-tools",
          title: "BI Tools & Dashboards",
          course_id: "course-data-analytics-fundamentals",
          order_index: 1,
          modules: [
            {
              id: "module-tableau-basics",
              title: "Tableau Fundamentals",
              subject_id: "subject-bi-tools",
              order_index: 1,
              is_mandatory: true,
              assessment_score: 92
            },
            {
              id: "module-powerbi-advanced",
              title: "Advanced Power BI",
              subject_id: "subject-bi-tools",
              order_index: 2,
              is_mandatory: false,
              assessment_score: 88
            }
          ]
        },
        {
          id: "subject-strategic-analysis",
          title: "Strategic Business Analysis",
          course_id: "course-data-analytics-fundamentals",
          order_index: 2,
          modules: [
            {
              id: "module-kpi-design",
              title: "KPI Design & Analysis",
              subject_id: "subject-strategic-analysis",
              order_index: 1,
              is_mandatory: true,
              assessment_score: null
            }
          ]
        }
      ]
    },
    {
      title: "Data Science Pipeline",
      description: "Complete data science workflow from collection to machine learning. Designed for aspiring data scientists.",
      careerGoal: "data_scientist",
      difficultyLevel: "advanced",
      estimatedWeeks: 16,
      icon: "🤖",
      color: "#dc2626",
      stepTitle: "Data Science Excellence Track",
      estimatedHours: 240,
      skills: ["Python", "Machine Learning", "Statistical Analysis", "Data Modeling", "AI"],
      courseTitle: "Data Science Pipeline Mastery",
      subjects: [
        {
          id: "subject-ml-fundamentals",
          title: "Machine Learning Foundations",
          course_id: "course-data-analytics-fundamentals",
          order_index: 1,
          modules: [
            {
              id: "module-python-ml",
              title: "Python for Machine Learning",
              subject_id: "subject-ml-fundamentals",
              order_index: 1,
              is_mandatory: true,
              assessment_score: 78
            },
            {
              id: "module-deep-learning",
              title: "Deep Learning Basics",
              subject_id: "subject-ml-fundamentals",
              order_index: 2,
              is_mandatory: false,
              assessment_score: 82
            }
          ]
        },
        {
          id: "subject-data-modeling",
          title: "Advanced Data Modeling",
          course_id: "course-data-analytics-fundamentals",
          order_index: 2,
          modules: [
            {
              id: "module-statistical-modeling",
              title: "Statistical Modeling",
              subject_id: "subject-data-modeling",
              order_index: 1,
              is_mandatory: true,
              assessment_score: null
            }
          ]
        }
      ]
    }
  ];
  
  // Select variant based on hash
  const variantIndex = hash % variants.length;
  return variants[variantIndex];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const pathId = resolvedParams.id;

    // Allow dev override via explicit test token
    const authHeader = request.headers.get("authorization");
    const headerToken = authHeader?.replace("Bearer ", "");

    let userId: string | null = null;
    let token: string | null = null;

    if (headerToken === "test-token") {
      token = headerToken;
      userId = "test-user-id";
    } else {
      const sb = supabaseServer();
      const { data: { user }, error: authError } = await sb.auth.getUser();
      if (authError) {
        console.error("Auth error:", authError);
        return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
      }
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;

      // Try to get token from session
      const { data: { session }, error: sessionError } = await sb.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        return NextResponse.json({ error: "Session invalid" }, { status: 401 });
      }
      token = request.headers.get("authorization")?.replace("Bearer ", "") || session?.access_token || null;
      if (!token) {
        console.error("No token available");
        return NextResponse.json({ error: "No authentication token" }, { status: 401 });
      }
    }

    // If external API isn't configured, return a mock personalized path
    if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
      console.warn("External API not configured, returning mock personalized path for:", pathId, "userId:", userId);

      const uid = userId;
      
      // Generate user-specific personalization based on userId hash
      const userHash = hashUserId(uid || 'default');
      const personalizations = getUserPersonalization(userHash, pathId);
      
      const mockUserPath = {
        id: `user-${uid}-${pathId}`,
        title: `${personalizations.title} (Personal)`,
        description: personalizations.description,
        career_goal: personalizations.careerGoal,
        difficulty_level: personalizations.difficultyLevel,
        estimated_duration_weeks: personalizations.estimatedWeeks,
        icon: personalizations.icon,
        color: personalizations.color,
        is_active: true,
        steps: [
          {
            id: `data-analytics-step-1-${uid}`,
            title: personalizations.stepTitle,
            description: "Complete learning path with personalized course structure based on your assessment results",
            step_type: "course_structure",
            order_index: 1,
            estimated_hours: personalizations.estimatedHours,
            skills: personalizations.skills,
            prerequisites: [],
            is_required: true,
            resources: {
              course_structure: {
                courses: [
                  {
                    id: "course-data-analytics-fundamentals",
                    title: personalizations.courseTitle,
                    description: "Core data analytics skills and concepts tailored to your needs",
                    subjects: personalizations.subjects
                  }
                ]
              }
            }
          }
        ]
      };
      return NextResponse.json(mockUserPath);
    }

    // Forward to backend API
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/learning-paths/${pathId}/personalized`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("External API error:", response.status, error);
        return NextResponse.json({ error }, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError: any) {
      console.error("Failed to connect to external API:", fetchError.message);
      return NextResponse.json({ error: "External API unavailable" }, { status: 503 });
    }
  } catch (error: any) {
    console.error("Personalized learning path error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}