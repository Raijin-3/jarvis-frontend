import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const supabase = supabaseServer();
    const { courseId } = await params;

    // For now, return mock analytics data
    // In a real implementation, this would fetch actual analytics from the database
    const mockAnalytics = {
      completionRate: Math.floor(Math.random() * 40) + 60, // 60-100%
      averageRating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
      recentActivity: [
        {
          action: "Student enrolled",
          user: "Alice Johnson",
          timestamp: new Date().toISOString(),
        },
        {
          action: "Quiz completed",
          user: "Bob Wilson",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          action: "Section viewed",
          user: "Carol Brown",
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        },
        {
          action: "Module completed",
          user: "David Chen",
          timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        }
      ],
      engagementMetrics: {
        totalViews: Math.floor(Math.random() * 500) + 100,
        averageTimeSpent: Math.floor(Math.random() * 30) + 15, // minutes
        dropoffRate: Math.floor(Math.random() * 20) + 5 // percentage
      }
    };

    return NextResponse.json(mockAnalytics);
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
