import { NextResponse } from "next/server";
import { apiPost } from "@/lib/api";
import { recordAssessmentCompletion, getCurrentUserId } from "@/lib/gamification";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = await apiPost("/v1/assessments/finish", body);
    
    // Record gamification activity after successful assessment completion
    if (data && body) {
      const userId = getCurrentUserId() || body.userId || 'anonymous';
      const assessmentId = body.assessmentId || body.id || 'unknown';
      
      // Extract results from the response or body
      const result = {
        score: body.score || data.score || 0,
        maxScore: body.maxScore || data.maxScore || 100,
        timeSpent: body.timeSpent || data.timeSpent || 0,
        completed: true
      };
      
      // Record asynchronously to not block the response
      recordAssessmentCompletion(userId, assessmentId, result).catch(error => {
        console.error('Gamification tracking failed:', error);
      });
    }
    
    return NextResponse.json(data ?? { ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to submit" }, { status: 500 });
  }
}
