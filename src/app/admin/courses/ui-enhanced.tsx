"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  BookOpen, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  PlayCircle,
  FileText,
  Layers,
  ChevronDown,
  ChevronRight,
  BookMarked,
  PenTool,
  HelpCircle,
  Upload
} from "lucide-react";

/* =========================
   Types
   ========================= */
type Id = string;
type Lecture = { id?: Id; title: string; content?: string; duration?: number; order_index?: number; type?: string };
type Quiz = { id: Id; title: string; questions?: Question[]; completed?: boolean; totalQuestions?: number; order_index?: number; deleted?: boolean } | null;
type Practice = { id: Id; title: string; content?: string; deleted?: boolean; difficulty?: "easy" | "medium" | "hard"; order_index?: number };
type Question = {
  id: Id;
  text: string;
  type: "mcq" | "text" | "fill-in-the-blanks" | "coding";
  order_index: number;
  options?: Option[];
  deleted?: boolean;
  content?: string;
  hint?: string;
  explanation?: string;
  correctAnswers?: string[];
  language?: string;
};
type Option = { id: Id; text: string; correct: boolean; deleted?: boolean };
type Section = {
  id: Id;
  title: string;
  lectures?: Lecture[];
  practices?: Practice[];
  quiz?: Quiz;
  quizzes?: (Quiz | null)[];
  deleted?: boolean;
  order_index?: number;
  status?: "draft" | "published" | "archived";
};


type Module = { 
  id: Id; 
  title: string; 
  sections: Section[]; 
  exercises: ModuleExercise[];
  deleted?: boolean; 
  description?: string;
  order_index?: number;
  status?: "draft" | "published" | "archived";
};
type Subject = {
  id: Id;
  title: string;
  modules: Module[];
  created_at?: string;
  updated_at?: string;
  deleted?: boolean;
  description?: string;
  status?: "draft" | "published" | "archived";
};
type Course = { 
  id: Id; 
  title: string; 
  description?: string; 
  status?: "draft" | "published" | "archived";
  enrolled_count?: number;
  created_at?: string;
  updated_at?: string;
  thumbnail?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  duration?: number;
  category?: string;
};
type CourseFull = Course & { subjects: Subject[] };

/* =========================
   Utilities
   ========================= */
function unwrapData<T = unknown>(json: unknown): T {
  return (json && ((json as Record<string, unknown>).data ?? json)) as T;
}

function normalizeCourseFull(input: unknown): CourseFull {
  const c = unwrapData<CourseFull>(input) as Record<string, unknown>;
  return {
    id: c.id,
    title: c.title ?? "",
    description: c.description ?? "",
    status: c.status ?? "draft",
    enrolled_count: c.enrolled_count ?? 0,
    created_at: c.created_at,
    updated_at: c.updated_at,
    thumbnail: c.thumbnail,
    difficulty: c.difficulty ?? "beginner",
    duration: c.duration ?? 0,
    category: c.category ?? "General",
    subjects: Array.isArray(c.subjects) ? c.subjects : [],
  };
}


const lectureTypes = ['text', 'video', 'image', 'audio', 'pdf'] as const;
type LectureContentType = typeof lectureTypes[number];

function parseLectureContent(raw: unknown): {
  body: string;
  type: LectureContentType;
  duration?: number;
  url?: string;
} {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return { body: '', type: 'text' };
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>;
      const maybeType = record.type;
      const type = typeof maybeType === 'string' && lectureTypes.includes(maybeType as LectureContentType)
        ? (maybeType as LectureContentType)
        : 'text';
      const duration = record.duration;
      const url = record.url;
      const bodyValue = record.body ?? record.content;
      return {
        body: typeof bodyValue === 'string' ? bodyValue : raw,
        type,
        duration: typeof duration === 'number' ? duration : undefined,
        url: typeof url === 'string' ? url : undefined,
      };
    }
  } catch (_error) {
    // ignore malformed JSON and fallback to plain text content
  }
  return { body: raw, type: 'text' };
}

function serializeLectureContent(lecture: { content?: unknown; type?: unknown; duration?: unknown; url?: unknown }): string {
  const body = typeof lecture.content === 'string' ? lecture.content : '';
  const typeString = typeof lecture.type === 'string' && lectureTypes.includes(lecture.type as LectureContentType)
    ? (lecture.type as LectureContentType)
    : 'text';
  const duration = typeof lecture.duration === 'number' && Number.isFinite(lecture.duration)
    ? lecture.duration
    : undefined;
  const url = typeof lecture.url === 'string' ? lecture.url : undefined;
  const payload: Record<string, unknown> = {
    version: 1,
    type: typeString,
    body,
  };
  if (duration !== undefined) payload.duration = duration;
  if (url && url.trim() !== '') payload.url = url;
  if (typeString !== 'text' || duration !== undefined || (url && url.trim() !== '')) {
    return JSON.stringify(payload);
  }
  return body;
}

function parsePracticeContent(raw: unknown): {
  description: string;
  instructions: string;
  starterCode: string;
  expectedOutput: string;
  difficulty?: string;
  exerciseType?: string;
  language?: string;
  points?: number;
  timeLimit?: number;
  passingScore?: number;
  maxAttempts?: number;
} {
  const fallback = {
    description: typeof raw === 'string' ? raw : '',
    instructions: typeof raw === 'string' ? raw : '',
    starterCode: '',
    expectedOutput: '',
  };
  if (typeof raw !== 'string' || raw.trim() === '') {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && (parsed as Record<string, unknown>).version === 1) {
      const record = parsed as Record<string, unknown>;
      const pickNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);
      return {
        description: typeof record.instructions === 'string' ? record.instructions : fallback.description,
        instructions: typeof record.instructions === 'string' ? record.instructions : fallback.instructions,
        starterCode: typeof record.starterCode === 'string' ? record.starterCode : fallback.starterCode,
        expectedOutput: typeof record.expectedOutput === 'string' ? record.expectedOutput : fallback.expectedOutput,
        difficulty: typeof record.difficulty === 'string' ? record.difficulty : undefined,
        exerciseType: typeof record.exerciseType === 'string' ? record.exerciseType : undefined,
        language: typeof record.language === 'string' ? record.language : undefined,
        points: pickNumber(record.points),
        timeLimit: pickNumber(record.timeLimit),
        passingScore: pickNumber(record.passingScore),
        maxAttempts: pickNumber(record.maxAttempts),
      };
    }
  } catch (_error) {
    // ignore malformed JSON and fallback to plain text content
  }
  return fallback;
}

const statusColors = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
  published: "bg-green-100 text-green-800 border-green-200", 
  archived: "bg-gray-100 text-gray-800 border-gray-200"
};

const difficultyColors = {
  beginner: "bg-blue-100 text-blue-800 border-blue-200",
  intermediate: "bg-orange-100 text-orange-800 border-orange-200",
  advanced: "bg-red-100 text-red-800 border-red-200"
};

/* =========================
   Main Enhanced Course Manager Component
   ========================= */
