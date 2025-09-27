"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import {
  BookOpen,
  Database,
  BarChart3,
  Brain,
  Code,
  TrendingUp,
  Calculator,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Subject = {
  id: string;
  title: string;
  course_id: string;
  course_title?: string;
  description?: string;
};

const subjectIcons: Record<string, ReactNode> = {
  sql: <Database className="h-5 w-5" />,
  python: <Code className="h-5 w-5" />,
  "data-analysis": <BarChart3 className="h-5 w-5" />,
  statistics: <Calculator className="h-5 w-5" />,
  "machine-learning": <Brain className="h-5 w-5" />,
  "business-intelligence": <TrendingUp className="h-5 w-5" />,
  excel: <BarChart3 className="h-5 w-5" />,
  analytics: <TrendingUp className="h-5 w-5" />,
};

function getSubjectIcon(title: string): ReactNode {
  const key = title.toLowerCase().replace(/\s+/g, "-");
  return subjectIcons[key] || <BookOpen className="h-5 w-5" />;
}

function StepCompletionMessage({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-emerald-200/50 bg-gradient-to-r from-emerald-50 to-green-50 p-6 backdrop-blur-xl shadow-sm">
      <div className="flex items-center justify-center text-center">
        <div className="space-y-2">
          <div className="text-lg font-medium text-emerald-700">{message}</div>
        </div>
      </div>
    </div>
  );
}

export function SubjectsForm() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    void loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const sb = supabaseBrowser();
      const {
        data: { session },
      } = await sb.auth.getSession();
      const token = session?.access_token;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = "Bearer " + token;

      const [availableRes, selectedRes] = await Promise.all([
        fetch("/api/subject-selection/available", { headers }),
        fetch("/api/subject-selection/selected", { headers }),
      ]);

      if (availableRes.ok) {
        const data = await availableRes.json();
        const courses = Array.isArray(data?.courses) ? data.courses : [];
        const subjectsList = Array.isArray(data?.subjects) ? data.subjects : [];
        const courseTitleMap = new Map<string, string>();
        courses.forEach((course: any) => {
          if (course?.id) {
            courseTitleMap.set(course.id, course.title ?? "");
          }
        });

        setSubjects(
          subjectsList.map((subject: any) => {
            const fromCourse = subject?.course_id ? courseTitleMap.get(subject.course_id) : "";
            const courseTitle = subject?.course_title ?? fromCourse ?? "";
            const normalizedTitle = (courseTitle && String(courseTitle).trim().length > 0)
              ? String(courseTitle).trim()
              : "Assigned Course";
            return {
              ...subject,
              course_title: normalizedTitle,
            };
          }),
        );
      } else {
        setSubjects([]);
      }

      if (selectedRes.ok) {
        const selectedData = await selectedRes.json();
        const ids = Array.isArray(selectedData?.selected_subjects)
          ? selectedData.selected_subjects.filter(
              (value: unknown): value is string => typeof value === "string" && value.trim().length > 0,
            )
          : [];
        setSelectedSubjects(new Set(ids));
      } else {
        setSelectedSubjects(new Set());
      }

      setShowCompletion(false);
    } catch (error) {
      console.error("Failed to load subjects:", error);
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
    setShowCompletion(false);
  };

  const handleSubmit = async () => {
    if (selectedSubjects.size === 0 && subjects.length > 0) {
      toast.error("Please select at least one subject");
      return;
    }

    setSubmitting(true);

    try {
      const sb = supabaseBrowser();
      const {
        data: { session },
      } = await sb.auth.getSession();
      const token = session?.access_token;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = "Bearer " + token;

      await fetch("/api/subject-selection/select", {
        method: "POST",
        headers,
        body: JSON.stringify({
          selected_subjects: Array.from(selectedSubjects),
        }),
      });

      toast.success("Subjects saved successfully!");
      setShowCompletion(true);
      setSubmitting(false);

      setTimeout(() => {
        router.replace("/assessment/start?first=1");
      }, 1200);
    } catch (error) {
      console.error("Failed to save subjects:", error);
      toast.error("Failed to save subjects");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-12 backdrop-blur-xl shadow-lg">
        <div className="flex flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading subjects...</h3>
          <p className="text-gray-600">Please wait while we prepare your options</p>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-12 backdrop-blur-xl shadow-lg">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="h-16 w-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            <Sparkles className="h-6 w-6 text-emerald-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Locking in your subjects...</h3>
          <p className="text-gray-600">Personalizing your learning experience</p>
        </div>
      </div>
    );
  }

  const hasSelection = selectedSubjects.size > 0;
  const cardBaseClasses =
    "relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-200 group";
  const iconBaseClasses =
    "flex items-center justify-center rounded-xl h-12 w-12 transition-colors";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => {
          const isSelected = selectedSubjects.has(subject.id);
          const cardAccentClasses = isSelected
            ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
            : "border-white/60 bg-gradient-to-br from-white/80 to-white/60 hover:border-emerald-300 hover:bg-emerald-50/30";
          const iconAccentClasses = isSelected
            ? "bg-emerald-100 text-emerald-600"
            : "bg-gray-100 text-gray-600 group-hover:bg-emerald-100 group-hover:text-emerald-600";

          return (
            <div
              key={subject.id}
              onClick={() => toggleSubject(subject.id)}
              className={[cardBaseClasses, cardAccentClasses].join(" ")}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <CheckCircle className="h-4 w-4" />
                </div>
              )}

              <div className="flex flex-col items-center text-center space-y-3">
                <div className={[iconBaseClasses, iconAccentClasses].join(" ")}>
                  {getSubjectIcon(subject.title)}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{subject.title}</h3>
                  <p className="text-sm text-gray-600">{subject.course_title ?? "Assigned Course"}</p>
                </div>
              </div>
            </div>
          );
        })}

        {subjects.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 p-6 text-center text-sm text-emerald-700">
            No subjects available yet. Once courses are assigned to you, they will appear here.
          </div>
        )}
      </div>

      {subjects.length === 0 && !showCompletion && (
        <div className="rounded-2xl border border-dashed border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
          <div className="flex flex-col gap-4 text-center md:text-left md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-semibold text-gray-900">No subjects assigned yet</div>
              <p className="text-sm text-gray-600">
                We will personalize your assessment automatically once subjects are added to your account.
              </p>
            </div>
            <Button
              onClick={() => router.replace("/assessment/start?first=1")}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-2 text-sm font-medium"
            >
              Continue to Assessment
            </Button>
          </div>
        </div>
      )}

      {showCompletion && (
        <StepCompletionMessage message="Awesome! Subjects locked in. Preparing your personalized assessment..." />
      )}

      {hasSelection && !showCompletion && (
        <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-600">
                  {selectedSubjects.size} Subject{selectedSubjects.size !== 1 ? "s" : ""} Selected
                </div>
                <div className="text-sm text-gray-500">
                  Ready to personalize your upcoming assessment.
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-3 text-base font-medium"
            >
              Continue to Assessment
            </Button>
          </div>
        </div>
      )}

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Select at least one subject to continue. You can always modify your selection later.
        </p>
      </div>
    </div>
  );
}





