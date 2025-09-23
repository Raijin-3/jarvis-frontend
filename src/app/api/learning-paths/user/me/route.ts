import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const sb = supabaseServer();
    const { data: { user }, error: authError } = await sb.auth.getUser();

    if (authError || !user) {
      console.log("Unauthorized user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query user_course_assignment to get the courses assigned to the user
    const { data: userCourses, error: courseError } = await sb
      .from('user_course_assignments')
      .select('course_id')
      .eq('user_id', user.id);

    if (courseError) {
      console.log("Error fetching user courses:", courseError.message);
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }

    if (!userCourses || userCourses.length === 0) {
      return NextResponse.json({ error: "No courses assigned to the user" }, { status: 404 });
    }

    // Fetch the courses, subjects, modules, and user module statuses
    const courseIds = userCourses.map(course => course.course_id);

    // Step 1: Fetch courses
    const { data: courses, error: coursesError } = await sb
      .from('courses')
      .select('id, title')
      .in('id', courseIds);

    if (coursesError) {
      console.log("Error fetching courses:", coursesError.message);
      return NextResponse.json({ error: coursesError.message }, { status: 500 });
    }

    // Step 2: Fetch subjects for each course
    const { data: subjects, error: subjectsError } = await sb
      .from('subjects')
      .select('id, title, course_id')
      .in('course_id', courseIds);

    if (subjectsError) {
      console.log("Error fetching subjects:", subjectsError.message);
      return NextResponse.json({ error: subjectsError.message }, { status: 500 });
    }

    // Step 3: Fetch modules for each subject
    const subjectIds = subjects.map(subject => subject.id);
    const { data: modules, error: modulesError } = await sb
      .from('modules')
      .select('id, title, subject_id')
      .in('subject_id', subjectIds);

    if (modulesError) {
      console.log("Error fetching modules:", modulesError.message);
      return NextResponse.json({ error: modulesError.message }, { status: 500 });
    }

    // Step 4: Fetch user module statuses
    const moduleIds = modules.map(module => module.id);
    const { data: userModuleStatuses, error: statusError } = await sb
      .from('user_module_status')
      .select('module_id, status')
      .eq('user_id', user.id)
      .in('module_id', moduleIds);

    if (statusError) {
      console.log("Error fetching module statuses:", statusError.message);
      return NextResponse.json({ error: statusError.message }, { status: 500 });
    }

    // Step 5: Format the response
    const response = courses.map(course => {
      const courseSubjects = subjects.filter(subject => subject.course_id === course.id);
      const courseSubjectsWithModules = courseSubjects.map(subject => {
        const subjectModules = modules.filter(module => module.subject_id === subject.id);
        const subjectModulesWithStatus = subjectModules.map(module => {
          const userStatus = userModuleStatuses.find(status => status.module_id === module.id);
          return {
            title: module.title,
            status: userStatus ? userStatus.status : "mandatory"
          };
        });

        return {
          title: subject.title,
          modules: subjectModulesWithStatus
        };
      });

      return {
        title: course.title,
        subjects: courseSubjectsWithModules
      };
    });

    return NextResponse.json(response, { status: 200 });

  } catch (e: any) {
    console.error("Get user learning path error:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