export function EnhancedCourseManager({ initialCourses }: { initialCourses: Course[] }) {
  const [courses, setCourses] = useState<Course[]>(initialCourses || []);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(initialCourses || []);
  const [loadingId, setLoadingId] = useState<Id | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Id | null>(null);
  const [full, setFull] = useState<Record<Id, CourseFull>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<Id | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<Id | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  // Stats calculation
  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === "published").length,
    draft: courses.filter(c => c.status === "draft").length,
    enrolled: courses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0)
  };

  // If server-side fetch failed or returned empty, fetch client-side
  useEffect(() => {
    if (!initialCourses || initialCourses.length === 0) {
      (async () => {
        try {
          const res = await fetch('/api/admin/courses', { cache: 'no-store' });
          const json = await res.json().catch(() => ([]));
          if (res.ok) {
            const list = Array.isArray(json) ? json : unwrapData<Course[]>(json);
            setCourses(list);
          }
        } catch {}
      })();
    }
  }, [initialCourses]);

  // Filter courses based on search and filters
  useEffect(() => {
    let filtered = courses;
    
    if (searchQuery) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(course => course.status === statusFilter);
    }
    
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(course => course.difficulty === difficultyFilter);
    }
    
    setFilteredCourses(filtered);
  }, [courses, searchQuery, statusFilter, difficultyFilter]);

  const createCourse = async (courseData: Partial<Course>) => {
    if (!courseData.title?.trim()) return toast.error("Title is required");
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to create course");

      const created = unwrapData<Course>(json);
      setCourses((prev) => [created, ...prev]);
      setShowCreateForm(false);
      toast.success("Course created successfully");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create course");
    }
  };

  const updateCourse = async (courseId: Id, courseData: Partial<Course>) => {
    if (!courseData.title?.trim()) return toast.error("Title is required");
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to update course");

      const updated = unwrapData<Course>(json);
      setCourses((prev) => prev.map(c => c.id === courseId ? updated : c));
      setFull((prev) => ({ ...prev, [courseId]: { ...prev[courseId], ...updated } }));
      setShowEditCourseModal(false);
      toast.success("Course updated successfully");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update course");
    }
  };

  const deleteCourse = async (courseId: Id) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Failed to delete course");
      }

      setCourses((prev) => prev.filter(c => c.id !== courseId));
      setFull((prev) => {
        const updated = { ...prev };
        delete updated[courseId];
        return updated;
      });
      if (selectedCourse === courseId) {
        setSelectedCourse(null);
      }
      toast.success("Course deleted successfully");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete course");
    }
  };

  const publishCourse = async (courseId: Id) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const isPublished = course.status === "published";
    const action = isPublished ? "unpublish" : "publish";
    const newStatus = isPublished ? "draft" : "published";
    
    if (!confirm(`Are you sure you want to ${action} this course?`)) return;
    
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Failed to ${action} course`);

      const updated = unwrapData<Course>(json);
      setCourses((prev) => prev.map(c => c.id === courseId ? updated : c));
      setFull((prev) => ({ ...prev, [courseId]: { ...prev[courseId], ...updated } }));
      toast.success(`Course ${action}ed successfully`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : `Failed to ${action} course`);
    }
  };

  const handleDeleteModuleExercise = async (exerciseId: Id) => {
    if (!confirm("Are you sure you want to delete this exercise? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/module-exercises/${exerciseId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Failed to delete exercise");
      }

      // Reload the course data
      if (selectedCourse) {
        await loadCourse(selectedCourse, true);
      }
      
      toast.success("Exercise deleted successfully");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete exercise");
    }
  };

  const loadCourse = async (id: Id, force: boolean = false): Promise<CourseFull | undefined> => {
    if (!force && full[id]) return full[id];
    
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/courses/${id}/full`, { cache: 'no-store' });
      if (!res.ok) {
        // Fallback to mock data if API fails
        const mockCourse: CourseFull = {
          ...courses.find(c => c.id === id)!,
          subjects: [
            {
              id: 'sub1',
              title: 'Introduction to Data Analytics',
              description: 'Fundamentals of data analytics and visualization',
              status: 'published',
              modules: [
                {
                  id: 'mod1',
                  title: 'Getting Started with Data',
                  description: 'Basic concepts of data analysis',
                  status: 'published',
                  sections: [
                    {
                      id: 'sec1',
                      title: 'What is Data Analytics?',
                      lecture: { title: 'Introduction Lecture', content: 'Welcome to data analytics...', duration: 30 },
                      practices: [
                        { id: 'prac1', title: 'Basic Data Exercise', content: 'Practice with sample data', difficulty: 'easy' }
                      ],
                      quiz: { id: 'quiz1', title: 'Introduction Quiz', totalQuestions: 5 }
                    }
                  ]
                }
              ]
            }
          ]
        };
        setFull((f) => ({ ...f, [id]: mockCourse }));
        return mockCourse;
      }

      const json = await res.json().catch(() => ({}));
      const courseData = normalizeCourseFull(json);
      setFull((f) => ({ ...f, [id]: courseData }));
      return courseData;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load course");
      // Fallback to mock data
      const mockCourse: CourseFull = {
        ...courses.find(c => c.id === id)!,
        subjects: []
      };
      setFull((f) => ({ ...f, [id]: mockCourse }));
      return mockCourse;
    } finally {
      setLoadingId(null);
    }
  };

  const selectCourse = (courseId: Id) => {
    setSelectedCourse(selectedCourse === courseId ? null : courseId);
    if (selectedCourse !== courseId) {
      loadCourse(courseId);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="mx-auto max-w-7xl p-6 space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--brand))]/10 via-transparent to-[hsl(var(--brand-accent))]/10" />
          <div className="relative p-8">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))] shadow-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Course Management
                    </h1>
                    <p className="text-gray-600">Complete operations for courses, subjects, modules & sections</p>
                  </div>
                </div>
                <p className="text-gray-600 max-w-2xl">
                  Create, edit, delete, and manage your educational content with full control over courses, subjects, modules, sections, quizzes, exercises, and lectures.
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="rounded-xl"
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                >
                  {viewMode === "grid" ? <List className="h-4 w-4 mr-2" /> : <Grid className="h-4 w-4 mr-2" />}
                  {viewMode === "grid" ? "List View" : "Grid View"}
                </Button>
                <Button 
                  className="rounded-xl bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))] hover:opacity-90"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative overflow-hidden rounded-xl border border-white/20 bg-white/80 backdrop-blur-xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-white/20 bg-white/80 backdrop-blur-xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Published</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-white/20 bg-white/80 backdrop-blur-xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Draft</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-white/20 bg-white/80 backdrop-blur-xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Enrolled</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.enrolled}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-xl border border-white/20 bg-white/80 backdrop-blur-xl p-6 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[hsl(var(--brand))] focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[hsl(var(--brand))] focus:outline-none"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Courses List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Courses ({filteredCourses.length})</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {filteredCourses.map((course) => (
                <EnhancedCourseCard 
                  key={course.id}
                  course={course} 
                  onClick={() => selectCourse(course.id)}
                  onEdit={() => {
                    setSelectedCourse(course.id);
                    setShowEditCourseModal(true);
                  }}
                  onDelete={() => deleteCourse(course.id)}
                  onPublish={() => publishCourse(course.id)}
                  isSelected={selectedCourse === course.id}
                  isLoading={loadingId === course.id}
                />
              ))}
              {filteredCourses.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No courses found</p>
                </div>
              )}
            </div>
          </div>

          {/* Course Details Panel */}
          <div className="space-y-6">
            {selectedCourse && full[selectedCourse] ? (
              <EnhancedCourseDetailsPanel 
                course={full[selectedCourse]}
                onAddSubject={() => setShowSubjectModal(true)}
                onAddModule={(subjectId) => {
                  setSelectedSubjectId(subjectId);
                  setShowModuleModal(true);
                }}
                onAddSection={(moduleId) => {
                  setSelectedModuleId(moduleId);
                  setEditingSection(null);
                  setShowSectionModal(true);
                }}
                onEditSection={async (moduleId, section) => {
                  setSelectedModuleId(moduleId);
                  // Refresh course to ensure we have latest quiz questions/options
                  if (selectedCourse) {
                    const refreshedCourse = await loadCourse(selectedCourse, true);
                    const refreshedSection = refreshedCourse?.subjects
                      ?.flatMap(s => s.modules)
                      ?.find(m => m.id === moduleId)
                      ?.sections?.find(sec => sec.id === section.id) || section;
                    setEditingSection(refreshedSection as Section);
                  } else {
                    setEditingSection(section);
                  }
                  setShowSectionModal(true);
                }}
                onEditCourse={() => setShowEditCourseModal(true)}
                onDeleteCourse={() => deleteCourse(selectedCourse)}
                onPublish={() => publishCourse(selectedCourse)}
              />
            ) : (
              <div className="rounded-xl border border-white/20 bg-white/80 backdrop-blur-xl p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Details</h3>
                <p className="text-gray-600">Select a course to view and edit its content structure</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateForm && (
        <CourseModal 
          title="Create New Course"
          onClose={() => setShowCreateForm(false)}
          onSubmit={createCourse}
        />
      )}

      {showEditCourseModal && selectedCourse && (
        <CourseModal 
          title="Edit Course"
          course={courses.find(c => c.id === selectedCourse) || full[selectedCourse]}
          onClose={() => setShowEditCourseModal(false)}
          onSubmit={(data) => updateCourse(selectedCourse, data)}
        />
      )}
      
      {showSubjectModal && selectedCourse && (
        <SubjectModal 
          title="Add Subject"
          onClose={() => setShowSubjectModal(false)}
          onSubmit={async (data) => {
            try {
              const res = await fetch(`/api/admin/courses/${selectedCourse}/subjects`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: data.title,
                  description: data.description,
                  status: data.status
                }),
              });
              
              const json = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(json?.error || "Failed to add subject");

              // Reload the course data without collapsing the panel
              await loadCourse(selectedCourse, true);
              
              setShowSubjectModal(false);
              toast.success("Subject added successfully");
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Failed to add subject");
            }
          }}
        />
      )}

      {showModuleModal && selectedCourse && selectedSubjectId && (
        <ModuleModal 
          title="Add Module"
          onClose={() => setShowModuleModal(false)}
          onSubmit={async (data) => {
            try {
              const res = await fetch(`/api/admin/subjects/${selectedSubjectId}/modules`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: data.title,
                  description: data.description,
                  status: data.status
                }),
              });
              
              const json = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(json?.error || "Failed to add module");

              // Reload the course data without collapsing the panel
              await loadCourse(selectedCourse, true);
              
              setShowModuleModal(false);
              toast.success("Module added successfully");
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Failed to add module");
            }
          }}
        />
      )}

      {showSectionModal && selectedCourse && selectedModuleId && (
        <SectionModal 
          title={editingSection ? "Edit Section" : "Add Section"}
          section={editingSection || undefined}
          onClose={() => { setShowSectionModal(false); setEditingSection(null); }}
          onSubmit={async (data) => {
            try {
              let targetSectionId: string | null = editingSection?.id || null;
              if (!editingSection) {
                const res = await fetch(`/api/admin/modules/${selectedModuleId}/sections`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: data.title,
                    status: data.status
                  }),
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(json?.error || "Failed to add section");
                const newSection = unwrapData(json);
                targetSectionId = newSection?.id;
              } else {
                // Update existing section metadata
                const res = await fetch(`/api/admin/sections/${editingSection.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: data.title,
                    status: data.status
                  }),
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(json?.error || "Failed to update section");
                targetSectionId = editingSection.id;
              }

              if (!targetSectionId) {
                throw new Error("Missing section identifier");
              }

              // Handle lectures (create/update/delete)
              const submittedLecturesRaw = Array.isArray(data.lectures) ? data.lectures : [];
              const allLectureEntries = submittedLecturesRaw.length === 0 && data.lecture
                ? [data.lecture]
                : submittedLecturesRaw;
              const normalizedLectures = allLectureEntries
                .filter((lecture: any) => (lecture?.title || '').trim() !== '')
                .map((lecture: any, idx: number) => ({
                  id: typeof lecture.id === 'string' ? lecture.id : undefined,
                  title: lecture.title ?? '',
                  order: typeof lecture.order_index === 'number' ? lecture.order_index : idx + 1,
                  content: serializeLectureContent(lecture),
                }));
              const existingLectures = editingSection?.lectures ?? [];
              const existingLectureMap = new Map(existingLectures.map((lecture: any) => [lecture.id, lecture]));
              const lectureIds = new Set(
                normalizedLectures
                  .map((lecture) => lecture.id)
                  .filter((id): id is string => typeof id === 'string'),
              );
              const lecturesToDelete = existingLectures.filter((lecture: any) => !lectureIds.has(lecture.id));
              const lecturesToUpdate = normalizedLectures.filter(
                (lecture) => lecture.id && existingLectureMap.has(lecture.id),
              );
              const lecturesToCreate = normalizedLectures.filter(
                (lecture) => !lecture.id || !existingLectureMap.has(lecture.id),
              );

              if (lecturesToCreate.length > 0) {
                const createRes = await fetch(`/api/admin/modules/sections/${targetSectionId}/lectures`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    lectures: lecturesToCreate.map((lecture) => ({
                      title: lecture.title,
                      content: lecture.content,
                      order: lecture.order,
                    })),
                  }),
                });
                if (!createRes.ok) {
                  console.warn('Failed to create lectures for section');
                }
              }

              for (const lecture of lecturesToUpdate) {
                const updateRes = await fetch(`/api/admin/lectures/${lecture.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: lecture.title,
                    content: lecture.content,
                    order: lecture.order,
                  }),
                });
                if (!updateRes.ok) {
                  console.warn('Failed to update lecture', lecture.id);
                }
              }

              for (const lecture of lecturesToDelete) {
                try {
                  const deleteRes = await fetch(`/api/admin/lectures/${lecture.id}`, { method: 'DELETE' });
                  if (!deleteRes.ok) {
                    console.warn('Failed to delete lecture', lecture.id);
                  }
                } catch (lectureDeleteError) {
                  console.warn('Failed to delete lecture', lecture.id, lectureDeleteError);
                }
              }

              // Handle practice exercises
              const submittedPractices = Array.isArray(data.practices) ? data.practices : [];
              const normalizedPractices = submittedPractices
                .filter((practice: any) => (practice?.title || '').trim() !== '')
                .map((practice: any, idx: number) => ({
                  id: typeof practice.id === 'string' ? practice.id : undefined,
                  order: typeof practice.order_index === 'number' ? practice.order_index : idx + 1,
                  payload: {
                    title: practice.title,
                    instructions: practice.instructions || practice.content || practice.description || '',
                    exerciseType: practice.type,
                    starterCode: practice.starterCode,
                    expectedOutput: practice.expectedOutput,
                    difficulty: practice.difficulty,
                    language: practice.language,
                    points: practice.points,
                    timeLimit: practice.timeLimit,
                    passingScore: practice.passingScore,
                    maxAttempts: practice.maxAttempts,
                  },
                }));
              const existingPractices = editingSection?.practices ?? [];
              const existingPracticeMap = new Map(existingPractices.map((practice: any) => [practice.id, practice]));
              const practiceIds = new Set(
                normalizedPractices
                  .map((practice) => practice.id)
                  .filter((id): id is string => typeof id === 'string'),
              );
              const practicesToDelete = existingPractices.filter((practice: any) => !practiceIds.has(practice.id));
              const practicesToUpdate = normalizedPractices.filter(
                (practice) => practice.id && existingPracticeMap.has(practice.id),
              );
              const practicesToCreate = normalizedPractices.filter(
                (practice) => !practice.id || !existingPracticeMap.has(practice.id),
              );

              for (const practice of practicesToCreate) {
                const instructions =
                  typeof practice.payload.instructions === 'string' && practice.payload.instructions.trim() !== ''
                    ? practice.payload.instructions
                    : practice.payload.title;
                const exerciseTypeValue = (() => {
                  if (typeof practice.payload.exerciseType === 'string' && practice.payload.exerciseType.trim() !== '') {
                    const value = practice.payload.exerciseType.trim().toLowerCase();
                    return value === 'practical' ? 'coding' : value;
                  }
                  return 'coding';
                })();
                const createRes = await fetch(`/api/admin/sections/${targetSectionId}/practice-exercises`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: practice.payload.title,
                    order: practice.order,
                    instructions,
                    exerciseType: exerciseTypeValue,
                    starterCode: practice.payload.starterCode,
                    expectedOutput: practice.payload.expectedOutput,
                    difficulty: practice.payload.difficulty,
                    language: practice.payload.language ?? 'python',
                    points: practice.payload.points,
                    timeLimit: practice.payload.timeLimit,
                    passingScore: practice.payload.passingScore,
                    maxAttempts: practice.payload.maxAttempts,
                  }),
                });
                if (!createRes.ok) {
                  const errorText = await createRes.text();
                  throw new Error(`Failed to add practice exercise "${practice.payload.title}": ${errorText}`);
                }
              }

              for (const practice of practicesToUpdate) {
                const instructions =
                  typeof practice.payload.instructions === 'string' && practice.payload.instructions.trim() !== ''
                    ? practice.payload.instructions
                    : practice.payload.title;
                const exerciseTypeValue = (() => {
                  if (typeof practice.payload.exerciseType === 'string' && practice.payload.exerciseType.trim() !== '') {
                    const value = practice.payload.exerciseType.trim().toLowerCase();
                    return value === 'practical' ? 'coding' : value;
                  }
                  return 'coding';
                })();
                const updateRes = await fetch(`/api/admin/practice-exercises/${practice.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: practice.payload.title,
                    order: practice.order,
                    instructions,
                    exerciseType: exerciseTypeValue,
                    starterCode: practice.payload.starterCode,
                    expectedOutput: practice.payload.expectedOutput,
                    difficulty: practice.payload.difficulty,
                    language: practice.payload.language ?? 'python',
                    points: practice.payload.points,
                    timeLimit: practice.payload.timeLimit,
                    passingScore: practice.payload.passingScore,
                    maxAttempts: practice.payload.maxAttempts,
                  }),
                });
                if (!updateRes.ok) {
                  const errorText = await updateRes.text();
                  throw new Error(`Failed to update practice exercise "${practice.payload.title}": ${errorText}`);
                }
              }
              for (const practice of practicesToDelete) {
                try {
                  const deleteRes = await fetch(`/api/admin/practice-exercises/${practice.id}`, { method: 'DELETE' });
                  if (!deleteRes.ok) {
                    const errorText = await deleteRes.text();
                    throw new Error(`Failed to delete practice exercise: ${errorText}`);
                  }
                } catch (practiceDeleteError) {
                  throw new Error(`Failed to delete practice exercise: ${practiceDeleteError.message}`);
                }
              }

              // Handle quiz creation/update/removal
              const quizData = data.quiz;
              const existingQuiz = editingSection?.quiz;
              const submittedQuestions = Array.isArray(quizData?.questions) ? quizData.questions : [];

              let quizId: string | null = existingQuiz?.id ?? null;

              if (quizData && submittedQuestions.length > 0) {
                const quizTitle = (quizData as { title?: string }).title ?? existingQuiz?.title ?? 'Quiz';
                if (quizId) {
                  const quizUpdateRes = await fetch(`/api/admin/quizzes/${quizId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: quizTitle }),
                  });
                  if (!quizUpdateRes.ok) {
                    console.warn('Failed to update quiz title');
                  }
                } else {
                  const quizRes = await fetch(`/api/admin/sections/${targetSectionId}/quiz`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: quizTitle }),
                  });
                  if (quizRes.ok) {
                    const quizJson = await quizRes.json().catch(() => ({}));
                    const createdQuiz: Record<string, unknown> = unwrapData(quizJson);
                    quizId =
                      (createdQuiz?.id as string) ||
                      ((createdQuiz?.quiz as Record<string, unknown>)?.id as string) ||
                      null;
                  } else {
                    console.warn('Failed to add quiz to section');
                  }
                }

                if (quizId) {
                  const existingQuestions = Array.isArray(existingQuiz?.questions) ? existingQuiz.questions : [];
                  const existingQuestionMap = new Map(existingQuestions.map((question: any) => [question.id, question]));
                  const normalizedQuestions = submittedQuestions
                    .filter((question: any) => (question?.text || '').trim() !== '')
                    .map((question: any, index: number) => ({
                      id: typeof question.id === 'string' ? question.id : undefined,
                      text: question.text ?? '',
                      type: question.type ?? 'mcq',
                      order: typeof question.order_index === 'number' ? question.order_index : index + 1,
                      options: Array.isArray(question.options)
                        ? question.options.map((option: any) => ({
                            id: typeof option.id === 'string' ? option.id : undefined,
                            text: option.text ?? '',
                            correct: !!option.correct,
                          }))
                        : [],
                    }));

                  const questionIds = new Set(
                    normalizedQuestions
                      .map((question) => question.id)
                      .filter((id): id is string => typeof id === 'string'),
                  );
                  const questionsToDelete = existingQuestions.filter((question: any) => !questionIds.has(question.id));
                  const questionsToUpdate = normalizedQuestions.filter(
                    (question) => question.id && existingQuestionMap.has(question.id),
                  );
                  const questionsToCreate = normalizedQuestions.filter(
                    (question) => !question.id || !existingQuestionMap.has(question.id),
                  );

                  for (const question of questionsToDelete) {
                    try {
                      const deleteRes = await fetch(`/api/admin/questions/${question.id}`, { method: 'DELETE' });
                      if (!deleteRes.ok) {
                        console.warn('Failed to delete quiz question', question.id);
                      }
                    } catch (questionDeleteError) {
                      console.warn('Failed to delete quiz question', question.id, questionDeleteError);
                    }
                  }

                  const upsertQuestion = async (question: typeof questionsToCreate[number], existing?: any) => {
                    let questionId: string | null = existing?.id ?? null;

                    if (existing?.id) {
                      const updateRes = await fetch(`/api/admin/questions/${existing.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          text: question.text,
                          type: question.type,
                          order: question.order,
                        }),
                      });
                      if (!updateRes.ok) {
                        console.warn('Failed to update quiz question', existing.id);
                      } else {
                        questionId = existing.id;
                      }
                    } else {
                      const createRes = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          text: question.text,
                          type: question.type,
                          order: question.order,
                        }),
                      });
                      if (!createRes.ok) {
                        console.warn('Failed to create quiz question');
                        return;
                      }
                      const qJson = await createRes.json().catch(() => ({}));
                      const createdQuestion: Record<string, unknown> = unwrapData(qJson);
                      questionId =
                        (createdQuestion?.id as string) ||
                        ((createdQuestion?.question as Record<string, unknown>)?.id as string) ||
                        null;
                    }

                    if (!questionId) return;

                    const existingOptions = Array.isArray(existing?.options) ? existing.options : [];
                    const existingOptionMap = new Map(existingOptions.map((option: any) => [option.id, option]));
                    const optionIds = new Set(
                      question.options
                        .map((option) => option.id)
                        .filter((id): id is string => typeof id === 'string'),
                    );
                    const optionsToDelete = existingOptions.filter((option: any) => !optionIds.has(option.id));

                    if (question.type !== 'mcq') {
                      for (const option of existingOptions) {
                        try {
                          const deleteOptionRes = await fetch(`/api/admin/options/${option.id}`, { method: 'DELETE' });
                          if (!deleteOptionRes.ok) {
                            console.warn('Failed to delete quiz option', option.id);
                          }
                        } catch (optionDeleteError) {
                          console.warn('Failed to delete quiz option', option.id, optionDeleteError);
                        }
                      }
                      return;
                    }

                    for (const option of optionsToDelete) {
                      try {
                        const deleteOptionRes = await fetch(`/api/admin/options/${option.id}`, { method: 'DELETE' });
                        if (!deleteOptionRes.ok) {
                          console.warn('Failed to delete quiz option', option.id);
                        }
                      } catch (optionDeleteError) {
                        console.warn('Failed to delete quiz option', option.id, optionDeleteError);
                      }
                    }

                    for (const option of question.options) {
                      if (!option.text || option.text.trim() === '') continue;
                      if (option.id && existingOptionMap.has(option.id)) {
                        const updateOptionRes = await fetch(`/api/admin/options/${option.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text: option.text, correct: !!option.correct }),
                        });
                        if (!updateOptionRes.ok) {
                          console.warn('Failed to update option', option.id);
                        }
                      } else {
                        const createOptionRes = await fetch(`/api/admin/quizzes/questions/${questionId}/options`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ text: option.text, correct: !!option.correct }),
                        });
                        if (!createOptionRes.ok) {
                          console.warn('Failed to add option to question');
                        }
                      }
                    }
                  };

                  for (const question of questionsToUpdate) {
                    await upsertQuestion(question, existingQuestionMap.get(question.id));
                  }

                  for (const question of questionsToCreate) {
                    await upsertQuestion(question);
                  }
                }
              } else if (existingQuiz?.id) {
                try {
                  const deleteQuizRes = await fetch(`/api/admin/quizzes/${existingQuiz.id}`, { method: 'DELETE' });
                  if (!deleteQuizRes.ok) {
                    console.warn('Failed to delete quiz', existingQuiz.id);
                  }
                } catch (quizDeleteError) {
                  console.warn('Failed to delete quiz', existingQuiz.id, quizDeleteError);
                }
              }

              // Reload the course data without collapsing the panel
              await loadCourse(selectedCourse, true);
              
              setShowSectionModal(false);
              setEditingSection(null);
              toast.success(editingSection ? "Section updated successfully" : "Section added successfully");
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Failed to save section");
            }
          }}
        />
      )}
    </div>
  );
}

