"use client";

import { useMemo, useState } from "react";
import { VideoPlayer } from "@/components/video-player";
import { ProgressMini } from "@/components/gamification";
import { CourseTabs } from "@/components/course-tabs";

type Section = { id: string; title: string; overview?: string; lecture?: { content?: string } | null };
type Module = { slug?: string; title: string; sections?: Section[] };

export function SubjectInteractive({
  trackTitle,
  subjectTitle,
  subjectModules,
  overallProgress,
  courseId,
  subjectId,
}: {
  trackTitle: string;
  subjectTitle?: string | null;
  subjectModules: Module[];
  overallProgress: number;
  courseId: string;
  subjectId: string;
}) {
  const allSections = useMemo(
    () => (subjectModules || []).flatMap((m) => m.sections || []),
    [subjectModules]
  );
  const initialSectionId = allSections[0]?.id;
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>(initialSectionId);

  const selectedSection: Section | undefined = useMemo(
    () => (subjectModules || []).flatMap((m) => m.sections || []).find((s) => s.id === selectedSectionId),
    [subjectModules, selectedSectionId]
  );

  // Create a fallback content sequence
  const fallbackSources = [
    "https://iframe.mediadelivery.net/play/243528/c28b69a3-5301-455f-ab5a-9d24c4fef2da",
    "https://iframe.mediadelivery.net/play/243528/da4481d9-69c5-4fc4-aa1f-54f84c83a85f",
    "https://iframe.mediadelivery.net/play/243528/ff8d7d62-bdb8-46f2-ae92-ae12e6ad77bf",
    "https://iframe.mediadelivery.net/play/243528/3f874639-8a68-47b9-aabb-9e28af35120b",
    "This is a sample lecture text explaining the topic in detail. Replace with real content from the admin when ready.",
    "Another short text-based lecture. You can include bullet points, explanations, or references here.",
    "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1200&q=60",
    "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?auto=format&fit=crop&w=1200&q=60",
  ];

  const content = useMemo(() => {
    const idx = Math.max(0, allSections.findIndex((s) => s.id === selectedSectionId));
    const fromLecture = (selectedSection?.lecture as any)?.content?.trim?.();
    return fromLecture || fallbackSources[(idx >= 0 ? idx : 0) % fallbackSources.length];
  }, [allSections, selectedSection, selectedSectionId]);

  const contentNode = useMemo(() => {
    const txt = (content || "").trim();
    try {
      const u = new URL(txt);
      const lower = u.pathname.toLowerCase();
      if (u.hostname.includes("mediadelivery.net")) {
        return <VideoPlayer src={txt} />;
      }
      if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".ogg")) {
        return <VideoPlayer src={txt} />;
      }
      if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif") || lower.endsWith(".webp")) {
        return <img src={txt} alt="Lecture" className="max-h-full object-contain" />;
      }
      if (lower.endsWith(".pdf")) {
        return <iframe src={txt} className="w-full h-full" />;
      }
      return <a href={txt} target="_blank" className="text-xs underline">Open resource</a>;
    } catch {
      return (
        <div className="w-full h-full flex items-center justify-center text-sm text-white/70 px-6 text-center">
          {txt}
        </div>
      );
    }
  }, [content]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_360px]">
      {/* Left: player + below tabs */}
      <main className="bg-black text-white min-h-[60vh] md:min-h-[70vh] flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 text-lg font-semibold truncate flex items-center justify-between gap-4">
          <div className="truncate">{trackTitle} {subjectTitle ? `• ${subjectTitle}` : ""}</div>
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span>Your progress</span>
            <div className="w-24"><ProgressMini value={overallProgress} /></div>
            <span className="text-white/90">{overallProgress}%</span>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="absolute inset-0">{contentNode}</div>
        </div>

        {/* Bottom strip: progress + tabs */}
        <div className="bg-[#0f1115] border-t border-white/10 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-white/70">Overall progress</div>
            <div className="w-64"><ProgressMini value={overallProgress} /></div>
          </div>
          <CourseTabs
            courseHrefBase={`/curriculum/${courseId}/${subjectId}`}
            sectionId={selectedSectionId}
            sectionTitle={selectedSection?.title}
            section={selectedSection as any}
          />
        </div>
      </main>

      {/* Right: accordion */}
      <aside className="bg-[#15161a] text-white md:h-[100dvh] md:overflow-auto">
        <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold">Course content</div>
        <div className="p-3 space-y-2">
          {(subjectModules || []).map((m, mi) => (
            <details key={m.slug || mi} className="bg-[#1b1e24] rounded-md" open={mi===0}>
              <summary className="list-none cursor-pointer select-none px-3 py-2 text-sm font-medium border-b border-white/10">
                {m.title}
              </summary>
              <div className="p-2 space-y-1">
                {(m.sections || []).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSectionId(s.id)}
                    className={`block w-full text-left rounded px-2 py-1 text-xs hover:bg-white/5 ${
                      s.id === selectedSectionId ? "bg-white/10" : ""
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </details>
          ))}
        </div>
      </aside>
    </div>
  );
}
