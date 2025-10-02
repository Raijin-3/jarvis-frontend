import { redirect } from "next/navigation";
import { apiGet } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase-server";
import { Sidebar } from "../../../../../dashboard/sidebar";
import { MobileSidebar } from "../../../../../dashboard/mobile-sidebar";
import { QuizRunner } from "@/components/quiz-runner";

type Track = any;

export const metadata = { title: "Quiz | Curriculum" };

export default async function QuizPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ courseId: string; subjectId: string; sectionId: string }>; 
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  
  const { courseId, subjectId, sectionId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const quizIdParam = resolvedSearchParams?.quizId;
  const quizId = Array.isArray(quizIdParam) ? quizIdParam[0] : quizIdParam;
  
  const track: Track = await apiGet(`/v1/curriculum/${courseId}`).catch(() => null as any);
  const modules = Array.isArray(track?.modules) ? track.modules : [];
  const section = modules.flatMap((m: any) => m.sections || []).find((s: any) => s.id === sectionId);
  if (!section) redirect(`/curriculum/${courseId}/${subjectId}`);

  // Fetch quiz data from API
  let quiz = null;
  if (quizId) {
    try {
      quiz = await apiGet(`/v1/quizzes/${quizId}`);
    } catch (error) {
      console.error('Failed to load quiz:', error);
    }
  }
  
  // Fallback to section quizzes if no quizId provided
  if (!quiz) {
    quiz = Array.isArray(section.quizzes) ? section.quizzes[0] : null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <MobileSidebar active="/curriculum" />
      <div className="lg:flex lg:gap-6 max-w-screen-2xl mx-auto p-4 md:p-6">
        <Sidebar active="/curriculum" />
        <main className="flex-1">
          {quiz ? (
            <QuizRunner 
              quiz={quiz}
              sectionTitle={section.title}
              courseId={courseId}
              subjectId={subjectId}
              sectionId={sectionId}
            />
          ) : (
            <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg p-6">
              <h1 className="text-xl font-semibold">{section.title} • Quiz</h1>
              <p className="mt-4 text-sm text-gray-600">No quiz available for this section yet. Please generate a quiz first.</p>
              <a 
                href={`/curriculum/${courseId}/${subjectId}`}
                className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Back to Course
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
