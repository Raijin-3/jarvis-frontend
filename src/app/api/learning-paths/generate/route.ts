import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Build the user learning path by reading assigned courses and expanding to subjects/modules/sections
async function buildLearningPath(sb: ReturnType<typeof supabaseServer>, userId: string) {
  // 1) Get assigned courses for user
  const { data: assignments, error: assignErr } = await sb
    .from("user_course_assignments")
    .select("course_id")
    .eq("user_id", userId);
  if (assignErr) throw new Error(`Failed to load assignments: ${assignErr.message}`);

  const courseIds = (assignments || []).map((a: any) => a.course_id);
  if (courseIds.length === 0) {
    // Fallback: build path from assessed modules in user_module_status
    const { data: statusRows, error: stErr } = await sb
      .from("user_module_status")
      .select("module_id, status, correctness_percentage, last_updated")
      .eq("user_id", userId);
    if (stErr) throw new Error(`Failed to load user module status: ${stErr.message}`);

    const statusModuleIds = (statusRows || []).map((r: any) => r.module_id);
    if (statusModuleIds.length === 0) {
      return {
        path: { courses: [] },
        required: true,
      };
    }

    // Load modules for these ids
    const { data: fbModules, error: fbModErr } = await sb
      .from("modules")
      .select("id, title, subject_id")
      .in("id", statusModuleIds);
    if (fbModErr) throw new Error(`Failed to load modules: ${fbModErr.message}`);

    const fbSubjectIds = (fbModules || []).map((m: any) => m.subject_id);

    const { data: fbSubjects, error: fbSubjErr } = await sb
      .from("subjects")
      .select("id, title, course_id")
      .in("id", fbSubjectIds.length ? fbSubjectIds : ["00000000-0000-0000-0000-000000000000"]);
    if (fbSubjErr) throw new Error(`Failed to load subjects: ${fbSubjErr.message}`);

    const fbCourseIds = Array.from(new Set((fbSubjects || []).map((s: any) => s.course_id)));

    const { data: fbCourses, error: fbCourseErr } = await sb
      .from("courses")
      .select("id, title, description")
      .in("id", fbCourseIds.length ? fbCourseIds : ["00000000-0000-0000-0000-000000000000"]);
    if (fbCourseErr) throw new Error(`Failed to load courses: ${fbCourseErr.message}`);

    const { data: fbSections, error: fbSecErr } = await sb
      .from("sections")
      .select("id, title, module_id")
      .in("module_id", statusModuleIds);
    if (fbSecErr) throw new Error(`Failed to load sections: ${fbSecErr.message}`);

    // Build structure with status enrichment
    const byCourse = new Map<string, any>();
    for (const c of fbCourses || []) {
      byCourse.set(c.id, {
        id: c.id,
        title: c.title,
        description: c.description || null,
        subjects: [],
      });
    }

    const bySubject: Record<string, any> = {};
    for (const s of fbSubjects || []) {
      const subj = {
        id: s.id,
        title: s.title,
        course_id: s.course_id,
        modules: [],
      };
      bySubject[s.id] = subj;
      const course = byCourse.get(s.course_id);
      if (course) course.subjects.push(subj);
    }

    const statusByModule = new Map((statusRows || []).map((r: any) => [r.module_id, r]));
    const byModule: Record<string, any> = {};
    for (const m of fbModules || []) {
      const st: any = statusByModule.get(m.id);
      const mod = {
        id: m.id,
        title: m.title,
        subject_id: m.subject_id,
        sections: [],
        status: st?.status ?? null,
        correctness_percentage: st?.correctness_percentage ?? 0,
        last_updated: st?.last_updated ?? null,
      };
      byModule[m.id] = mod;
      const subj = bySubject[m.subject_id];
      if (subj) subj.modules.push(mod);
    }

    for (const sec of fbSections || []) {
      const s = {
        id: sec.id,
        title: sec.title,
        module_id: sec.module_id,
      };
      const mod = byModule[sec.module_id];
      if (mod) mod.sections.push(s);
    }

    const path = {
      path: {
        courses: Array.from(byCourse.values()),
      },
    };

    return { path, required: true };
  }

  // 2) Load courses with subjects -> modules -> sections
  const { data: courses, error: courseErr } = await sb
    .from("courses")
    .select("id, title, description")
    .in("id", courseIds);
  if (courseErr) throw new Error(`Failed to load courses: ${courseErr.message}`);

  const { data: subjects, error: subjErr } = await sb
    .from("subjects")
    .select("id, title, course_id")
    .in("course_id", courseIds);
  if (subjErr) throw new Error(`Failed to load subjects: ${subjErr.message}`);

  const subjectIds = (subjects || []).map((s: any) => s.id);

  const { data: modules, error: modErr } = await sb
    .from("modules")
    .select("id, title, subject_id")
    .in("subject_id", subjectIds.length ? subjectIds : ["00000000-0000-0000-0000-000000000000"]); // guard if none
  if (modErr) throw new Error(`Failed to load modules: ${modErr.message}`);

  const moduleIds = (modules || []).map((m: any) => m.id);

  const { data: sections, error: secErr } = await sb
    .from("sections")
    .select("id, title, module_id")
    .in("module_id", moduleIds.length ? moduleIds : ["00000000-0000-0000-0000-000000000000"]);
  if (secErr) throw new Error(`Failed to load sections: ${secErr.message}`);

  // 3) Shape JSON exactly as requested
  const byCourse = new Map<string, any>();
  for (const c of courses || []) {
    byCourse.set(c.id, {
      id: c.id,
      title: c.title,
      description: c.description || null,
      subjects: [],
    });
  }

  const bySubject: Record<string, any> = {};
  for (const s of subjects || []) {
    const subj = {
      id: s.id,
      title: s.title,
      course_id: s.course_id,
      modules: [],
    };
    bySubject[s.id] = subj;
    const course = byCourse.get(s.course_id);
    if (course) course.subjects.push(subj);
  }

  // Load module status for these modules to enrich path
  const { data: statusRows2, error: stErr2 } = await sb
    .from("user_module_status")
    .select("module_id, status, correctness_percentage, last_updated")
    .eq("user_id", userId)
    .in("module_id", moduleIds.length ? moduleIds : ["00000000-0000-0000-0000-000000000000"]);
  if (stErr2) throw new Error(`Failed to load user module status: ${stErr2.message}`);
  const statusByModule2 = new Map((statusRows2 || []).map((r: any) => [r.module_id, r]));

  const byModule: Record<string, any> = {};
  for (const m of modules || []) {
    const st: any = statusByModule2.get(m.id);
    const mod = {
      id: m.id,
      title: m.title,
      subject_id: m.subject_id,
      sections: [],
      status: st?.status ?? null,
      correctness_percentage: st?.correctness_percentage ?? 0,
      last_updated: st?.last_updated ?? null,
    };
    byModule[m.id] = mod;
    const subj = bySubject[m.subject_id];
    if (subj) subj.modules.push(mod);
  }

  for (const sec of sections || []) {
    const s = {
      id: sec.id,
      title: sec.title,
      module_id: sec.module_id,
    };
    const mod = byModule[sec.module_id];
    if (mod) mod.sections.push(s);
  }

  const path = {
    path: {
      courses: Array.from(byCourse.values()),
    },
  };

  return { path, required: true };
}

export async function POST(request: NextRequest) {
  try {
    const sb = supabaseServer();

    const { data: { user }, error: authError } = await sb.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const refresh = request.nextUrl.searchParams.get('refresh') === 'true';

    // Check if already exists (one-time generation unless refresh requested)
    const { data: existing, error: readErr } = await sb
      .from("user_learning_path")
      .select("id, path, required")
      .eq("user_id", user.id)
      .maybeSingle();

    if (readErr) {
      return NextResponse.json({ error: readErr.message }, { status: 500 });
    }

    if (existing && !refresh) {
      return NextResponse.json(existing, { status: 200 });
    }

    const built = await buildLearningPath(sb, user.id);

    if (existing && refresh) {
      // Update existing row with fresh path
      const { data: updated, error: updErr } = await sb
        .from("user_learning_path")
        .update({ path: built.path, required: true })
        .eq("id", existing.id)
        .select("id, path, required")
        .single();
      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }
      return NextResponse.json(updated, { status: 200 });
    }

    const { data: inserted, error: insertErr } = await sb
      .from("user_learning_path")
      .insert({ user_id: user.id, path: built.path, required: true })
      .select("id, path, required")
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json(inserted, { status: 201 });
  } catch (e: any) {
    console.error("Generate learning path error:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}