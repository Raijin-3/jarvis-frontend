import { redirect } from "next/navigation";
import { apiGet } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase-server";
import { Sidebar } from "../../../dashboard/sidebar";
import { MobileSidebar } from "../../../dashboard/mobile-sidebar";
import { SubjectLearningInterface } from "@/components/subject-learning-interface";

type Track = any;

const normalizeBaseUrl = (input?: string | null) => {
  if (!input) return "";
  return input.replace(/\/+$/, "");
};

const resolveMediaSource = (body: string | undefined | null, baseUrl: string): string => {
  if (!body) return body ?? "";
  if (/^https?:\/\//i.test(body)) return body;
  if (!baseUrl) return body;
  return `${baseUrl}/${body.replace(/^\/+/,'')}`;
};

const parseLectureContent = (raw: unknown, baseUrl: string): string => {
  if (typeof raw !== "string") {
    if (raw === null || raw === undefined) return "";
    return String(raw);
  }
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && typeof (parsed as any).body === "string") {
      return resolveMediaSource((parsed as any).body, baseUrl);
    }
  } catch (error) {
    // ignore parse errors and return original string
  }
  return trimmed;
};

const normalizeLecture = (lecture: any, baseUrl: string) => {
  if (!lecture) return lecture;
  return {
    ...lecture,
    content: parseLectureContent(lecture.content, baseUrl),
  };
};

const normalizeSection = (section: any, baseUrl: string) => {
  const normalizedLecture = normalizeLecture(section?.lecture, baseUrl);
  const normalizedLectures = Array.isArray(section?.lectures)
    ? section.lectures.map((lecture: any) => normalizeLecture(lecture, baseUrl))
    : undefined;
  return {
    ...section,
    lecture: normalizedLecture,
    lectures: normalizedLectures,
  };
};

const normalizeModules = (modules: any[], baseUrl: string) => {
  return modules.map((module: any) => ({
    ...module,
    sections: Array.isArray(module.sections)
      ? module.sections.map((section: any) => normalizeSection(section, baseUrl))
      : [],
  }));
};

export const metadata = { title: "Subject | Curriculum" };

export default async function SubjectPage({ params }: { params: Promise<{ courseId: string; subjectId: string }> }) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');

  const { courseId, subjectId } = await params;
  const track: Track = await apiGet(`/v1/curriculum/${courseId}`).catch(() => null as any);
  const modules = Array.isArray(track?.modules) ? track.modules : [];
  const baseMediaUrl = normalizeBaseUrl(process.env.BASE_MEDIA_URL ?? process.env.NEXT_PUBLIC_BASE_MEDIA_URL ?? "");
  const normalizedModules = normalizeModules(modules, baseMediaUrl);

  const subject = Array.isArray(track?.subjects) ? track.subjects.find((s: any) => s.id === subjectId) : null;
  const subjectModules = normalizedModules.filter((m: any) => m.subjectId === subjectId);
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


