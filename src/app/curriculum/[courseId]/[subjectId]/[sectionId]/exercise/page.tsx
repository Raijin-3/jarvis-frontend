import { redirect } from "next/navigation";
import { apiGet } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase-server";
import { Sidebar } from "../../../../../dashboard/sidebar";
import { MobileSidebar } from "../../../../../dashboard/mobile-sidebar";

type Track = any;

export const metadata = { title: "Exercise | Curriculum" };

export default async function ExercisePage({ params }: { params: Promise<{ courseId: string; subjectId: string; sectionId: string }> }) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const { courseId, subjectId, sectionId } = await params;
  const track: Track = await apiGet(`/v1/curriculum/${courseId}`).catch(() => null as any);
  const modules = Array.isArray(track?.modules) ? track.modules : [];
  const subjectModules = modules.filter((m: any) => m.subjectId === subjectId);
  const section = modules.flatMap((m: any) => m.sections || []).find((s: any) => s.id === sectionId);
  if (!section) redirect(`/curriculum/${courseId}/${subjectId}`);

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6">
      <MobileSidebar active="/curriculum" />
      <div className="lg:flex lg:gap-4">
        <Sidebar active="/curriculum" />
        {/* HackerRank-like split: question left, editor right */}
        <main className="flex-1 rounded-xl border border-border bg-white/70 p-0 backdrop-blur overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 h-[70vh]">
            {/* Question / prompt */}
            <section className="p-4 md:border-r border-border overflow-auto">
              <h1 className="text-lg font-semibold">{section.title} • Exercise</h1>
              <div className="mt-2 text-sm text-muted-foreground">Write code to solve the prompt. Replace with real practice content when available.</div>
              {/* Placeholder prompt */}
              <div className="mt-3 text-sm">
                {Array.isArray(section.exercises) && section.exercises.length
                  ? (
                    <>
                      <div className="font-medium">{section.exercises[0].title}</div>
                      <p className="mt-1 text-muted-foreground">Code challenge placeholder.</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No exercises configured. This is a placeholder prompt.</p>
                  )}
              </div>
            </section>
            {/* Code editor */}
            <section className="flex flex-col">
              <div className="px-3 py-2 border-b border-border text-xs text-muted-foreground">Editor</div>
              <textarea defaultValue={`-- Write your solution here\n`} className="flex-1 font-mono text-sm p-3 outline-none" />
              <div className="border-t border-border p-2 flex gap-2 justify-end">
                <button className="rounded-md border border-border bg-white px-3 py-1 text-sm hover:bg-black/5">Run</button>
                <button className="rounded-md border border-border bg-white px-3 py-1 text-sm hover:bg-black/5">Submit</button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
