import { redirect } from "next/navigation";
import { apiGet } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase-server";
import { Sidebar } from "../../../../dashboard/sidebar";
import { MobileSidebar } from "../../../../dashboard/mobile-sidebar";
import Link from "next/link";

type Track = any;

export const metadata = { title: "Section | Curriculum" };

export default async function SectionPage({ params }: { params: Promise<{ courseId: string; subjectId: string; sectionId: string }> }) {
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
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
          <main className="rounded-xl border border-border bg-white/70 p-4 backdrop-blur">
            <h1 className="text-xl font-semibold">{section.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{section.overview || 'Section overview'}</p>

            {/* Actions removed per design */}
          </main>
          <aside className="rounded-xl border border-border bg-white/70 p-4 backdrop-blur md:sticky md:top-16 md:h-[calc(100dvh-8rem)] md:overflow-auto">
            <h2 className="text-sm font-medium">Course content</h2>
            <div className="mt-2 space-y-2 text-sm">
              {subjectModules.map((m: any, mi: number) => (
                <details key={m.slug || mi} className="border border-border rounded-md" open={mi===0}>
                  <summary className="px-3 py-2 font-medium cursor-pointer select-none">{m.title}</summary>
                  <div className="px-3 pb-2 space-y-1">
                    {(m.sections || []).map((s: any) => (
                      <Link key={s.id} href={`/curriculum/${courseId}/${subjectId}/${s.id}/lecture`} className={`block rounded px-2 py-1 text-xs hover:bg-black/5 ${s.id===sectionId?'bg-black/5':''}`}>{s.title}</Link>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
