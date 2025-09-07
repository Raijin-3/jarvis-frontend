import { redirect } from "next/navigation";
import { apiGet } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase-server";
import { Sidebar } from "../../../../../dashboard/sidebar";
import { MobileSidebar } from "../../../../../dashboard/mobile-sidebar";

type Track = any;

export const metadata = { title: "Quiz | Curriculum" };

export default async function QuizPage({ params }: { params: Promise<{ courseId: string; subjectId: string; sectionId: string }> }) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const { courseId, subjectId, sectionId } = await params;
  const track: Track = await apiGet(`/v1/curriculum/${courseId}`).catch(() => null as any);
  const modules = Array.isArray(track?.modules) ? track.modules : [];
  const subjectModules = modules.filter((m: any) => m.subjectId === subjectId);
  const section = modules.flatMap((m: any) => m.sections || []).find((s: any) => s.id === sectionId);
  if (!section) redirect(`/curriculum/${courseId}/${subjectId}`);

  const quiz = Array.isArray(section.quizzes) ? section.quizzes[0] : null;

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6">
      <MobileSidebar active="/curriculum" />
      <div className="lg:flex lg:gap-4">
        <Sidebar active="/curriculum" />
        <main className="flex-1 rounded-xl border border-border bg-white/70 p-4 backdrop-blur">
          <h1 className="text-xl font-semibold">{section.title} • Quiz</h1>
          <p className="mt-1 text-sm text-muted-foreground">{quiz?.title || 'Quiz'}{quiz?.questions ? ` • ${quiz.questions} questions` : ''}</p>

          <div className="mt-4 rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
            <div className="text-sm text-muted-foreground">Quiz player coming soon. This page is prepared to render quiz questions from the backend CRUD you added.</div>
          </div>
        </main>
      </div>
    </div>
  );
}
