import { NextResponse } from "next/server";
import { apiPost, apiGet } from "@/lib/api";

interface AssessmentTemplate {
  id: string;
  title: string;
  category_id: string;
  // ... other properties
  student_info?: {
    total_attempts: number;
    can_retake: boolean;
    // ... other student info
  };
}

export async function POST() {
  try {
    // First, get available assessments for the user
    const availableAssessments = await apiGet<AssessmentTemplate[]>("/v1/student/assessments/available");

    if (!availableAssessments || !Array.isArray(availableAssessments) || availableAssessments.length === 0) {
      return NextResponse.json({ error: "No assessments available" }, { status: 404 });
    }

    // Use the first available template
    const firstTemplate = availableAssessments[0];
    const templateId = firstTemplate.id;

    // Start the assessment with the selected template
    const data = await apiPost("/v1/student/assessments/start", { template_id: templateId });
    return NextResponse.json(data);
  } catch (e: any) {
    console.error("Assessment start error:", e);
    return NextResponse.json({ error: e?.message || "Failed to start assessment" }, { status: 500 });
  }
}
