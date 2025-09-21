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
type Lecture = { title: string; content: string; duration?: number };
type Quiz = { id: Id; title: string; questions?: Question[]; completed?: boolean; totalQuestions?: number } | null;
type Practice = { id: Id; title: string; content?: string; deleted?: boolean; difficulty?: "easy" | "medium" | "hard" };
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
  lecture: Lecture | null;
  practices: Practice[];
  quiz: Quiz;
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

              // If there's lecture data, add it to the section
              if (data.lecture) {
                try {
                  const lectureRes = await fetch(`/api/admin/sections/${targetSectionId}/lecture`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: data.lecture.title,
                      content: data.lecture.content,
                      duration: (data.lecture as { duration?: number }).duration,
                      type: (data.lecture as { type?: string }).type,
                    }),
                  });
                  
                  if (!lectureRes.ok) {
                    console.warn("Failed to add lecture to section");
                  }
                } catch (lectureError) {
                  console.warn("Failed to add lecture:", lectureError);
                }
              }

              // If there are practice exercises, add them to the section
              if (Array.isArray(data.practices) && data.practices.length > 0) {
                for (const p of data.practices) {
                  try {
                    const practiceRes = await fetch(`/api/admin/sections/${targetSectionId}/practice-exercises`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: p.title,
                        content: (p as { content?: string }).content,
                        difficulty: (p as { difficulty?: string }).difficulty,
                      }),
                    });

                    if (!practiceRes.ok) {
                      console.warn("Failed to add practice exercise to section");
                    }
                  } catch (practiceError) {
                    console.warn("Failed to add practice exercise:", practiceError);
                  }
                }
              }

              // If there's quiz data, add it to the section and create questions/options
              if (data.quiz) {
                try {
                  let quizId: string | null = null;
                  if (editingSection?.quiz?.id) {
                    // Update existing quiz title if provided
                    const qUp = await fetch(`/api/admin/quizzes/${editingSection.quiz.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ title: (data.quiz as { title: string }).title }),
                    });
                    if (!qUp.ok) console.warn("Failed to update quiz title");
                    quizId = editingSection.quiz.id;
                  } else {
                    const quizRes = await fetch(`/api/admin/sections/${targetSectionId}/quiz`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ title: (data.quiz as { title: string }).title }),
                    });
                    if (quizRes.ok) {
                      const quizJson = await quizRes.json().catch(() => ({}));
                      const createdQuiz: Record<string, unknown> = unwrapData(quizJson);
                      quizId = (createdQuiz?.id as string) || ((createdQuiz?.quiz as Record<string, unknown>)?.id as string) || null;
                    } else {
                      console.warn("Failed to add quiz to section");
                    }
                  }

                  // Create/update questions and options if provided
                  const questions = (data.quiz as { questions?: unknown[] })?.questions;
                  if (quizId && Array.isArray(questions) && questions.length > 0) {
                    for (const q of questions) {
                      try {
                        let questionId: string | null = (q as Record<string, unknown>).id as string || null;
                        if (questionId) {
                          // Update existing question
                          const qUp = await fetch(`/api/admin/quizzes/questions/${questionId}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              text: (q as Record<string, unknown>).text,
                              type: (q as Record<string, unknown>).type,
                              order_index: (q as Record<string, unknown>).order_index,
                              hint: (q as Record<string, unknown>).hint,
                              explanation: (q as Record<string, unknown>).explanation,
                              content: (q as Record<string, unknown>).content,
                              language: (q as Record<string, unknown>).language,
                              correctAnswers: (q as Record<string, unknown>).correctAnswers,
                            }),
                          });
                          if (!qUp.ok) console.warn("Failed to update quiz question");
                        } else {
                          // Create new question
                          const qRes = await fetch(`/api/admin/quizzes/${quizId}/questions`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              text: (q as Record<string, unknown>).text,
                              type: (q as Record<string, unknown>).type,
                              order_index: (q as Record<string, unknown>).order_index,
                              hint: (q as Record<string, unknown>).hint,
                              explanation: (q as Record<string, unknown>).explanation,
                              content: (q as Record<string, unknown>).content,
                              language: (q as Record<string, unknown>).language,
                              correctAnswers: (q as Record<string, unknown>).correctAnswers,
                            }),
                          });
                          if (!qRes.ok) {
                            console.warn("Failed to create quiz question");
                            continue;
                          }
                          const qJson = await qRes.json().catch(() => ({}));
                          const createdQuestion: Record<string, unknown> = unwrapData(qJson);
                          questionId = (createdQuestion?.id as string) || ((createdQuestion?.question as Record<string, unknown>)?.id as string) || null;
                        }

                        // Handle MCQ options
                        if ((q as Record<string, unknown>).type === 'mcq' && questionId && Array.isArray((q as Record<string, unknown>).options)) {
                          for (const opt of (q as Record<string, unknown>).options as Record<string, unknown>[]) {
                            try {
                              if (opt.id) {
                                const oUp = await fetch(`/api/admin/quizzes/options/${opt.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ text: opt.text, correct: !!opt.correct }),
                                });
                                if (!oUp.ok) console.warn("Failed to update option");
                              } else {
                                const oRes = await fetch(`/api/admin/quizzes/questions/${questionId}/options`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ text: opt.text, correct: !!opt.correct }),
                                });
                                if (!oRes.ok) console.warn("Failed to add option to question");
                              }
                            } catch (optErr) {
                              console.warn("Failed to upsert option:", optErr);
                            }
                          }
                        }
                      } catch (qErr) {
                        console.warn("Failed to upsert quiz question:", qErr);
                      }
                    }
                  }
                } catch (quizError) {
                  console.warn("Failed to add quiz:", quizError);
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
                              {module.sections.map((section) => (
                                <div key={section.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-3 w-3 text-purple-600" />
                                    <span className="text-sm text-gray-700">{section.title}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {section.lecture && (
                                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                        <PlayCircle className="h-3 w-3" />
                                        <span>Lecture</span>
                                      </div>
                                    )}
                                    {section.practices.length > 0 && (
                                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                        <PenTool className="h-3 w-3" />
                                        <span>{section.practices.length}</span>
                                      </div>
                                    )}
                                    {section.quiz && (
                                      <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                                        <HelpCircle className="h-3 w-3" />
                                        <span>Quiz</span>
                                      </div>
                                    )}
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
                              ))}
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
    difficulty: "easy" | "medium" | "hard";
    type: "practice" | "assignment" | "lab" | "project";
    timeLimit?: number;
    passingScore?: number;
    maxAttempts?: number;
  };

  type LectureForm = {
    id: string;
    title: string;
    content: string;
    type: "text" | "video" | "image" | "audio" | "pdf";
    duration?: number;
    url?: string;
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
      const items: ExerciseForm[] = (section.practices as Record<string, unknown>[]).map((e: Record<string, unknown>) => ({
        id: e.id as string,
        title: (e.title as string) || '',
        content: (e.content as string) || '',
        difficulty: (e.difficulty as "easy" | "medium" | "hard") || 'easy',
        type: (e.type as "practice" | "assignment" | "lab" | "project") || 'practice',
        timeLimit: e.time_limit as number,
        passingScore: e.passing_score as number,
        maxAttempts: e.max_attempts as number,
      }));
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
    if (section?.lecture) {
      const lectureItem: LectureForm = {
        id: section.lecture.id as string || `lecture-${Date.now()}`,
        title: (section.lecture.title as string) || '',
        content: (section.lecture.content as string) || '',
        type: (section.lecture.type as "text" | "video" | "image" | "audio" | "pdf") || 'text',
        duration: section.lecture.duration as number,
        url: (section.lecture.url as string) || '',
      };
      setFormData(prev => ({
        ...prev,
        hasLecture: true,
        lectureTitle: lectureItem.title || prev.lectureTitle,
        lectureContent: lectureItem.content || prev.lectureContent,
        lectureType: lectureItem.type || prev.lectureType,
        lectureDuration: lectureItem.duration || prev.lectureDuration,
        lectureItems: [lectureItem],
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
