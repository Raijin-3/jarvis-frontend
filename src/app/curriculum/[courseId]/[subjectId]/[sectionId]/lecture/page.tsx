import { redirect } from "next/navigation";
import { apiGet } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase-server";
import { Sidebar } from "../../../../../dashboard/sidebar";
import { MobileSidebar } from "../../../../../dashboard/mobile-sidebar";
import { VideoPlayer } from "@/components/video-player";
import { ProgressMini } from "@/components/gamification";
import Link from "next/link";

type Track = any;

export const metadata = { title: "Lecture | Curriculum" };

export default async function LecturePage({ params }: { params: Promise<{ courseId: string; subjectId: string; sectionId: string }> }) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const { courseId, subjectId, sectionId } = await params;
  const track: Track = await apiGet(`/v1/curriculum/${courseId}`).catch(() => null as any);
  const modules = Array.isArray(track?.modules) ? track.modules : [];
  const subjectModules = modules.filter((m: any) => m.subjectId === subjectId);
  const section = modules.flatMap((m: any) => m.sections || []).find((s: any) => s.id === sectionId);
  if (!section) redirect(`/curriculum/${courseId}/${subjectId}`);

  // Fallback demo content if lecture content is missing
  const allSections = subjectModules.flatMap((m: any) => m.sections || []);
  const secIndex = Math.max(0, allSections.findIndex((s: any) => s.id === sectionId));
  const fallbackSources = [
    'https://iframe.mediadelivery.net/play/243528/c28b69a3-5301-455f-ab5a-9d24c4fef2da',
    'https://iframe.mediadelivery.net/play/243528/da4481d9-69c5-4fc4-aa1f-54f84c83a85f',
    'https://iframe.mediadelivery.net/play/243528/ff8d7d62-bdb8-46f2-ae92-ae12e6ad77bf',
    'https://iframe.mediadelivery.net/play/243528/3f874639-8a68-47b9-aabb-9e28af35120b',
    'This is a sample lecture text explaining the topic in detail. Replace with real content from the admin when ready.',
    'Another short text-based lecture. You can include bullet points, explanations, or references here.',
    'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1200&q=60',
    'https://images.unsplash.com/photo-1526378722484-bd91ca387e72?auto=format&fit=crop&w=1200&q=60',
  ];
  const content = (section.lecture?.content || '').trim() || fallbackSources[(secIndex >= 0 ? secIndex : 0) % fallbackSources.length];
  const overallProgress = Math.min(100, Math.round(allSections.length ? 10 : 0));
  const contentNode = (() => {
    const txt = (content || '').trim();
    if (!txt) return <div className="w-full h-full flex items-center justify-center text-sm text-white/70">Lecture content coming soon.</div>;
    try {
      const u = new URL(txt);
      const lower = u.pathname.toLowerCase();
      if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg')) {
        return (
          <video src={txt} controls className="w-full h-full" />
        );
      }
      if (u.hostname.includes('mediadelivery.net')) {
        return <VideoPlayer src={txt} />;
      }
      if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.webp')) {
        return <img src={txt} alt="Lecture" className="max-h-full object-contain" />;
      }
      if (lower.endsWith('.pdf')) {
        return <iframe src={txt} className="w-full h-full" />;
      }
      // Fallback to showing the URL as a link
      return (
        <a href={txt} className="text-xs underline" target="_blank">Open resource</a>
      );
    } catch {
      // Not a URL -> treat as text/HTML
      return <div className="w-full h-full flex items-center justify-center text-sm text-white/70 px-6 text-center">{txt}</div>;
    }
  })();

  return (
    <div className="mx-auto max-w-screen-2xl p-0 md:p-0">
      <MobileSidebar active="/curriculum" />
      <div className="lg:flex lg:gap-4">
        <Sidebar active="/curriculum" />
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_360px]">
        {/* Main player/content area */}
        <main className="bg-black text-white min-h-[60vh] md:min-h-[80vh] flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 text-lg font-semibold flex items-center justify-between gap-4">
            <div className="truncate">{track?.title}</div>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <span>Your progress</span>
              <div className="w-24"><ProgressMini value={overallProgress} /></div>
              <span className="text-white/90">{overallProgress}%</span>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0">{contentNode}</div>
          </div>
        </main>

        {/* Sidebar course content */}
        <aside className="bg-[#15161a] text-white md:h-[100dvh] md:overflow-auto">
          <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold">Course content</div>
          <div className="p-3 space-y-2">
            {subjectModules.map((m: any, mi: number) => (
              <details key={m.slug || mi} className="bg-[#1b1e24] rounded-md" open={mi===0}>
                <summary className="px-3 py-2 text-sm font-medium border-b border-white/10 cursor-pointer select-none">{m.title}</summary>
                <div className="p-2 space-y-1">
                  {(m.sections || []).map((s: any) => (
                    <Link key={s.id} href={`/curriculum/${courseId}/${subjectId}/${s.id}/lecture`} className={`block rounded px-2 py-1 text-xs hover:bg-white/5 ${s.id===sectionId?'bg-white/10':''}`}>{s.title}</Link>
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
