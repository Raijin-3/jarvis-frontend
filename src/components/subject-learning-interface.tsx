"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VideoPlayer } from "@/components/video-player";
import { ProfessionalCourseTabs } from "@/components/professional-course-tabs";
import {
  Activity,
  BookOpen,
  CheckCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Code,
  FileText,
  HelpCircle,
  Play,
} from "lucide-react";

type Lecture = { id?: string; title?: string; content?: string; type?: string };
type Exercise = { id?: string; title?: string; content?: string; type?: string };
type Quiz = { id?: string; title?: string; questions?: number; type?: string };
type Section = {
  id: string;
  title: string;
  overview?: string;
  lecture?: Lecture | null;
  lectures?: Lecture[];
  exercises?: Exercise[];
  quizzes?: Quiz[];
};
type Module = { slug?: string; title: string; subjectId?: string; sections?: Section[] };
type ResourceKind = "lecture" | "exercise" | "quiz";
type SelectedResource = { sectionId: string; kind: ResourceKind; resourceId?: string };

const resourceLabels: Record<ResourceKind, string> = {
  lecture: "Lecture Video",
  exercise: "Practice Exercise",
  quiz: "Section Quiz",
};

const FALLBACK_SOURCES: string[] = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://iframe.mediadelivery.net/play/243528/c28b69a3-5301-455f-ab5a-9d24c4fef2da",
  "https://iframe.mediadelivery.net/play/243528/da4481d9-69c5-4fc4-aa1f-54f84c83a85f",
  "https://iframe.mediadelivery.net/play/243528/ff8d7d62-bdb8-46f2-ae92-ae12e6ad77bf",
  "https://iframe.mediadelivery.net/play/243528/3f874639-8a68-47b9-aabb-9e28af35120b",
  `# Introduction to Data Analysis

## Overview
This comprehensive lesson covers the fundamentals of data analysis, including:

- Data collection and preparation methods
- Statistical analysis techniques
- Data visualization best practices
- Common pitfalls and how to avoid them

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
const getLectures = (section?: Section | null): Lecture[] => {
  if (!section) return [];
  const lectureList = Array.isArray(section.lectures)
    ? section.lectures.filter((lecture): lecture is Lecture => Boolean(lecture))
    : [];
  const fallbackLecture = section.lecture;
  if (fallbackLecture) {
    const hasSameId = fallbackLecture.id
      ? lectureList.some((lecture) => lecture.id === fallbackLecture.id)
      : false;
    if (!hasSameId) {
      return [fallbackLecture, ...lectureList];
    }
  }
  return lectureList;
};

const getLectureKey = (lecture: Lecture, index: number) => lecture.id ?? `lecture-${index}`;


const getExercises = (section?: Section | null): Exercise[] => {
  if (!section || !Array.isArray(section.exercises)) return [];
  return section.exercises.filter(Boolean);
};

const getQuizzes = (section?: Section | null): Quiz[] => {
  if (!section || !Array.isArray(section.quizzes)) return [];
  return section.quizzes.filter(Boolean);
};

const getDefaultResource = (section?: Section | null): SelectedResource | null => {
  if (!section) return null;
  const lectures = getLectures(section);
  if (lectures.length) {
    return {
      sectionId: section.id,
      kind: "lecture",
      resourceId: getLectureKey(lectures[0], 0),
    };
  }
  const exercises = getExercises(section);
  if (exercises.length) {
    return { sectionId: section.id, kind: "exercise", resourceId: exercises[0]?.id };
  }
  const quizzes = getQuizzes(section);
  if (quizzes.length) {
    return { sectionId: section.id, kind: "quiz", resourceId: quizzes[0]?.id };
  }
  return null;
};

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
    () => (subjectModules || []).flatMap((module) => module.sections || []),
    [subjectModules]
  );

  const initialSectionId = allSections[0]?.id;
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>(() => initialSectionId);

  const selectedSection: Section | undefined = useMemo(
    () => allSections.find((section) => section.id === selectedSectionId),
    [allSections, selectedSectionId]
  );

  const defaultSelectedResource = useMemo(() => getDefaultResource(selectedSection), [selectedSection]);
  const [selectedResource, setSelectedResource] = useState<SelectedResource | null>(() => defaultSelectedResource);
const mainContentRef = useRef<HTMLDivElement | null>(null);
  const autoScrollArmedRef = useRef(false);

  useEffect(() => {
    if (!allSections.length) {
      setSelectedSectionId(undefined);
      return;
    }
    setSelectedSectionId((prev) => {
      if (prev && allSections.some((section) => section.id === prev)) {
        return prev;
      }
      return allSections[0]?.id;
    });
  }, [allSections]);

  useEffect(() => {
    if (!selectedSection) {
      setSelectedResource((prev) => (prev ? null : prev));
      return;
    }
    const fallbackResource = getDefaultResource(selectedSection);
    setSelectedResource((prev) => {
      if (prev && prev.sectionId === selectedSection.id) {
        if (prev.kind === "lecture") {
          const lectures = getLectures(selectedSection);
          if (!lectures.length) return fallbackResource;
          const defaultLecture = {
            sectionId: selectedSection.id,
            kind: "lecture" as const,
            resourceId: getLectureKey(lectures[0], 0),
          };
          if (!prev.resourceId) return defaultLecture;
          const hasLecture = lectures.some((lecture, index) => getLectureKey(lecture, index) === prev.resourceId);
          if (hasLecture) return prev;
          return defaultLecture;
        }
        if (prev.kind === "exercise") {
          const exercises = getExercises(selectedSection);
          if (exercises.some((exercise) => exercise.id === prev.resourceId)) return prev;
          if (exercises.length) {
            return { sectionId: selectedSection.id, kind: "exercise", resourceId: exercises[0]?.id };
          }
        }
        if (prev.kind === "quiz") {
          const quizzes = getQuizzes(selectedSection);
          if (quizzes.some((quiz) => quiz.id === prev.resourceId)) return prev;
          if (quizzes.length) {
            return { sectionId: selectedSection.id, kind: "quiz", resourceId: quizzes[0]?.id };
          }
        }
      }
      return fallbackResource;
    });
  }, [selectedSection]);

  const lectureSelection = useMemo(() => {
    if (
      !selectedSection ||
      !selectedResource ||
      selectedResource.kind !== "lecture" ||
      selectedResource.sectionId !== selectedSection.id
    ) {
      return null;
    }
    const lectures = getLectures(selectedSection);
    if (!lectures.length) return null;
    const targetIndex = selectedResource.resourceId
      ? lectures.findIndex((lecture, index) => getLectureKey(lecture, index) === selectedResource.resourceId)
      : 0;
    const index = targetIndex >= 0 ? targetIndex : 0;
    return { lecture: lectures[index], index };
  }, [selectedSection, selectedResource]);

  const activeLecture = lectureSelection?.lecture ?? null;

  const lectureContent = useMemo(() => {
    if (!selectedSection || !lectureSelection) {
      return null;
    }
    const { lecture, index } = lectureSelection;
    const raw = typeof lecture?.content === "string" ? lecture.content.trim() : "";
    const sectionIndex = Math.max(0, allSections.findIndex((section) => section.id === selectedSection.id));
    const fallbackIndex = (sectionIndex + index) % FALLBACK_SOURCES.length;
    return raw || FALLBACK_SOURCES[fallbackIndex];
  }, [allSections, lectureSelection, selectedSection]);

  const activeExercise = useMemo(() => {
    if (
      !selectedSection ||
      !selectedResource ||
      selectedResource.kind !== "exercise" ||
      selectedResource.sectionId !== selectedSection.id
    ) {
      return null;
    }
    const exercises = getExercises(selectedSection);
    if (!exercises.length) return null;
    if (!selectedResource.resourceId) return exercises[0];
    return exercises.find((exercise) => exercise.id === selectedResource.resourceId) || exercises[0];
  }, [selectedResource, selectedSection]);

  const activeQuiz = useMemo(() => {
    if (
      !selectedSection ||
      !selectedResource ||
      selectedResource.kind !== "quiz" ||
      selectedResource.sectionId !== selectedSection.id
    ) {
      return null;
    }
    const quizzes = getQuizzes(selectedSection);
    if (!quizzes.length) return null;
    if (!selectedResource.resourceId) return quizzes[0];
    return quizzes.find((quiz) => quiz.id === selectedResource.resourceId) || quizzes[0];
  }, [selectedResource, selectedSection]);

  const isLectureVideo = useMemo(() => {
    if (!lectureContent) return false;
    const trimmed = lectureContent.trim();
    try {
      const url = new URL(trimmed);
      const lower = url.pathname.toLowerCase();
      return (
        url.hostname.includes("mediadelivery.net") ||
        lower.endsWith(".mp4") ||
        lower.endsWith(".webm") ||
        lower.endsWith(".ogg")
      );
    } catch {
      return false;
    }
  }, [lectureContent]);

  const lectureNode = useMemo(() => {
    if (!lectureContent) {
      return (
        <div className="w-full h-full flex items-center justify-center text-sm text-white/70">
          Lecture content coming soon.
        </div>
      );
    }

    const txt = lectureContent.trim();
    try {
      const url = new URL(txt);
      const lower = url.pathname.toLowerCase();

      if (url.hostname.includes("mediadelivery.net")) {
        return <VideoPlayer src={txt} className="h-full w-full object-cover" />;
      }
      if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".ogg")) {
        return <VideoPlayer src={txt} className="h-full w-full object-cover" />;
      }
      if (
        lower.endsWith(".png") ||
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".gif") ||
        lower.endsWith(".webp")
      ) {
        return <img src={txt} alt="Learning Material" className="max-h-full object-contain rounded-lg" />;
      }
      if (lower.endsWith(".pdf")) {
        return <iframe src={txt} className="w-full h-full rounded-lg" />;
      }
      return (
        <a href={txt} target="_blank" className="text-xs underline text-blue-600 hover:text-blue-800">
          Open resource
        </a>
      );
    } catch {
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
                  .replace(/^-\s+(.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
                  .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 list-decimal">$2</li>')
                  .replace(
                    /\`\`\`sql([\s\S]*?)\`\`\`/g,
                    '<pre class="bg-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto"><code class="language-sql">$1</code></pre>'
                  )
                  .replace(
                    /\`\`\`([\s\S]*?)\`\`\`/g,
                    '<pre class="bg-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto"><code>$1</code></pre>'
                  )
                  .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded font-mono text-sm">$1</code>')
              }}
            />
          </div>
        </div>
      );
    }
  }, [lectureContent]);

  const currentSectionIndex = Math.max(0, allSections.findIndex((section) => section.id === selectedSectionId));
  const currentResourceLabel = useMemo(() => {
    if (!selectedResource) return "Lesson Overview";
    if (selectedResource.kind === "lecture") {
      return activeLecture?.title || resourceLabels.lecture;
    }
    if (selectedResource.kind === "exercise") {
      return activeExercise?.title || resourceLabels.exercise;
    }
    if (selectedResource.kind === "quiz") {
      return activeQuiz?.title || resourceLabels.quiz;
    }
    return resourceLabels[selectedResource.kind];
  }, [selectedResource, activeLecture, activeExercise, activeQuiz]);

  const renderLectureDisplay = () => {
    if (!selectedSection || selectedResource?.kind !== "lecture" || !activeLecture) {
      return null;
    }

    const lectures = getLectures(selectedSection);
    const totalLecturesInSection = Math.max(lectures.length, 1);
    const lectureNumber = (lectureSelection?.index ?? 0) + 1;
    const canGoPrev = (lectureSelection?.index ?? 0) > 0 || currentSectionIndex > 0;
    const canGoNext =
      (lectureSelection?.index ?? 0) < totalLecturesInSection - 1 || currentSectionIndex < allSections.length - 1;

    const goToAdjacentLecture = (direction: -1 | 1) => {
      if (!lectureSelection || !selectedSection) return;
      const targetLectureIndex = lectureSelection.index + direction;
      if (targetLectureIndex >= 0 && targetLectureIndex < lectures.length) {
        const nextLecture = lectures[targetLectureIndex];
        const nextKey = getLectureKey(nextLecture, targetLectureIndex);
        setSelectedResource({
          sectionId: selectedSection.id,
          kind: "lecture",
          resourceId: nextKey,
        });
        return;
      }
      const targetSectionIndex = currentSectionIndex + direction;
      if (targetSectionIndex >= 0 && targetSectionIndex < allSections.length) {
        const targetSection = allSections[targetSectionIndex];
        setSelectedSectionId(targetSection.id);
        const fallback = getDefaultResource(targetSection as Section);
        setSelectedResource(fallback ?? null);
      }
    };

    const handlePrev = () => goToAdjacentLecture(-1);
    const handleNext = () => goToAdjacentLecture(1);

    const lectureMeta = `${lectureNumber} of ${totalLecturesInSection} in this section`;
    const lessonMeta = `Lesson ${currentSectionIndex + 1} of ${totalSections}`;
    const sectionSummary =
      typeof selectedSection.overview === "string" && selectedSection.overview.trim() !== ""
        ? selectedSection.overview.trim()
        : "Keep the momentum going and continue exploring the curriculum.";
    const sectionSummaryClean = sectionSummary.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    if (isLectureVideo) {
      return (
        <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl">
          <div className="relative bg-slate-950 text-white">
            <div className="relative aspect-video w-full">
              <div className="absolute inset-0">{lectureNode}</div>
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-6 py-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">Now Playing</p>
                  <p className="mt-1 max-w-xl text-sm font-semibold leading-snug text-white/90">
                    {activeLecture.title || selectedSection.title || "Lesson"}
                  </p>
                </div>
                <div className="hidden rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur lg:flex">
                  <span>{lectureMeta}</span>
                  <span className="mx-2 text-white/40">|</span>
                  <span>{lessonMeta}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 border-t border-slate-100 bg-white px-6 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600">
                    Section {currentSectionIndex + 1}
                  </span>
                  {lectures.length > 1 && (
                    <span className="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600">
                      Lecture {lectureNumber}
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">
                  {selectedSection.title}
                </h2>
                {/* <p className="mt-1 text-sm text-slate-600">
                  {sectionSummaryClean.length > 240 ? `${sectionSummaryClean.slice(0, 240)}...` : sectionSummaryClean}
                </p> */}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!canGoPrev}
                  className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-200"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-100 via-white to-white px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Learning Material</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">{selectedSection.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{lessonMeta}</p>
        </div>
        <div className="bg-slate-50 px-6 py-6">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6">
            {lectureNode}
          </div>
        </div>
      </div>
    );
  };

  const renderExerciseDisplay = () => {
    if (selectedResource?.kind !== "exercise") {
      return null;
    }

    return (
      <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-h-[460px]">
          <section className="p-6 border-b border-gray-200/60 lg:border-b-0 lg:border-r bg-white">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedSection?.title} - {activeExercise?.title || resourceLabels.exercise}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {activeExercise?.content
                ? activeExercise.content
                : "Work through the challenge and submit your solution when you are ready. Once practice content is authored in the admin, it will appear here automatically."}
            </p>
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
              <p className="text-sm text-indigo-900">
                Use the editor on the right to draft your answer. Starter code, tests, and hints will render here as soon as they are configured in the backend.
              </p>
            </div>
          </section>
          <section className="flex flex-col bg-[#111827] text-white">
            <div className="px-4 py-2 border-b border-white/10 text-xs uppercase tracking-wide text-white/70">
              Code Editor
            </div>
            <textarea
              defaultValue={`-- Write your solution here\n`}
              className="flex-1 font-mono text-sm p-4 bg-[#0f172a] text-white/90 outline-none resize-none"
            />
            <div className="border-t border-white/10 p-3 flex gap-2 justify-end bg-black/40">
              <button className="rounded-md border border-white/20 px-4 py-1.5 text-xs hover:bg-white/10">Run</button>
              <button className="rounded-md border border-white/20 px-4 py-1.5 text-xs bg-white/10 hover:bg-white/20">
                Submit
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderQuizDisplay = () => {
    if (selectedResource?.kind !== "quiz") {
      return null;
    }

    return (
      <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {selectedSection?.title} - {activeQuiz?.title || resourceLabels.quiz}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {activeQuiz?.questions ? `${activeQuiz.questions} questions` : "Assessment"} - Launching soon
        </p>
        <div className="mt-4 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 p-6 text-sm text-indigo-900">
          Quiz delivery will render here once question content is available. Author questions in the admin and students
          will be able to take the assessment directly within this panel.
        </div>
      </div>
    );
  };

  const renderEmptyDisplay = () => (
    <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden min-h-[320px]">
      <div className="h-full w-full flex items-center justify-center p-12 text-sm text-gray-500">
        Select a lecture, exercise, or quiz from the sidebar to get started.
      </div>
    </div>
  );

  let contentDisplay;
  if (selectedResource?.kind === "lecture") {
    contentDisplay = renderLectureDisplay();
  } else if (selectedResource?.kind === "exercise") {
    contentDisplay = renderExerciseDisplay();
  } else if (selectedResource?.kind === "quiz") {
    contentDisplay = renderQuizDisplay();
  } else {
    contentDisplay = renderEmptyDisplay();
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 h-full">
      <div ref={mainContentRef} className="space-y-6">
        <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {trackTitle}
                {subjectTitle ? ` / ${subjectTitle}` : ""}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>
                    {totalSections} lesson{totalSections === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>~{Math.max(1, Math.ceil(totalSections * 15))} minutes</span>
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
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${totalSections > 0 ? (completedSections / totalSections) * 100 : 0}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-600 text-center">
            {Math.round(totalSections > 0 ? (completedSections / totalSections) * 100 : 0)}% Complete
          </div>
        </div>

        {/* {selectedSection && (
          <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Play className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Current Activity</h3>
                  <p className="text-sm text-gray-600">
                    {selectedSection.title}
                    {currentResourceLabel ? ` - ${currentResourceLabel}` : ""}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Lesson {currentSectionIndex + 1} of {totalSections}
              </div>
            </div>
          </div>
        )} */}

        {contentDisplay}

        <ProfessionalCourseTabs
          courseHrefBase={`/curriculum/${courseId}/${subjectId}`}
          sectionId={selectedSectionId}
          sectionTitle={selectedSection?.title}
          section={selectedSection as any}
        />
      </div>

      <div className="space-y-6 lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:pr-2 lg:[scrollbar-width:thin] lg:[&::-webkit-scrollbar]:w-2 lg:[&::-webkit-scrollbar-thumb]:rounded-full lg:[&::-webkit-scrollbar-thumb]:bg-slate-300/60 lg:hover:[&::-webkit-scrollbar-thumb]:bg-slate-400/70 lg:[&::-webkit-scrollbar-track]:bg-transparent">
        <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-4 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-indigo-500" />
            <h2 className="font-semibold text-gray-900">Course Content</h2>
          </div>
          <p className="text-sm text-gray-600">Drill into a section to pick the resource you want to study.</p>
        </div>

        <div className="space-y-4">
          {(subjectModules || []).map((module, moduleIndex) => (
            <div
              key={module.slug || moduleIndex}
              className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl shadow-lg overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200/50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
                    {moduleIndex + 1}
                  </div>
                  {module.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {(module.sections || []).length} lesson{(module.sections || []).length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="p-2">
                {(module.sections || []).map((section) => {
                  const sectionIndex = allSections.findIndex((candidate) => candidate.id === section.id);
                  const isCurrentSection = section.id === selectedSectionId;
                  const isCompleted = sectionIndex >= 0 ? currentSectionIndex > sectionIndex : false;
                  const lectures = getLectures(section);
                  const exercises = getExercises(section);
                  const quizzes = getQuizzes(section);
                  const isExpanded = isCurrentSection;
                  const matchesLecture =
                    selectedResource?.sectionId === section.id && selectedResource.kind === "lecture";
                  const defaultLectureKey = lectures.length ? getLectureKey(lectures[0], 0) : null;
                  const activeLectureKey = matchesLecture
                    ? selectedResource.resourceId ?? defaultLectureKey
                    : null;

                  return (
                    <div key={section.id} className="mb-2 last:mb-0">
                      <button
                        onClick={() => {
                          setSelectedSectionId((prev) => (prev === section.id ? prev : section.id));
                          setSelectedResource((prev) => {
                            if (prev && prev.sectionId === section.id) {
                              return prev;
                            }
                            return getDefaultResource(section) ?? null;
                          });
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                          isCurrentSection ? "bg-indigo-100 border border-indigo-200" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : isCurrentSection ? (
                            <Play className="h-5 w-5 text-indigo-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm font-medium truncate ${
                              isCurrentSection ? "text-indigo-900" : "text-gray-900"
                            }`}
                          >
                            {section.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {isCompleted ? "Completed" : isCurrentSection ? "Current" : "Not started"}
                          </div>
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${
                            isExpanded ? "rotate-90 text-indigo-500" : ""
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1 pl-11 pr-2 pb-3">
                          {lectures.map((lecture, lectureIndex) => {
                            const lectureKey = getLectureKey(lecture, lectureIndex);
                            const isActiveLecture = matchesLecture && activeLectureKey === lectureKey;
                            return (
                              <button
                                key={lectureKey}
                                onClick={() => {
                                  setSelectedSectionId(section.id);
                                  setSelectedResource({
                                    sectionId: section.id,
                                    kind: "lecture",
                                    resourceId: lectureKey,
                                  });
                                }}
                                className={`w-full rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition ${
                                  isActiveLecture ? "bg-indigo-100 text-indigo-900" : "text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                <Play className="h-4 w-4" />
                                <span>{lecture.title || `Lecture ${lectureIndex + 1}`}</span>
                              </button>
                            );
                          })}

                          {exercises.map((exercise, index) => {
                            const active =
                              selectedResource?.sectionId === section.id &&
                              selectedResource.kind === "exercise" &&
                              selectedResource.resourceId === exercise.id;
                            return (
                              <button
                                key={exercise.id || `exercise-${index}`}
                                onClick={() => {
                                  setSelectedSectionId(section.id);
                                  setSelectedResource({ sectionId: section.id, kind: "exercise", resourceId: exercise.id });
                                }}
                                className={`w-full rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition ${
                                  active ? "bg-indigo-100 text-indigo-900" : "text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                <Code className="h-4 w-4" />
                                <span>{exercise.title || `Exercise ${index + 1}`}</span>
                              </button>
                            );
                          })}

                          {quizzes.map((quiz, index) => {
                            const active =
                              selectedResource?.sectionId === section.id &&
                              selectedResource.kind === "quiz" &&
                              selectedResource.resourceId === quiz.id;
                            return (
                              <button
                                key={quiz.id || `quiz-${index}`}
                                onClick={() => {
                                  setSelectedSectionId(section.id);
                                  setSelectedResource({ sectionId: section.id, kind: "quiz", resourceId: quiz.id });
                                }}
                                className={`w-full rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition ${
                                  active ? "bg-indigo-100 text-indigo-900" : "text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                <CheckSquare className="h-4 w-4" />
                                <span>{quiz.title || `Quiz ${index + 1}`}</span>
                              </button>
                            );
                          })}

                          {!lectures.length && exercises.length === 0 && quizzes.length === 0 && (
                            <div className="rounded-lg px-3 py-2 text-xs text-gray-500 bg-gray-100/60">
                              Resources coming soon.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}


















