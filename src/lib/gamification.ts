// Client-side helpers use Next Route Handlers under /api/gamification
// to securely talk to the backend with SSR token forwarding.

export interface ActivityData {
  userId: string;
  activityType: string;
  referenceId?: string;
  referenceType?: string;
  durationMinutes?: number;
}

export interface AssessmentResult {
  score: number;
  maxScore: number;
  timeSpent: number;
  completed: boolean;
}

/**
 * Records a user activity and triggers gamification events
 */
export async function recordActivity(data: ActivityData): Promise<void> {
  try {
    await fetch('/api/gamification/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: data.userId,
        activityType: data.activityType,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        durationMinutes: data.durationMinutes,
      }),
    });
  } catch (error) {
    console.error('Failed to record activity:', error);
    // Don't throw - gamification should not break the main flow
  }
}

/**
 * Records assessment completion with appropriate gamification rewards
 */
export async function recordAssessmentCompletion(
  userId: string,
  assessmentId: string,
  result: AssessmentResult
): Promise<void> {
  try {
    // Record quiz completion activity
    await recordActivity({
      userId,
      activityType: 'quiz_completed',
      referenceId: assessmentId,
      referenceType: 'assessment',
      durationMinutes: Math.ceil(result.timeSpent / 60)
    });

    // Award perfect score bonus if applicable
    if (result.completed && result.score === result.maxScore) {
      await recordActivity({
        userId,
        activityType: 'perfect_score',
        referenceId: assessmentId,
        referenceType: 'assessment'
      });
    }
  } catch (error) {
    console.error('Failed to record assessment completion:', error);
  }
}

/**
 * Records course or section progress
 */
export async function recordCourseProgress(
  userId: string,
  courseId: string,
  sectionId: string,
  progressType: 'started' | 'section_completed' | 'completed',
  durationMinutes?: number
): Promise<void> {
  try {
    const activityMap = {
      'started': 'course_started',
      'section_completed': 'section_completed', 
      'completed': 'course_completed'
    };

    await recordActivity({
      userId,
      activityType: activityMap[progressType],
      referenceId: progressType === 'section_completed' ? sectionId : courseId,
      referenceType: progressType === 'section_completed' ? 'section' : 'course',
      durationMinutes
    });
  } catch (error) {
    console.error('Failed to record course progress:', error);
  }
}

/**
 * Records lecture or content viewing
 */
export async function recordContentViewing(
  userId: string,
  contentId: string,
  contentType: 'lecture' | 'practice' | 'reading',
  durationMinutes: number
): Promise<void> {
  try {
    await recordActivity({
      userId,
      activityType: 'lecture_viewed',
      referenceId: contentId,
      referenceType: contentType,
      durationMinutes
    });
  } catch (error) {
    console.error('Failed to record content viewing:', error);
  }
}

/**
 * Records login activity for streak tracking
 */
export async function recordLogin(userId: string): Promise<void> {
  try {
    await recordActivity({
      userId,
      activityType: 'login'
    });
  } catch (error) {
    console.error('Failed to record login:', error);
  }
}

/**
 * Triggers gamification calculation for dynamic challenges based on user behavior
 */
export async function triggerChallengeUpdate(userId: string): Promise<void> {
  try {
    // Use a dedicated Next route that calls the backend refresh endpoint
    await fetch('/api/gamification/challenges/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  } catch (error) {
    console.error('Failed to trigger challenge update:', error);
  }
}

/**
 * Client-side helper to extract user ID from session/auth
 */
export function getCurrentUserId(): string | null {
  // This would typically extract from your auth system
  // For now, return a test user ID
  if (typeof window !== 'undefined') {
    return localStorage.getItem('currentUserId') || 'test-user-123';
  }
  return null;
}

/**
 * Initialize gamification tracking for a session
 */
export async function initializeGamificationSession(): Promise<void> {
  const userId = getCurrentUserId();
  if (userId) {
    await recordLogin(userId);
    await triggerChallengeUpdate(userId);
  }
}
