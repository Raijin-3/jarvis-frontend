import { redirect } from "next/navigation";
import { apiGet } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase-server";
import { Sidebar } from "../../../dashboard/sidebar";
import { MobileSidebar } from "../../../dashboard/mobile-sidebar";
import { SubjectLearningInterface } from "@/components/subject-learning-interface";

type Track = any;

export const metadata = { title: "Subject | Curriculum" };

export default async function SubjectPage({ params }: { params: Promise<{ courseId: string; subjectId: string }> }) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');

  const { courseId, subjectId } = await params;
  const track: Track = await apiGet(`/v1/curriculum/${courseId}`).catch(() => null as any);
  const modules = Array.isArray(track?.modules) ? track.modules : [];
  const subject = Array.isArray(track?.subjects) ? track.subjects.find((s: any) => s.id === subjectId) : null;
  const subjectModules = modules.filter((m: any) => m.subjectId === subjectId);
  const allSections = subjectModules.flatMap((m: any) => m.sections || []);
  const completedSections = Math.floor(allSections.length * 0.6); // Mock completion data

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <MobileSidebar active="/curriculum" />
      <div className="lg:flex lg:gap-6 max-w-screen-2xl mx-auto p-4 md:p-6">
        <Sidebar active="/curriculum" />

        <div className="flex-1">
          <SubjectLearningInterface
            trackTitle={track?.title || "Course"}
            subjectTitle={subject?.title}
            subjectModules={subjectModules as any}
            completedSections={completedSections}
            totalSections={allSections.length}
            courseId={courseId}
            subjectId={subjectId}
          />
        </div>
      </div>
    </div>
  );
}