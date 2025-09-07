import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { apiGet } from "@/lib/api";
import { Sidebar } from "../../dashboard/sidebar";
import { MobileSidebar } from "../../dashboard/mobile-sidebar";
import { ProfessionalCourseOverview } from "@/components/professional-course-overview";

type Track = any;

export const metadata = { title: "Course | Curriculum" };

export default async function CourseDetailsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');

  const { courseId } = await params;
  const track: Track = await apiGet(`/v1/curriculum/${courseId}`).catch(() => null as any);

  const modules = Array.isArray(track?.modules) ? track.modules : [];
  const subjects = Array.isArray(track?.subjects) ? track.subjects : [];

  // Mock enrollment and progress data
  const enrollmentData = {
    enrolledDate: new Date(2024, 0, 15).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    estimatedCompletion: new Date(2024, 5, 15).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    totalHours: Math.max(20, subjects.length * 8),
    completedHours: Math.floor(Math.max(5, subjects.length * 2.5))
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <MobileSidebar active="/curriculum" />
      <div className="lg:flex lg:gap-6 max-w-screen-2xl mx-auto p-4 md:p-6">
        <Sidebar active="/curriculum" />
        
        <main className="flex-1">
          <ProfessionalCourseOverview
            courseId={courseId}
            track={track}
            subjects={subjects}
            modules={modules}
            enrollmentData={enrollmentData}
          />
        </main>
      </div>
    </div>
  );
}