/* =========================
   Enhanced Course Card Component
   ========================= */
function EnhancedCourseCard({ 
  course, 
  onClick, 
  onEdit,
  onDelete,
  onPublish,
  isSelected, 
  isLoading 
}: { 
  course: Course; 
  onClick: () => void; 
  onEdit: () => void;
  onDelete: () => void;
  onPublish: () => void;
  isSelected: boolean;
  isLoading: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div 
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
        isSelected 
          ? 'border-[hsl(var(--brand))]/50 bg-gradient-to-br from-[hsl(var(--brand))]/5 to-[hsl(var(--brand-accent))]/5 shadow-lg' 
          : 'border-white/20 bg-white/80 backdrop-blur-xl'
      }`}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[hsl(var(--brand))]"></div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[hsl(var(--brand))] transition-colors">
              {course.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {course.description || "No description available"}
            </p>
          </div>
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPublish();
                    setShowMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                    course.status === "published" ? "text-orange-600" : "text-green-600"
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  {course.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[course.status || 'draft']}`}>
            {course.status || 'draft'}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${difficultyColors[course.difficulty || 'beginner']}`}>
            {course.difficulty || 'beginner'}
          </span>
          {course.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
              {course.category}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.enrolled_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration || 0}m</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {course.created_at ? new Date(course.created_at).toLocaleDateString() : 'Recently'}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Enhanced Course Details Panel Component
   ========================= */
function EnhancedCourseDetailsPanel({ 
  course, 
  onAddSubject,
  onAddModule,
  onAddSection,
  onEditSection,
  onEditCourse,
  onDeleteCourse,
  onPublish
}: { 
  course: CourseFull; 
  onAddSubject: () => void; 
  onAddModule: (subjectId: string) => void;
  onAddSection: (moduleId: string) => void;
  onEditSection: (moduleId: string, section: Section) => void;
  onEditCourse: () => void;
  onDeleteCourse: () => void;
  onPublish: () => void;
}) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Course Info */}
      <div className="rounded-xl border border-white/20 bg-white/80 backdrop-blur-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
            <p className="text-gray-600 mb-4">{course.description}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-lg" onClick={onEditCourse}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="rounded-lg">
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className={`rounded-lg ${
                course.status === "published" 
                  ? "text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300" 
                  : "text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
              }`}
              onClick={onPublish}
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="rounded-lg text-red-600 hover:text-red-700" onClick={onDeleteCourse}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-gray-50">
            <div className="text-2xl font-bold text-gray-900">{course.subjects.length}</div>
            <div className="text-sm text-gray-600">Subjects</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-50">
            <div className="text-2xl font-bold text-gray-900">
              {course.subjects.reduce((sum, s) => sum + s.modules.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Modules</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-50">
            <div className="text-2xl font-bold text-gray-900">
              {course.subjects.reduce((sum, s) => sum + s.modules.reduce((mSum, m) => mSum + m.sections.length, 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Sections</div>
          </div>
        </div>

        <Button 
          onClick={onAddSubject}
          className="w-full rounded-lg bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))] hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </div>

      {/* Course Structure - Enhanced with CRUD operations */}
      <div className="rounded-xl border border-white/20 bg-white/80 backdrop-blur-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Course Structure</h4>
        <div className="space-y-3">
          {course.subjects.map((subject) => (
            <div key={subject.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
              <div className="p-3 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpanded(subject.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedItems[subject.id] ? (
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                    <BookMarked className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900">{subject.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{subject.modules.length} modules</span>
                    <button 
                      className="p-1 hover:bg-gray-200 rounded"
                      onClick={() => onAddModule(subject.id)}
                      title="Add Module"
                    >
                      <Plus className="h-3 w-3 text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Edit className="h-3 w-3 text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
              
              {expandedItems[subject.id] && (
                <div className="p-3 space-y-2">
                  {subject.modules.map((module) => (
                    <div key={module.id} className="border border-gray-100 rounded-lg bg-gray-50/50 overflow-hidden">
                      <div className="p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpanded(module.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {expandedItems[module.id] ? (
                                <ChevronDown className="h-3 w-3 text-gray-600" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-gray-600" />
                              )}
                            </button>
                            <Layers className="h-3 w-3 text-green-600" />
                            <span className="text-sm font-medium text-gray-800">{module.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {module.sections.length} sections
                            </span>
                            <button 
                              className="p-1 hover:bg-gray-200 rounded"
                              onClick={() => onAddSection(module.id)}
                              title="Add Section"
                            >
                              <Plus className="h-3 w-3 text-gray-400" />
                            </button>
                            <button className="p-1 hover:bg-gray-200 rounded">
                              <Edit className="h-3 w-3 text-gray-400" />
                            </button>
                            <button className="p-1 hover:bg-gray-200 rounded">
                              <Trash2 className="h-3 w-3 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {expandedItems[module.id] && (
                        <div className="px-4 pb-2 space-y-1">
                          
                          {/* Sections */}
                          {module.sections.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-1 px-2">Sections</div>
                              {module.sections.map((section) => {
                                const lectures = Array.isArray(section.lectures) ? section.lectures : [];
                                const practices = Array.isArray(section.practices) ? section.practices : [];
                                const quizSource = Array.isArray((section as any).quizzes)
                                  ? (section as any).quizzes
                                  : section.quiz
                                    ? [section.quiz]
                                    : [];
                                const quizzes = quizSource.filter(Boolean);

                                return (
                                  <div key={section.id} className="bg-white rounded border border-gray-100">
                                    <div className="flex items-start justify-between p-2">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => toggleExpanded(section.id)}
                                          className="p-1 hover:bg-gray-200 rounded"
                                        >
                                          {expandedItems[section.id] ? (
                                            <ChevronDown className="h-3 w-3 text-gray-600" />
                                          ) : (
                                            <ChevronRight className="h-3 w-3 text-gray-600" />
                                          )}
                                        </button>
                                        <FileText className="h-3 w-3 text-purple-600" />
                                        <div>
                                          <span className="text-sm font-medium text-gray-700">{section.title}</span>
                                          {section.status && (
                                            <div className="text-[10px] uppercase text-gray-400">{section.status}</div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                          <PlayCircle className="h-3 w-3" />
                                          <span>{lectures.length}</span>
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded">
                                          <PenTool className="h-3 w-3" />
                                          <span>{practices.length}</span>
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded">
                                          <HelpCircle className="h-3 w-3" />
                                          <span>{quizzes.length}</span>
                                        </div>
                                        <button
                                          className="p-1 hover:bg-gray-200 rounded"
                                          onClick={() => onEditSection(module.id, section)}
                                          title="Edit Section"
                                        >
                                          <Edit className="h-3 w-3 text-gray-400" />
                                        </button>
                                        <button className="p-1 hover:bg-gray-200 rounded">
                                          <Trash2 className="h-3 w-3 text-red-400" />
                                        </button>
                                      </div>
                                    </div>

                                    {expandedItems[section.id] && (
                                      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 space-y-4">
                                        <div>
                                          <div className="font-semibold text-gray-600 mb-2">Lectures</div>
                                          {lectures.length > 0 ? (
                                            <div className="space-y-2">
                                              {lectures.map((lecture, lectureIndex) => (
                                                <div
                                                  key={lecture?.id || `${section.id}-lecture-${lectureIndex}`}
                                                  className="flex items-start gap-2 rounded-lg bg-white p-2"
                                                >
                                                  <PlayCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                                                  <div className="space-y-1">
                                                    <div className="font-medium text-gray-800">
                                                      {lecture?.title || `Lecture ${lectureIndex + 1}`}
                                                    </div>
                                                    {lecture?.content && (
                                                      <div className="text-xs text-gray-500 line-clamp-3">
                                                        {lecture.content}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-xs text-gray-500">No lectures added yet.</div>
                                          )}
                                        </div>

                                        <div>
                                          <div className="font-semibold text-gray-600 mb-2">Exercises</div>
                                          {practices.length > 0 ? (
                                            <div className="space-y-2">
                                              {practices.map((practice, practiceIndex) => (
                                                <div
                                                  key={practice?.id || `${section.id}-exercise-${practiceIndex}`}
                                                  className="flex items-start gap-2 rounded-lg bg-white p-2"
                                                >
                                                  <PenTool className="h-4 w-4 text-green-500 mt-0.5" />
                                                  <div>
                                                    <div className="font-medium text-gray-800">
                                                      {practice?.title || `Exercise ${practiceIndex + 1}`}
                                                    </div>
                                                    {practice?.content && (
                                                      <div className="text-xs text-gray-500 line-clamp-3">
                                                        {practice.content}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-xs text-gray-500">No exercises added yet.</div>
                                          )}
                                        </div>

                                        <div>
                                          <div className="font-semibold text-gray-600 mb-2">Quizzes</div>
                                          {quizzes.length > 0 ? (
                                            <div className="space-y-2">
                                              {quizzes.map((quiz, quizIndex) => (
                                                <div
                                                  key={(quiz as any)?.id || `${section.id}-quiz-${quizIndex}`}
                                                  className="flex items-start gap-2 rounded-lg bg-white p-2"
                                                >
                                                  <HelpCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                                                  <div>
                                                    <div className="font-medium text-gray-800">
                                                      {(quiz as any)?.title || `Quiz ${quizIndex + 1}`}
                                                    </div>
                                                    {Array.isArray((quiz as any)?.questions) && (
                                                      <div className="text-xs text-gray-500">
                                                        {(quiz as any).questions.length} question{(quiz as any).questions.length === 1 ? '' : 's'}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-xs text-gray-500">No quizzes added yet.</div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {course.subjects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No subjects added yet. Click &quot;Add Subject&quot; to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Course Modal Component
   ========================= */
function CourseModal({ 
  title,
  course,
  onClose, 
  onSubmit 
}: { 
  title: string;
  course?: Partial<Course>;
  onClose: () => void; 
  onSubmit: (data: Partial<Course>) => void; 
}) {
  const [formData, setFormData] = useState({
    title: course?.title || "",
    description: course?.description || "",
    category: course?.category || "General",
    difficulty: (course?.difficulty as "beginner" | "intermediate" | "advanced") || "beginner",
    status: (course?.status as "draft" | "published" | "archived") || "draft"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter course title..."
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what students will learn in this course..."
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as "beginner" | "intermediate" | "advanced" }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 rounded-xl bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))] hover:opacity-90"
              >
                {course ? 'Update Course' : 'Create Course'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Subject Modal Component
   ========================= */
function SubjectModal({ 
  title,
  subject,
  onClose, 
  onSubmit 
}: { 
  title: string;
  subject?: Partial<Subject>;
  onClose: () => void; 
  onSubmit: (data: Partial<Subject>) => void; 
}) {
  const [formData, setFormData] = useState({
    title: subject?.title || "",
    description: subject?.description || "",
    status: (subject?.status as "draft" | "published" | "archived") || "draft"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="subject-title">Subject Title</Label>
              <Input
                id="subject-title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter subject title..."
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="subject-description">Description</Label>
              <textarea
                id="subject-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this subject..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 resize-none"
              />
            </div>

            <div>
              <Label htmlFor="subject-status">Status</Label>
              <select
                id="subject-status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as "draft" | "published" | "archived" }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 rounded-xl bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))] hover:opacity-90"
              >
                {subject ? 'Update Subject' : 'Add Subject'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Module Modal Component
   ========================= */
function ModuleModal({ 
  title,
  module,
  onClose, 
  onSubmit 
}: { 
  title: string;
  module?: Partial<Module>;
  onClose: () => void; 
  onSubmit: (data: Partial<Module>) => void; 
}) {
  const [formData, setFormData] = useState({
    title: module?.title || "",
    description: module?.description || "",
    status: (module?.status as "draft" | "published" | "archived") || "draft"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="module-title">Module Title</Label>
              <Input
                id="module-title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter module title..."
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="module-description">Description</Label>
              <textarea
                id="module-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this module..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 resize-none"
              />
            </div>

            <div>
              <Label htmlFor="module-status">Status</Label>
              <select
                id="module-status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as "draft" | "published" | "archived" }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 rounded-xl bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))] hover:opacity-90"
              >
                {module ? 'Update Module' : 'Add Module'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Section Modal Component
   ========================= */
function SectionModal({ 
  title,
  section,
  onClose, 
  onSubmit 
}: { 
  title: string;
  section?: Partial<Section>;
  onClose: () => void; 
  onSubmit: (data: Partial<Section>) => void; 
}) {
  type QuizQuestionForm = {
    id: string;
    type: "mcq" | "fill-in-the-blanks" | "coding" | "text";
    text: string;
    hint?: string;
    explanation?: string;
    options: { id: string; text: string; correct: boolean }[];
    correctAnswers: string[];
    language?: string;
    codeTemplate?: string;
  };

  type ExerciseForm = {
    id: string;
    title: string;
    content: string;
    description?: string;
    instructions?: string;
    difficulty: "easy" | "medium" | "hard";
    type: "practice" | "assignment" | "lab" | "project" | "practical" | "coding";
    timeLimit?: number;
    passingScore?: number;
    maxAttempts?: number;
    points?: number;
    starterCode?: string;
    expectedOutput?: string;
    language?: string;
    order_index?: number;
  };

  type LectureForm = {
    id: string;
    title: string;
    content: string;
    type: "text" | "video" | "image" | "audio" | "pdf";
    duration?: number;
    url?: string;
    order_index?: number;
  };
  const [formData, setFormData] = useState({
    title: section?.title || "",
    status: (section?.status as "draft" | "published" | "archived") || "draft",
    hasLecture: !!section?.lecture,
    lectureTitle: section?.lecture?.title || "",
    lectureContent: section?.lecture?.content || "",
    lectureType: "text" as "text" | "video" | "image",
    lectureDuration: section?.lecture?.duration || 0,
    lectureItems: [] as LectureForm[],
    hasExercise: !!section?.practices && section.practices.length > 0,
    exerciseTitle: section?.practices?.[0]?.title || "",
    exerciseContent: section?.practices?.[0]?.content || "",
    exerciseDifficulty: (section?.practices?.[0]?.difficulty as "easy" | "medium" | "hard") || "easy",
    exerciseItems: [] as ExerciseForm[],
    hasQuiz: !!section?.quiz,
    quizTitle: section?.quiz?.title || "",
    quizQuestions: section?.quiz?.totalQuestions || 5,
    quizItems: [] as QuizQuestionForm[],
  });

  // Prefill quiz builder with existing quiz questions/options on edit
  useEffect(() => {
    if (section?.quiz && Array.isArray(section.quiz.questions) && section.quiz.questions.length > 0) {
      const items: QuizQuestionForm[] = (section.quiz.questions as Record<string, unknown>[]).map((q: Record<string, unknown>) => ({
        id: q.id as string,
        type: (q.type as string) || 'mcq',
        text: (q.text as string) || '',
        hint: (q.hint as string) || '',
        explanation: (q.explanation as string) || '',
        options: Array.isArray(q.options) ? (q.options as Record<string, unknown>[]).map((o: Record<string, unknown>) => ({ id: o.id as string, text: (o.text as string) || '', correct: !!o.correct })) : [],
        correctAnswers: Array.isArray(q.correctAnswers) ? q.correctAnswers as string[] : [],
        language: q.language as string,
        codeTemplate: (q.content as string) || '',
      }));
      setFormData(prev => ({
        ...prev,
        hasQuiz: true,
        quizTitle: section.quiz?.title || prev.quizTitle,
        quizQuestions: items.length || prev.quizQuestions,
        quizItems: items,
      }));
    }
  }, [section]);

  // Prefill exercise builder with existing exercises on edit
  useEffect(() => {
    if (section?.practices && Array.isArray(section.practices) && section.practices.length > 0) {
      const items: ExerciseForm[] = (section.practices as Record<string, unknown>[]).map((e: Record<string, unknown>, idx: number) => {
        const parsed = parsePracticeContent(e.content);
        const fallbackDifficulty = typeof e.difficulty === 'string' ? e.difficulty : undefined;
        const fallbackType = typeof e.type === 'string' ? e.type : undefined;
        const difficulty = (parsed.difficulty as 'easy' | 'medium' | 'hard') || (fallbackDifficulty as 'easy' | 'medium' | 'hard') || 'easy';
        const exerciseType = (parsed.exerciseType as 'practice' | 'assignment' | 'lab' | 'project' | 'practical' | 'coding') || (fallbackType as 'practice' | 'assignment' | 'lab' | 'project' | 'practical' | 'coding') || 'practical';
        const timeLimit = parsed.timeLimit ?? (typeof e.time_limit === 'number' ? e.time_limit : undefined);
        const passingScore = parsed.passingScore ?? (typeof e.passing_score === 'number' ? e.passing_score : undefined);
        const maxAttempts = parsed.maxAttempts ?? (typeof e.max_attempts === 'number' ? e.max_attempts : undefined);
        return {
          id: e.id as string,
          title: (e.title as string) || '',
          description: parsed.description,
          content: parsed.description,
          instructions: parsed.instructions,
          difficulty,
          type: exerciseType,
          points: parsed.points,
          timeLimit,
          starterCode: parsed.starterCode,
          expectedOutput: parsed.expectedOutput,
          language: parsed.language ?? 'python',
          passingScore,
          maxAttempts,
          order_index: (e.order_index as number) ?? idx + 1,
        };
      });
      setFormData(prev => ({
        ...prev,
        hasExercise: true,
        exerciseTitle: items[0]?.title || prev.exerciseTitle,
        exerciseContent: items[0]?.content || prev.exerciseContent,
        exerciseDifficulty: items[0]?.difficulty || prev.exerciseDifficulty,
        exerciseItems: items,
      }));
    }
  }, [section]);

  // Prefill lecture builder with existing lectures on edit
  useEffect(() => {
    if (section?.lectures && Array.isArray(section.lectures) && section.lectures.length > 0) {
      const lectureItems: LectureForm[] = section.lectures.map((lecture: any, idx: number) => {
        const parsed = parseLectureContent(lecture.content);
        return {
          id: lecture.id || `lecture-${Date.now()}-${idx}`,
          title: lecture.title || '',
          content: parsed.body,
          type: parsed.type,
          duration: parsed.duration ?? 0,
          url: parsed.url || '',
        };
      });
      setFormData(prev => ({
        ...prev,
        hasLecture: true,
        lectureTitle: lectureItems[0]?.title || prev.lectureTitle,
        lectureContent: lectureItems[0]?.content || prev.lectureContent,
        lectureType: lectureItems[0]?.type || prev.lectureType,
        lectureDuration: lectureItems[0]?.duration || prev.lectureDuration,
        lectureItems,
      }));
    }
  }, [section]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sectionData: Partial<Section> = {
      title: formData.title,
      status: formData.status,
      // Multi-lecture support - use first lecture for backward compatibility or create new structure
      lecture: formData.lectureItems.length > 0 ? {
        title: formData.lectureItems[0].title,
        content: formData.lectureItems[0].content,
        duration: formData.lectureItems[0].duration,
        type: formData.lectureItems[0].type,
        url: formData.lectureItems[0].url,
      } : null,
      // Multi-lecture data for enhanced storage
      lectures: formData.lectureItems.map((lecture, idx) => ({
        id: lecture.id,
        title: lecture.title,
        content: lecture.content,
        duration: lecture.duration,
        type: lecture.type,
        url: lecture.url,
        order_index: idx + 1,
      })),
      // Multi-exercise support 
      practices: formData.exerciseItems.map((exercise, idx) => ({
        id: exercise.id,
        title: exercise.title,
        content: exercise.description,
        difficulty: exercise.difficulty,
        type: exercise.type,
        points: exercise.points,
        timeLimit: exercise.timeLimit,
        instructions: exercise.instructions,
        starterCode: exercise.starterCode,
        language: exercise.language,
        expectedOutput: exercise.expectedOutput,
        order_index: idx + 1,
      })),
      quiz: formData.quizItems.length > 0 ? {
        id: `quiz-${Date.now()}`,
        title: formData.quizTitle,
        totalQuestions: formData.quizItems.length,
        questions: formData.quizItems.map((q, idx) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          order_index: idx + 1,
          hint: q.hint,
          explanation: q.explanation,
          content: q.codeTemplate,
          language: q.language,
          correctAnswers: q.correctAnswers,
          options: q.type === 'mcq' ? q.options : undefined,
        }))
      } : null
    };
    
    onSubmit(sectionData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="section-title">Section Title</Label>
              <Input
                id="section-title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter section title..."
                className="rounded-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="section-status">Status</Label>
              <select
                id="section-status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as "draft" | "published" | "archived" }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Lecture Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  id="has-lecture"
                  type="checkbox"
                  checked={formData.hasLecture}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasLecture: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="has-lecture">Include Lectures</Label>
              </div>

              {formData.hasLecture && (
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Lectures</h4>
                  </div>

                  {formData.lectureItems.length === 0 && (
                    <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                      No lectures yet. Click "Add Lecture" to start building.
                    </div>
                  )}

                  <div className="space-y-4">
                    {formData.lectureItems.map((lecture, li) => (
                      <div key={lecture.id} className="rounded-xl border border-gray-200 p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-gray-700">Type</Label>
                            <select
                              value={lecture.type}
                              onChange={(e) => setFormData(prev => {
                                const lectureItems = [...prev.lectureItems];
                                lectureItems[li] = {
                                  ...lecture,
                                  type: e.target.value as "text" | "video" | "image" | "audio" | "pdf",
                                };
                                return { ...prev, lectureItems };
                              })}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                            >
                              <option value="text">Text</option>
                              <option value="video">Video</option>
                              <option value="image">Image</option>
                              <option value="audio">Audio</option>
                              <option value="pdf">PDF</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-lg text-red-600 hover:text-red-700"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                lectureItems: prev.lectureItems.filter((_, i) => i !== li)
                              }))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label>Lecture Title</Label>
                            <Input
                              value={lecture.title}
                              onChange={(e) => setFormData(prev => {
                                const lectureItems = [...prev.lectureItems];
                                lectureItems[li] = { ...lecture, title: e.target.value };
                                return { ...prev, lectureItems };
                              })}
                              placeholder="Enter lecture title..."
                              className="rounded-xl"
                            />
                          </div>

                          <div>
                            <Label>Content</Label>
                            <textarea
                              value={lecture.content}
                              onChange={(e) => setFormData(prev => {
                                const lectureItems = [...prev.lectureItems];
                                lectureItems[li] = { ...lecture, content: e.target.value };
                                return { ...prev, lectureItems };
                              })}
                              placeholder={`Enter ${lecture.type === 'text' ? 'text content' : lecture.type === 'video' ? 'video URL or embed code' : lecture.type === 'audio' ? 'audio URL' : lecture.type === 'pdf' ? 'PDF URL' : 'image URL'}...`}
                              rows={4}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Duration (minutes)</Label>
                              <Input
                                type="number"
                                value={lecture.duration || ""}
                                onChange={(e) => setFormData(prev => {
                                  const lectureItems = [...prev.lectureItems];
                                  lectureItems[li] = { ...lecture, duration: parseInt(e.target.value) || 0 };
                                  return { ...prev, lectureItems };
                                })}
                                placeholder="Duration in minutes"
                                className="rounded-xl"
                                min="0"
                              />
                            </div>
                            <div>
                              <Label>URL (optional)</Label>
                              <Input
                                value={lecture.url || ""}
                                onChange={(e) => setFormData(prev => {
                                  const lectureItems = [...prev.lectureItems];
                                  lectureItems[li] = { ...lecture, url: e.target.value };
                                  return { ...prev, lectureItems };
                                })}
                                placeholder="External URL"
                                className="rounded-xl"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        lectureItems: [
                          ...prev.lectureItems,
                          {
                            id: `lecture-${Date.now()}`,
                            title: "",
                            content: "",
                            type: "text",
                            duration: 0,
                            url: "",
                          },
                        ],
                      }))}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Lecture
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Exercises Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    id="has-exercises"
                    type="checkbox"
                    checked={formData.exerciseItems.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          exerciseItems: [{
                            id: `ex-${Date.now()}`,
                            title: '',
                            description: '',
                            difficulty: 'easy' as const,
                            type: 'practical' as const,
                            points: 10,
                            timeLimit: 30,
                            instructions: '',
                            starterCode: '',
                            language: 'python',
                            expectedOutput: '',
                          }]
                        }))
                      } else {
                        setFormData(prev => ({ ...prev, exerciseItems: [] }))
                      }
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="has-exercises">Include Exercises</Label>
                </div>
                {formData.exerciseItems.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl text-sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      exerciseItems: [
                        ...prev.exerciseItems,
                        {
                          id: `ex-${Date.now()}`,
                          title: '',
                          description: '',
                          difficulty: 'easy' as const,
                          type: 'practical' as const,
                          points: 10,
                          timeLimit: 30,
                          instructions: '',
                          starterCode: '',
                          language: 'python',
                          expectedOutput: '',
                        }
                      ]
                    }))}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Exercise
                  </Button>
                )}
              </div>

              {formData.exerciseItems.length > 0 && (
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Exercises ({formData.exerciseItems.length})</h4>
                  </div>

                  <div className="space-y-4">
                    {formData.exerciseItems.map((exercise, ei) => (
                      <div key={exercise.id} className="rounded-xl border border-gray-200 p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-gray-700">Exercise {ei + 1}</Label>
                            <select
                              value={exercise.type}
                              onChange={(e) => setFormData(prev => {
                                const exerciseItems = [...prev.exerciseItems];
                                exerciseItems[ei] = {
                                  ...exercise,
                                  type: e.target.value as "practical" | "theoretical" | "coding" | "project",
                                };
                                return { ...prev, exerciseItems };
                              })}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                            >
                              <option value="practical">Practical</option>
                              <option value="theoretical">Theoretical</option>
                              <option value="coding">Coding</option>
                              <option value="project">Project</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-lg text-red-600 hover:text-red-700"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                exerciseItems: prev.exerciseItems.filter((_, i) => i !== ei)
                              }))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label>Exercise Title</Label>
                            <Input
                              value={exercise.title}
                              onChange={(e) => setFormData(prev => {
                                const exerciseItems = [...prev.exerciseItems];
                                exerciseItems[ei] = { ...exercise, title: e.target.value };
                                return { ...prev, exerciseItems };
                              })}
                              placeholder="Enter exercise title..."
                              className="rounded-xl"
                            />
                          </div>

                          <div>
                            <Label>Description</Label>
                            <textarea
                              value={exercise.description}
                              onChange={(e) => setFormData(prev => {
                                const exerciseItems = [...prev.exerciseItems];
                                exerciseItems[ei] = { ...exercise, description: e.target.value };
                                return { ...prev, exerciseItems };
                              })}
                              placeholder="Describe what students need to accomplish..."
                              rows={2}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label>Difficulty</Label>
                              <select
                                value={exercise.difficulty}
                                onChange={(e) => setFormData(prev => {
                                  const exerciseItems = [...prev.exerciseItems];
                                  exerciseItems[ei] = { ...exercise, difficulty: e.target.value as any };
                                  return { ...prev, exerciseItems };
                                })}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                              >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </select>
                            </div>
                            <div>
                              <Label>Points</Label>
                              <Input
                                type="number"
                                value={exercise.points}
                                onChange={(e) => setFormData(prev => {
                                  const exerciseItems = [...prev.exerciseItems];
                                  exerciseItems[ei] = { ...exercise, points: parseInt(e.target.value) || 10 };
                                  return { ...prev, exerciseItems };
                                })}
                                placeholder="Points"
                                className="rounded-xl"
                              />
                            </div>
                            <div>
                              <Label>Time Limit (min)</Label>
                              <Input
                                type="number"
                                value={exercise.timeLimit}
                                onChange={(e) => setFormData(prev => {
                                  const exerciseItems = [...prev.exerciseItems];
                                  exerciseItems[ei] = { ...exercise, timeLimit: parseInt(e.target.value) || 30 };
                                  return { ...prev, exerciseItems };
                                })}
                                placeholder="Minutes"
                                className="rounded-xl"
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Instructions</Label>
                            <textarea
                              value={exercise.instructions}
                              onChange={(e) => setFormData(prev => {
                                const exerciseItems = [...prev.exerciseItems];
                                exerciseItems[ei] = { ...exercise, instructions: e.target.value };
                                return { ...prev, exerciseItems };
                              })}
                              placeholder="Detailed step-by-step instructions..."
                              rows={3}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 resize-y"
                            />
                          </div>

                          {exercise.type === "coding" && (
                            <div className="space-y-3 bg-gray-50 rounded-xl p-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>Programming Language</Label>
                                  <select
                                    value={exercise.language || 'python'}
                                    onChange={(e) => setFormData(prev => {
                                      const exerciseItems = [...prev.exerciseItems];
                                      exerciseItems[ei] = { ...exercise, language: e.target.value };
                                      return { ...prev, exerciseItems };
                                    })}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                                  >
                                    <option value="python">Python</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="java">Java</option>
                                    <option value="c">C</option>
                                    <option value="cpp">C++</option>
                                    <option value="html">HTML</option>
                                    <option value="css">CSS</option>
                                  </select>
                                </div>
                                <div>
                                  <Label>Expected Output (optional)</Label>
                                  <Input
                                    value={exercise.expectedOutput || ''}
                                    onChange={(e) => setFormData(prev => {
                                      const exerciseItems = [...prev.exerciseItems];
                                      exerciseItems[ei] = { ...exercise, expectedOutput: e.target.value };
                                      return { ...prev, exerciseItems };
                                    })}
                                    placeholder="Expected output"
                                    className="rounded-xl"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label>Starter Code (optional)</Label>
                                <textarea
                                  value={exercise.starterCode || ''}
                                  onChange={(e) => setFormData(prev => {
                                    const exerciseItems = [...prev.exerciseItems];
                                    exerciseItems[ei] = { ...exercise, starterCode: e.target.value };
                                    return { ...prev, exerciseItems };
                                  })}
                                  rows={4}
                                  placeholder="# Provide starter code here..."
                                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 resize-y font-mono"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-xl">
                    <p className="font-medium text-green-900 mb-2">Exercise Types Supported:</p>
                    <ul className="space-y-1 text-green-800">
                      <li>• Practical - Hands-on tasks and assignments</li>
                      <li>• Theoretical - Written analysis and research</li>
                      <li>• Coding - Programming challenges with IDE support</li>
                      <li>• Project - Complex multi-step assignments</li>
                    </ul>
                    <p className="mt-2 text-green-700">
                      Each exercise can be customized with difficulty, points, and time limits.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quiz Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  id="has-quiz"
                  type="checkbox"
                  checked={formData.hasQuiz}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasQuiz: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="has-quiz">Include Quiz</Label>
              </div>

              {formData.hasQuiz && (
                <>
                  <div>
                    <Label htmlFor="quiz-title">Quiz Title</Label>
                    <Input
                      id="quiz-title"
                      type="text"
                      value={formData.quizTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, quizTitle: e.target.value }))}
                      placeholder="Enter quiz title..."
                      className="rounded-xl"
                    />
                  </div>
                  
                  {/* Quiz Questions Builder */}
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Questions</h4>
                    </div>

                    {formData.quizItems.length === 0 && (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                        No questions yet. Click &quot;Add Question&quot; to start building.
                      </div>
                    )}

                    <div className="space-y-4">
                      {formData.quizItems.map((q, qi) => (
                        <div key={q.id} className="rounded-xl border border-gray-200 p-4 bg-white">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm text-gray-700">Type</Label>
                              <select
                                value={q.type}
                                onChange={(e) => setFormData(prev => {
                                  const quizItems = [...prev.quizItems];
                                  quizItems[qi] = {
                                    ...q,
                                    type: e.target.value as "mcq" | "text" | "fill-in-the-blanks" | "coding",
                                  };
                                  return { ...prev, quizItems };
                                })}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              >
                                <option value="mcq">MCQ</option>
                                <option value="fill-in-the-blanks">Fill in the Blanks</option>
                                <option value="coding">Coding</option>
                                <option value="text">Short Text</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-lg text-red-600 hover:text-red-700"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  quizItems: prev.quizItems.filter((_, i) => i !== qi)
                                }))}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label>Question Text</Label>
                              <textarea
                                value={q.text}
                                onChange={(e) => setFormData(prev => {
                                  const quizItems = [...prev.quizItems];
                                  quizItems[qi] = { ...q, text: e.target.value };
                                  return { ...prev, quizItems };
                                })}
                                placeholder="Enter the question prompt..."
                                rows={2}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 resize-none"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>Hint (optional)</Label>
                                <Input
                                  value={q.hint || ""}
                                  onChange={(e) => setFormData(prev => {
                                    const quizItems = [...prev.quizItems];
                                    quizItems[qi] = { ...q, hint: e.target.value };
                                    return { ...prev, quizItems };
                                  })}
                                  placeholder="Add a hint"
                                  className="rounded-xl"
                                />
                              </div>
                              <div>
                                <Label>Explanation (optional)</Label>
                                <Input
                                  value={q.explanation || ""}
                                  onChange={(e) => setFormData(prev => {
                                    const quizItems = [...prev.quizItems];
                                    quizItems[qi] = { ...q, explanation: e.target.value };
                                    return { ...prev, quizItems };
                                  })}
                                  placeholder="Add an explanation"
                                  className="rounded-xl"
                                />
                              </div>
                            </div>

                            {q.type === "mcq" && (
                              <div className="space-y-2">
                                <Label>Options</Label>
                                <div className="space-y-2">
                                  {q.options.map((opt, oi) => (
                                    <div key={opt.id} className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={opt.correct}
                                        onChange={(e) => setFormData(prev => {
                                          const quizItems = [...prev.quizItems];
                                          const options = [...q.options];
                                          options[oi] = { ...opt, correct: e.target.checked };
                                          quizItems[qi] = { ...q, options };
                                          return { ...prev, quizItems };
                                        })}
                                        className="rounded"
                                      />
                                      <Input
                                        value={opt.text}
                                        onChange={(e) => setFormData(prev => {
                                          const quizItems = [...prev.quizItems];
                                          const options = [...q.options];
                                          options[oi] = { ...opt, text: e.target.value };
                                          quizItems[qi] = { ...q, options };
                                          return { ...prev, quizItems };
                                        })}
                                        placeholder={`Option ${oi + 1}`}
                                        className="flex-1 rounded-xl"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-xl"
                                        onClick={() => setFormData(prev => {
                                          const quizItems = [...prev.quizItems];
                                          const options = q.options.filter((_, i) => i !== oi);
                                          quizItems[qi] = { ...q, options };
                                          return { ...prev, quizItems };
                                        })}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl"
                                    onClick={() => setFormData(prev => {
                                      const quizItems = [...prev.quizItems];
                                      quizItems[qi] = {
                                        ...q,
                                        options: [
                                          ...q.options,
                                          { id: `o-${Date.now()}`, text: `Option ${q.options.length + 1}`, correct: false },
                                        ],
                                      };
                                      return { ...prev, quizItems };
                                    })}
                                  >
                                    <Plus className="h-4 w-4 mr-2" /> Add Option
                                  </Button>
                                </div>
                              </div>
                            )}

                            {q.type === "fill-in-the-blanks" && (
                              <div className="space-y-2">
                                <Label>Correct Answers (comma separated)</Label>
                                <Input
                                  value={(q.correctAnswers || []).join(", ")}
                                  onChange={(e) => setFormData(prev => {
                                    const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                                    const quizItems = [...prev.quizItems];
                                    quizItems[qi] = { ...q, correctAnswers: values };
                                    return { ...prev, quizItems };
                                  })}
                                  placeholder="e.g., select, from"
                                  className="rounded-xl"
                                />
                              </div>
                            )}

                            {q.type === "coding" && (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label>Language</Label>
                                    <select
                                      value={q.language || 'python'}
                                      onChange={(e) => setFormData(prev => {
                                        const quizItems = [...prev.quizItems];
                                        quizItems[qi] = { ...q, language: e.target.value };
                                        return { ...prev, quizItems };
                                      })}
                                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                                    >
                                      <option value="python">Python</option>
                                      <option value="javascript">JavaScript</option>
                                      <option value="java">Java</option>
                                      <option value="c">C</option>
                                      <option value="cpp">C++</option>
                                    </select>
                                  </div>
                                  <div>
                                    <Label>Expected Output (for quick validation)</Label>
                                    <Input
                                      value={(q.correctAnswers || [""])[0] || ''}
                                      onChange={(e) => setFormData(prev => {
                                        const quizItems = [...prev.quizItems];
                                        quizItems[qi] = { ...q, correctAnswers: [e.target.value] };
                                        return { ...prev, quizItems };
                                      })}
                                      placeholder="e.g., 42"
                                      className="rounded-xl"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>Starter Code (optional)</Label>
                                  <textarea
                                    value={q.codeTemplate || ''}
                                    onChange={(e) => setFormData(prev => {
                                      const quizItems = [...prev.quizItems];
                                      quizItems[qi] = { ...q, codeTemplate: e.target.value };
                                      return { ...prev, quizItems };
                                    })}
                                    rows={5}
                                    placeholder="# Write your solution here"
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 resize-y"
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === "text" && (
                              <div className="space-y-2">
                                <Label>Correct Answer</Label>
                                <Input
                                  value={(q.correctAnswers || [""])[0] || ''}
                                  onChange={(e) => setFormData(prev => {
                                    const quizItems = [...prev.quizItems];
                                    quizItems[qi] = { ...q, correctAnswers: [e.target.value] };
                                    return { ...prev, quizItems };
                                  })}
                                  placeholder="Enter expected answer"
                                  className="rounded-xl"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          quizItems: [
                            ...prev.quizItems,
                            {
                              id: `q-${Date.now()}`,
                              type: "mcq",
                              text: "",
                              options: [
                                { id: `o-${Date.now()}-1`, text: "Option 1", correct: false },
                                { id: `o-${Date.now()}-2`, text: "Option 2", correct: false },
                                { id: `o-${Date.now()}-3`, text: "Option 3", correct: false },
                                { id: `o-${Date.now()}-4`, text: "Option 4", correct: false },
                              ],
                              correctAnswers: [],
                              language: "python",
                              codeTemplate: "",
                            },
                          ],
                        }))}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Question
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-xl">
                    <p className="font-medium text-blue-900 mb-2">Quiz Types Supported:</p>
                    <ul className="space-y-1 text-blue-800">
                      <li>• Multiple Choice Questions (MCQ)</li>
                      <li>• Fill in the Blanks</li>
                      <li>• Coding Exercises</li>
                    </ul>
                    <p className="mt-2 text-blue-700">
                      Quiz questions can be configured after the section is created.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 rounded-xl bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))] hover:opacity-90"
              >
                {section ? 'Update Section' : 'Add Section'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
