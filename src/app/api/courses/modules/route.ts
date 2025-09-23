import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// Helper to extract modules from admin /v1/courses response
function extractModulesFromCourses(courses: any[]): any[] {
  const allModules: any[] = [];
  if (Array.isArray(courses)) {
    courses.forEach((course: any) => {
      const courseTitle = course.title || '';
      const courseId = course.id || '';
      if (course.subjects && Array.isArray(course.subjects)) {
        course.subjects.forEach((subject: any) => {
          const subjectTitle = subject.title || '';
          const subjectId = subject.id || '';
          if (subject.modules && Array.isArray(subject.modules)) {
            subject.modules.forEach((module: any) => {
              allModules.push({
                id: module.id,
                title: module.title,
                subject_id: subjectId,
                subject_title: subjectTitle,
                course_id: courseId,
                course_title: courseTitle,
                order_index: module.order_index || 0,
                created_at: module.created_at || new Date().toISOString(),
                updated_at: module.updated_at || new Date().toISOString(),
              });
            });
          }
        });
      }
    });
  }
  return allModules;
}

// Helper to extract modules using student-accessible curriculum endpoints
async function extractModulesFromCurriculum(backendUrl: string, token: string): Promise<any[]> {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  } as const;

  const curriculumRes = await fetch(`${backendUrl}/v1/curriculum`, { headers });
  if (!curriculumRes.ok) {
    // If curriculum also fails (e.g., auth), surface the error
    const text = await curriculumRes.text().catch(() => '');
    throw new Error(`Curriculum fetch failed: ${curriculumRes.status} ${text}`);
  }

  const curriculum = await curriculumRes.json();
  const tracks: any[] = Array.isArray(curriculum?.tracks) ? curriculum.tracks : [];

  const allModules: any[] = [];

  // Fetch details for each track to get subjects/modules
  // Do sequentially to avoid overwhelming backend; can be parallelized if needed
  for (const track of tracks) {
    const courseId = track?.slug;
    const courseTitle = track?.title;
    if (!courseId) continue;

    const detailsRes = await fetch(`${backendUrl}/v1/curriculum/${encodeURIComponent(courseId)}`, { headers });
    if (!detailsRes.ok) {
      continue; // Skip failing course
    }
    const details = await detailsRes.json();

    const subjects: any[] = Array.isArray(details?.subjects) ? details.subjects : [];

    // subjects[i].modules contains [{id,title}] — enough for listing
    subjects.forEach((subject) => {
      const subjectId = subject?.id;
      const subjectTitle = subject?.title;
      const mods: any[] = Array.isArray(subject?.modules) ? subject.modules : [];
      mods.forEach((m) => {
        allModules.push({
          id: m.id,
          title: m.title,
          subject_id: subjectId,
          subject_title: subjectTitle,
          course_id: details?.slug,
          course_title: details?.title ?? courseTitle,
          order_index: typeof m.order_index === 'number' ? m.order_index : 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    });
  }

  return allModules;
}

export async function GET(request: NextRequest) {
  try {
    const sb = supabaseServer();
    const { data: { user }, error: authError } = await sb.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    const { data: { session }, error: sessionError } = await sb.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Session invalid' }, { status: 401 });
    }

    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || session?.access_token;
    if (!token) {
      console.error('No token available');
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

    // 1) Try admin courses endpoint (rich structure)
    const coursesRes = await fetch(`${backendUrl}/v1/courses`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (coursesRes.ok) {
      const courses = await coursesRes.json();
      const allModules = extractModulesFromCourses(courses);
      return NextResponse.json(allModules);
    }

    // If admin endpoint is forbidden/unauthorized, fallback to curriculum endpoints for students
    if (coursesRes.status === 401 || coursesRes.status === 403 || coursesRes.status === 404) {
      try {
        const allModules = await extractModulesFromCurriculum(backendUrl, token);
        return NextResponse.json(allModules);
      } catch (e) {
        console.error('Curriculum fallback failed:', e);
        return NextResponse.json([], { status: 200 }); // Graceful empty list
      }
    }

    // Other errors — surface as failure
    const text = await coursesRes.text().catch(() => '');
    console.error('Backend /v1/courses error:', coursesRes.status, text);
    return NextResponse.json({ error: 'Failed to fetch modules' }, { status: coursesRes.status });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}