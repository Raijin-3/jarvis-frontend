"use client";

import { useMemo, useState } from "react";
import { VideoPlayer } from "@/components/video-player";
import { ProfessionalCourseTabs } from "@/components/professional-course-tabs";
import { BookOpen, Clock, CheckCircle, Circle, ChevronRight, Play, FileText, HelpCircle, Activity } from "lucide-react";

type Section = { id: string; title: string; overview?: string; lecture?: { content?: string } | null };
type Module = { slug?: string; title: string; sections?: Section[] };

export function SubjectLearningInterface({
  trackTitle,
  subjectTitle,
  subjectModules,
  completedSections,
  totalSections,
  courseId,
  subjectId,
}: {
  trackTitle: string;
  subjectTitle?: string | null;
  subjectModules: Module[];
  completedSections: number;
  totalSections: number;
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

  // Enhanced fallback content sequence with educational materials
  const fallbackSources = [
    // Big Buck Bunny sample video
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://iframe.mediadelivery.net/play/243528/c28b69a3-5301-455f-ab5a-9d24c4fef2da",
    "https://iframe.mediadelivery.net/play/243528/da4481d9-69c5-4fc4-aa1f-54f84c83a85f",
    "https://iframe.mediadelivery.net/play/243528/ff8d7d62-bdb8-46f2-ae92-ae12e6ad77bf",
    "https://iframe.mediadelivery.net/play/243528/3f874639-8a68-47b9-aabb-9e28af35120b",
    `# Introduction to Data Analysis

## Overview
This comprehensive lesson covers the fundamentals of data analysis, including:

• Data collection and preparation methods
• Statistical analysis techniques
• Data visualization best practices
• Common pitfalls and how to avoid them

## Learning Objectives
By the end of this lesson, you will be able to:
1. Understand different types of data and their characteristics
2. Apply appropriate analytical techniques for your dataset
3. Create meaningful visualizations to communicate insights
4. Validate your findings and ensure accuracy`,
    `# Advanced SQL Techniques

## Window Functions
Window functions allow you to perform calculations across a set of table rows related to the current row:

\`\`\`sql
SELECT 
  employee_name,
  salary,
  AVG(salary) OVER (PARTITION BY department) as dept_avg_salary
FROM employees;
\`\`\`

## Key Concepts
- OVER clause defines the window
- PARTITION BY groups rows
- ORDER BY defines sequence within partition

## Practice Exercises
Complete the following exercises to reinforce your understanding.`,
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
  ];

  const content = useMemo(() => {
    const idx = Math.max(0, allSections.findIndex((s) => s.id === selectedSectionId));
    const fromLecture = (selectedSection?.lecture as any)?.content?.trim?.();
    return fromLecture || fallbackSources[(idx >= 0 ? idx : 0) % fallbackSources.length];
  }, [allSections, selectedSection, selectedSectionId]);

  const isVideoContent = useMemo(() => {
    const txt = (content || "").trim();
    try {
      const u = new URL(txt);
      const lower = u.pathname.toLowerCase();
      return (
        u.hostname.includes("mediadelivery.net") ||
        lower.endsWith(".mp4") ||
        lower.endsWith(".webm") ||
        lower.endsWith(".ogg")
      );
    } catch {
      return false;
    }
  }, [content]);

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
        return <img src={txt} alt="Learning Material" className="max-h-full object-contain rounded-lg" />;
      }
      if (lower.endsWith(".pdf")) {
        return <iframe src={txt} className="w-full h-full rounded-lg" />;
      }
      return <a href={txt} target="_blank" className="text-blue-600 underline hover:text-blue-800">Open resource</a>;
    } catch {
      // Text content - render as markdown-style
      return (
        <div className="w-full h-full p-8 text-gray-800 overflow-auto bg-white rounded-lg">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <div 
              className="whitespace-pre-wrap leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: txt
                  .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold text-gray-900 mb-4 mt-8">$1</h1>')
                  .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold text-gray-800 mb-3 mt-6">$1</h2>')
                  .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium text-gray-700 mb-2 mt-4">$1</h3>')
                  .replace(/^\• (.*$)/gm, '<li class="ml-4">$1</li>')
                  .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 list-decimal">$2</li>')
                  .replace(/```sql([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto"><code class="language-sql">$1</code></pre>')
                  .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto"><code>$1</code></pre>')
                  .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded font-mono text-sm">$1</code>')
              }}
            />
          </div>
        </div>
      );
    }
  }, [content]);

  const currentSectionIndex = allSections.findIndex((s) => s.id === selectedSectionId);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 h-full">
      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {trackTitle} {subjectTitle ? `• ${subjectTitle}` : ""}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{totalSections} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>≈ {Math.ceil(totalSections * 15)} minutes total</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Progress</div>
              <div className="text-2xl font-bold text-indigo-600">
                {completedSections}/{totalSections}
              </div>
              <div className="text-xs text-gray-500">lessons completed</div>
            </div>
          </div>
          
          {/* Simple Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{width: `${totalSections > 0 ? (completedSections / totalSections) * 100 : 0}%`}}
            ></div>
          </div>
          <div className="mt-2 text-xs text-gray-600 text-center">
            {Math.round(totalSections > 0 ? (completedSections / totalSections) * 100 : 0)}% Complete
          </div>
        </div>

        {/* Current Lesson Header */}
        {selectedSection && (
          <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Play className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Current Lesson</h3>
                  <p className="text-sm text-gray-600">{selectedSection.title}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Lesson {currentSectionIndex + 1} of {totalSections}
              </div>
            </div>
          </div>
        )}

        {/* Content Display */}
        {isVideoContent ? (
          <div className="border border-white/60 bg-black/95 backdrop-blur-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-black/60 text-white">
              <div className="truncate">
                <div className="text-xs uppercase text-white/70">Now Playing</div>
                <div className="text-sm font-medium truncate">{selectedSection?.title || "Lesson"}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
                  onClick={() => {
                    const prevIndex = currentSectionIndex > 0 ? currentSectionIndex - 1 : 0;
                    const prev = allSections[prevIndex];
                    if (prev) setSelectedSectionId(prev.id);
                  }}
                >Prev</button>
                <button
                  type="button"
                  className="rounded-md border border-white/20 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20"
                  onClick={() => {
                    const nextIndex = Math.min(currentSectionIndex + 1, allSections.length - 1);
                    const next = allSections[nextIndex];
                    if (next) setSelectedSectionId(next.id);
                  }}
                >Next</button>
              </div>
            </div>
            <div className="relative w-full pt-[56.25%] bg-black">
              <div className="absolute custom-inset">
                {contentNode}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden min-h-[500px]">
            <div className="h-full">
              {contentNode}
            </div>
          </div>
        )}

        {/* Course Tabs */}
        <ProfessionalCourseTabs
          courseHrefBase={`/curriculum/${courseId}/${subjectId}`}
          sectionId={selectedSectionId}
          sectionTitle={selectedSection?.title}
          section={selectedSection as any}
        />
      </div>

      {/* Sidebar - Course Navigation */}
      <div className="space-y-6">
        {/* Navigation Header */}
        <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            <h2 className="font-semibold text-gray-900">Course Content</h2>
          </div>
          <p className="text-sm text-gray-600">Navigate through the lessons below</p>
        </div>

        {/* Course Modules */}
        <div className="space-y-4">
          {(subjectModules || []).map((module, moduleIndex) => (
            <div key={module.slug || moduleIndex} className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200/50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
                    {moduleIndex + 1}
                  </div>
                  {module.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {(module.sections || []).length} lesson{(module.sections || []).length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="p-2">
                {(module.sections || []).map((section, sectionIndex) => {
                  const isCompleted = currentSectionIndex > allSections.findIndex(s => s.id === section.id);
                  const isCurrent = section.id === selectedSectionId;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setSelectedSectionId(section.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 hover:bg-white/60 ${
                        isCurrent 
                          ? "bg-indigo-100 border border-indigo-200" 
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : isCurrent ? (
                          <Play className="h-5 w-5 text-indigo-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${
                          isCurrent ? "text-indigo-900" : "text-gray-900"
                        }`}>
                          {section.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {isCompleted ? "Completed" : isCurrent ? "Current" : "Not started"}
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 flex-shrink-0 ${
                        isCurrent ? "text-indigo-500" : "text-gray-400"
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Learning Resources */}
        <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-4 backdrop-blur-xl shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-500" />
            Learning Resources
          </h3>
          <div className="space-y-3">
            <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/60 transition-colors">
              <FileText className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">Study Notes</div>
                <div className="text-xs text-gray-500">Downloadable summary</div>
              </div>
            </a>
            <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/60 transition-colors">
              <Activity className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">Practice Exercises</div>
                <div className="text-xs text-gray-500">Additional problems</div>
              </div>
            </a>
            <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/60 transition-colors">
              <HelpCircle className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">Get Help</div>
                <div className="text-xs text-gray-500">Ask questions</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
