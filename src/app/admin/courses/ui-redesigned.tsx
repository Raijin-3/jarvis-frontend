"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
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
  Settings,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Star,
  TrendingUp,
  PlayCircle,
  FileText,
  Award,
  Calendar,
  Target,
  Layers,
  Zap
} from "lucide-react";

/* =========================
   Types (same as before)
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
function unwrapData<T = any>(json: any): T {
  return (json && (json.data ?? json)) as T;
}

function normalizeCourseFull(input: any): CourseFull {
  const c = unwrapData<CourseFull>(input) as any;
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
   Main Course Manager Component
   ========================= */
export function CourseManager({ initialCourses }: { initialCourses: Course[] }) {
  const [courses, setCourses] = useState<Course[]>(initialCourses || []);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(initialCourses || []);
  const [loadingId, setLoadingId] = useState<Id | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Id | null>(null);
  const [full, setFull] = useState<Record<Id, CourseFull>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
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
            const list = Array.isArray(json) ? json : unwrapData<any[]>(json);
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
    } catch (e: any) {
      toast.error(e?.message || "Failed to create course");
    }
  };

  const loadCourse = async (id: Id) => {
    if (full[id]) return;
    
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/courses/${id}/full`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to load course");

      const normalized = normalizeCourseFull(json);
      setFull((f) => ({ ...f, [id]: normalized }));
    } catch (e: any) {
      toast.error(e?.message || "Failed to load course");
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
                    <p className="text-gray-600">Design and manage your educational content</p>
                  </div>
                </div>
                <p className="text-gray-600 max-w-2xl">
                  Create engaging courses, organize content into structured modules, and track learner progress through your educational platform.
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
        <div className="rounded-xl border border-white/20 bg-white/80 backdrop-blur-xl p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 focus:border-[hsl(var(--brand))]"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20"
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
                className="px-4 py-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses Grid/List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    onClick={() => selectCourse(course.id)}
                    isSelected={selectedCourse === course.id}
                    isLoading={loadingId === course.id}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCourses.map((course) => (
                  <CourseListItem 
                    key={course.id} 
                    course={course} 
                    onClick={() => selectCourse(course.id)}
                    isSelected={selectedCourse === course.id}
                    isLoading={loadingId === course.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Course Details Panel */}
          <div className="space-y-6">
            {selectedCourse && full[selectedCourse] ? (
              <CourseDetailsPanel 
                course={full[selectedCourse]}
                onAddSubject={() => setShowSubjectModal(true)}
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
        <CreateCourseModal 
          onClose={() => setShowCreateForm(false)}
          onSubmit={createCourse}
        />
      )}
      
      {showSubjectModal && (
        <AddSubjectModal 
          onClose={() => setShowSubjectModal(false)}
          onSubmit={async (data) => {
            // Add subject logic here
            setShowSubjectModal(false);
          }}
        />
      )}
    </div>
  );
}

/* =========================
   Course Card Component
   ========================= */
function CourseCard({ 
  course, 
  onClick, 
  isSelected, 
  isLoading 
}: { 
  course: Course; 
  onClick: () => void; 
  isSelected: boolean;
  isLoading: boolean;
}) {
  return (
    <div 
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
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
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
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
   Course List Item Component
   ========================= */
function CourseListItem({ 
  course, 
  onClick, 
  isSelected, 
  isLoading 
}: { 
  course: Course; 
  onClick: () => void; 
  isSelected: boolean;
  isLoading: boolean;
}) {
  return (
    <div 
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-lg ${
        isSelected 
          ? 'border-[hsl(var(--brand))]/50 bg-gradient-to-r from-[hsl(var(--brand))]/5 to-[hsl(var(--brand-accent))]/5 shadow-lg' 
          : 'border-white/20 bg-white/80 backdrop-blur-xl'
      }`}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[hsl(var(--brand))]"></div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[hsl(var(--brand))] transition-colors">
                {course.title}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[course.status || 'draft']}`}>
                  {course.status || 'draft'}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${difficultyColors[course.difficulty || 'beginner']}`}>
                  {course.difficulty || 'beginner'}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {course.description || "No description available"}
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{course.enrolled_count || 0} enrolled</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{course.duration || 0}m duration</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{course.created_at ? new Date(course.created_at).toLocaleDateString() : 'Recently'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Course Details Panel
   ========================= */
function CourseDetailsPanel({ 
  course, 
  onAddSubject 
}: { 
  course: CourseFull; 
  onAddSubject: () => void; 
}) {
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
            <Button size="sm" variant="outline" className="rounded-lg">
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="rounded-lg">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
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
        </div>

        <Button 
          onClick={onAddSubject}
          className="w-full rounded-lg bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))] hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </div>

      {/* Course Structure */}
      <div className="rounded-xl border border-white/20 bg-white/80 backdrop-blur-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Course Structure</h4>
        <div className="space-y-3">
          {course.subjects.map((subject) => (
            <div key={subject.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">{subject.title}</span>
                </div>
                <span className="text-xs text-gray-500">{subject.modules.length} modules</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Create Course Modal
   ========================= */
function CreateCourseModal({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void; 
  onSubmit: (data: Partial<Course>) => void; 
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General",
    difficulty: "beginner" as const,
    status: "draft" as const
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
            <h2 className="text-xl font-semibold text-gray-900">Create New Course</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Course Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter course title..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 focus:border-[hsl(var(--brand))]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what students will learn in this course..."
                rows={4}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 focus:border-[hsl(var(--brand))]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 focus:border-[hsl(var(--brand))]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 focus:border-[hsl(var(--brand))]"
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
                Create Course
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
   Add Subject Modal (simplified for demo)
   ========================= */
function AddSubjectModal({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void; 
  onSubmit: (data: Partial<Subject>) => void; 
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "draft" as const
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
            <h2 className="text-xl font-semibold text-gray-900">Add New Subject</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter subject title..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 focus:border-[hsl(var(--brand))]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what students will learn in this subject..."
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]/20 focus:border-[hsl(var(--brand))]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 rounded-xl bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))] hover:opacity-90"
              >
                Add Subject
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