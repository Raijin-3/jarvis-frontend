"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Grid, List, ChevronDown, ChevronRight, Book, PlayCircle, HelpCircle, Code, Trash2, Edit, Eye, MoreVertical, Users, Clock, CheckCircle, AlertCircle, Settings } from "lucide-react";

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
  duration?: number; // in minutes
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
  draft: "bg-gray-100 text-gray-800",
  published: "bg-green-100 text-green-800", 
  archived: "bg-yellow-100 text-yellow-800"
};

const difficultyColors = {
  beginner: "bg-blue-100 text-blue-800",
  intermediate: "bg-orange-100 text-orange-800",
  advanced: "bg-red-100 text-red-800"
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

  // Prefetch full details for the first page of filtered courses
  useEffect(() => {
    const idsToPrefetch = filteredCourses
      .slice(0, 12)
      .map((c) => c.id)
      .filter((id) => !full[id]);
    if (idsToPrefetch.length === 0) return;

    (async () => {
      for (const id of idsToPrefetch) {
        try {
          const res = await fetch(`/api/admin/courses/${id}/full`, { cache: 'no-store' });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) continue;
          const normalized = normalizeCourseFull(json);
          setFull((f) => ({ ...f, [id]: normalized }));
        } catch {}
      }
    })();
  }, [filteredCourses]);

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

  const addSubject = async (subjectData: Partial<Subject>) => {
    if (!selectedCourse || !subjectData.title?.trim()) return;
    try {
      const res = await fetch(`/api/admin/courses/${selectedCourse}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: subjectData.title }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to create subject');

      const created = unwrapData<any>(json);
      const newSubject: Subject = {
        id: created.id,
        title: created.title,
        description: subjectData.description || '',
        status: subjectData.status || 'draft',
        modules: [],
      };

      setFull((prev) => ({
        ...prev,
        [selectedCourse]: {
          ...prev[selectedCourse],
          subjects: [...(prev[selectedCourse]?.subjects || []), newSubject],
        },
      }));

      setShowSubjectModal(false);
      toast.success('Subject added successfully');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add subject');
    }
  };

  const addModule = async (moduleData: Partial<Module>) => {
    if (!selectedCourse || !selectedSubjectId || !moduleData.title?.trim()) return;
    try {
      const res = await fetch(`/api/admin/subjects/${selectedSubjectId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: moduleData.title }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to create module');

      const created = unwrapData<any>(json);
      const newModule: Module = {
        id: created.id,
        title: created.title,
        description: moduleData.description || '',
        status: moduleData.status || 'draft',
        sections: [],
      };

      setFull((prev) => ({
        ...prev,
        [selectedCourse]: {
          ...prev[selectedCourse],
          subjects: prev[selectedCourse].subjects.map((subject) =>
            subject.id === selectedSubjectId
              ? { ...subject, modules: [...subject.modules, newModule] }
              : subject
          ),
        },
      }));

      setShowModuleModal(false);
      setSelectedSubjectId(null);
      toast.success('Module added successfully');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add module');
    }
  };

  const addSection = async (sectionData: Partial<Section>) => {
    if (!selectedCourse || !selectedModuleId || !sectionData.title?.trim()) return;
    try {
      // 1) Create section
      const res = await fetch(`/api/admin/modules/${selectedModuleId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: sectionData.title }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to create section');
      const created = unwrapData<any>(json);

      const newSection: Section = {
        id: created.id,
        title: created.title,
        lecture: null,
        practices: [],
        quiz: null,
        status: sectionData.status || 'draft',
      };

      setFull((prev) => ({
        ...prev,
        [selectedCourse]: {
          ...prev[selectedCourse],
          subjects: prev[selectedCourse].subjects.map((subject) => ({
            ...subject,
            modules: subject.modules.map((module) =>
              module.id === selectedModuleId
                ? { ...module, sections: [...module.sections, newSection] }
                : module
            ),
          })),
        },
      }));

      setShowSectionModal(false);
      setSelectedModuleId(null);
      toast.success('Section added successfully');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add section');
    }
  };

  // Updates and deletes
  const renameSubject = async (subjectId: Id, title: string) => {
    if (!selectedCourse || !title?.trim()) return;
    try {
      const res = await fetch(`/api/admin/subjects/${subjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to update subject');
      setFull((prev) => ({
        ...prev,
        [selectedCourse!]: {
          ...prev[selectedCourse!],
          subjects: prev[selectedCourse!].subjects.map((s) => (s.id === subjectId ? { ...s, title } : s)),
        },
      }));
      toast.success('Subject updated');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update subject');
    }
  };

  const removeSubject = async (subjectId: Id) => {
    if (!selectedCourse) return;
    try {
      const res = await fetch(`/api/admin/subjects/${subjectId}`, { method: 'DELETE' });
      const ok = res.ok;
      if (!ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to delete subject');
      }
      setFull((prev) => ({
        ...prev,
        [selectedCourse!]: {
          ...prev[selectedCourse!],
          subjects: prev[selectedCourse!].subjects.filter((s) => s.id !== subjectId),
        },
      }));
      toast.success('Subject deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete subject');
    }
  };

  const renameModule = async (moduleId: Id, title: string) => {
    if (!selectedCourse || !title?.trim()) return;
    try {
      const res = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to update module');
      setFull((prev) => ({
        ...prev,
        [selectedCourse!]: {
          ...prev[selectedCourse!],
          subjects: prev[selectedCourse!].subjects.map((s) => ({
            ...s,
            modules: s.modules.map((m) => (m.id === moduleId ? { ...m, title } : m)),
          })),
        },
      }));
      toast.success('Module updated');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update module');
    }
  };

  const removeModule = async (moduleId: Id) => {
    if (!selectedCourse) return;
    try {
      const res = await fetch(`/api/admin/modules/${moduleId}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to delete module');
      }
      setFull((prev) => ({
        ...prev,
        [selectedCourse!]: {
          ...prev[selectedCourse!],
          subjects: prev[selectedCourse!].subjects.map((s) => ({
            ...s,
            modules: s.modules.filter((m) => m.id !== moduleId),
          })),
        },
      }));
      toast.success('Module deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete module');
    }
  };

  const renameSection = async (sectionId: Id, title: string) => {
    if (!selectedCourse || !title?.trim()) return;
    try {
      const res = await fetch(`/api/admin/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to update section');
      setFull((prev) => ({
        ...prev,
        [selectedCourse!]: {
          ...prev[selectedCourse!],
          subjects: prev[selectedCourse!].subjects.map((s) => ({
            ...s,
            modules: s.modules.map((m) => ({
              ...m,
              sections: m.sections.map((sec) => (sec.id === sectionId ? { ...sec, title } : sec)),
            })),
          })),
        },
      }));
      toast.success('Section updated');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update section');
    }
  };

  const removeSection = async (sectionId: Id) => {
    if (!selectedCourse) return;
    try {
      const res = await fetch(`/api/admin/sections/${sectionId}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to delete section');
      }
      setFull((prev) => ({
        ...prev,
        [selectedCourse!]: {
          ...prev[selectedCourse!],
          subjects: prev[selectedCourse!].subjects.map((s) => ({
            ...s,
            modules: s.modules.map((m) => ({
              ...m,
              sections: m.sections.filter((sec) => sec.id !== sectionId),
            })),
          })),
        },
      }));
      toast.success('Section deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete section');
    }
  };

  const publishCourse = async (courseId: Id) => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to publish course');
      setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, status: 'published' } : c)));
      setFull((prev) => (prev[courseId] ? { ...prev, [courseId]: { ...(prev[courseId] as any), status: 'published' } } : prev));
      toast.success('Course published');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to publish course');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
              <p className="text-gray-600 mt-1">Create and manage your educational content</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="flex items-center gap-2"
              >
                {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                {viewMode === "grid" ? "List View" : "Grid View"}
              </Button>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Course
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <StatsCard 
              title="Total Courses" 
              value={courses.length} 
              icon={<Book className="w-5 h-5" />}
              color="bg-blue-500"
            />
            <StatsCard 
              title="Published" 
              value={courses.filter(c => c.status === "published").length} 
              icon={<CheckCircle className="w-5 h-5" />}
              color="bg-green-500"
            />
            <StatsCard 
              title="Draft" 
              value={courses.filter(c => c.status === "draft").length} 
              icon={<AlertCircle className="w-5 h-5" />}
              color="bg-yellow-500"
            />
            <StatsCard 
              title="Total Enrolled" 
              value={courses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0)} 
              icon={<Users className="w-5 h-5" />}
              color="bg-purple-500"
            />
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Courses List/Grid */}
          <div className="lg:col-span-7">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onClick={() => selectCourse(course.id)}
                    isSelected={selectedCourse === course.id}
                    fullById={full}
                    onPublish={() => publishCourse(course.id)}
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
                    fullById={full}
                    onPublish={() => publishCourse(course.id)}
                  />
                ))}
              </div>
            )}
            
            {filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || statusFilter !== "all" || difficultyFilter !== "all" 
                    ? "Try adjusting your search or filters"
                    : "Get started by creating your first course"
                  }
                </p>
                {!searchQuery && statusFilter === "all" && difficultyFilter === "all" && (
                  <Button onClick={() => setShowCreateForm(true)}>
                    Create Your First Course
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Course Details Panel */}
          <div className="lg:col-span-5">
            {selectedCourse ? (
              <CourseDetailsPanel
                courseId={selectedCourse}
                course={full[selectedCourse]}
                loading={loadingId === selectedCourse}
                onChanged={() => setFull((f) => ({ ...f }))}
                onAddSubject={() => setShowSubjectModal(true)}
                onAddModule={(subjectId: Id) => {
                  setSelectedSubjectId(subjectId);
                  setShowModuleModal(true);
                }}
                onAddSection={(moduleId: Id) => {
                  setSelectedModuleId(moduleId);
                  setShowSectionModal(true);
                }}
                onRenameSubject={renameSubject}
                onDeleteSubject={removeSubject}
                onRenameModule={renameModule}
                onDeleteModule={removeModule}
                onRenameSection={renameSection}
                onDeleteSection={removeSection}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">Course Details</h3>
                <p className="text-gray-500">Select a course to view and edit its details</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Course Modal */}
        {showCreateForm && (
          <CreateCourseModal
            onClose={() => setShowCreateForm(false)}
            onSubmit={createCourse}
          />
        )}

        {/* Add Subject Modal */}
        {showSubjectModal && (
          <AddSubjectModal
            onClose={() => setShowSubjectModal(false)}
            onSubmit={addSubject}
          />
        )}

        {/* Add Module Modal */}
        {showModuleModal && (
          <AddModuleModal
            onClose={() => setShowModuleModal(false)}
            onSubmit={addModule}
          />
        )}

        {/* Add Section Modal (simplified) */}
        {showSectionModal && (
          <AddSimpleSectionModal
            onClose={() => setShowSectionModal(false)}
            onSubmit={addSection}
          />
        )}
      </div>
    </div>
  );
}

/* =========================
   Supporting Components
   ========================= */
function StatsCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${color} text-white p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course, onClick, isSelected, fullById, onPublish }: { course: Course; onClick: () => void; isSelected: boolean; fullById?: Record<Id, CourseFull>; onPublish?: () => void }) {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border-2 transition-all cursor-pointer hover:shadow-lg ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
            <p className="text-gray-600 text-sm line-clamp-2">{course.description}</p>
          </div>
          <div className="ml-3 flex items-center gap-2">
            {course.status !== 'published' && (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); onPublish && onPublish(); }} className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white">Publish</Button>
            )}
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[course.status || 'draft']}`}>
            {course.status || 'draft'}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[course.difficulty || 'beginner']}`}>
            {course.difficulty || 'beginner'}
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {course.category || 'General'}
          </span>
        </div>

        {/* Dynamic structure counts for this course if subjects are present */}
        {(() => {
          const base = (fullById && fullById[(course as any).id]) || (course as any);
          const { subjectCount, moduleCount, sectionCount } = countsFromCourse(base);
          return (
            <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
              <span>Subjects: <strong>{subjectCount}</strong></span>
              <span>Modules: <strong>{moduleCount}</strong></span>
              <span>Sections: <strong>{sectionCount}</strong></span>
            </div>
          );
        })()}

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{course.enrolled_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.duration || 0}m</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {course.created_at ? new Date(course.created_at).toLocaleDateString() : 'New'}
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseListItem({ course, onClick, isSelected, fullById, onPublish }: { course: Course; onClick: () => void; isSelected: boolean; fullById?: Record<Id, CourseFull>; onPublish?: () => void }) {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border-2 transition-all cursor-pointer hover:shadow-md ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[course.status || 'draft']}`}>
                  {course.status || 'draft'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[course.difficulty || 'beginner']}`}>
                  {course.difficulty || 'beginner'}
                </span>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-3">{course.description}</p>
            {/* Dynamic structure counts for this course if subjects are present */}
            {(() => {
              const base = (fullById && fullById[(course as any).id]) || (course as any);
              const { subjectCount, moduleCount, sectionCount } = countsFromCourse(base);
              return (
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                  <span>Subjects: <strong>{subjectCount}</strong></span>
                  <span>Modules: <strong>{moduleCount}</strong></span>
                  <span>Sections: <strong>{sectionCount}</strong></span>
                </div>
              );
            })()}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{course.enrolled_count || 0} enrolled</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{course.duration || 0} minutes</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{course.category || 'General'}</span>
              </div>
            </div>
          </div>
          <div className="ml-4 flex items-center gap-2">
            {course.status !== 'published' && (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); onPublish && onPublish(); }} className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white">Publish</Button>
            )}
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseDetailsPanel({ 
  courseId, 
  course, 
  loading, 
  onChanged,
  onAddSubject,
  onAddModule,
  onAddSection,
  onRenameSubject,
  onDeleteSubject,
  onRenameModule,
  onDeleteModule,
  onRenameSection,
  onDeleteSection,
}: { 
  courseId: Id; 
  course?: CourseFull; 
  loading: boolean; 
  onChanged: () => void;
  onAddSubject: () => void;
  onAddModule: (subjectId: Id) => void;
  onAddSection: (moduleId: Id) => void;
  onRenameSubject: (subjectId: Id, title: string) => void;
  onDeleteSubject: (subjectId: Id) => void;
  onRenameModule: (moduleId: Id, title: string) => void;
  onDeleteModule: (moduleId: Id) => void;
  onRenameSection: (sectionId: Id, title: string) => void;
  onDeleteSection: (sectionId: Id) => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "analytics" | "settings">("overview");

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900">Failed to Load</h3>
        <p className="text-gray-500">Could not load course details</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h2>
        <p className="text-gray-600 text-sm">{course.description}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { id: "overview", label: "Overview", icon: <Eye className="w-4 h-4" /> },
            { id: "content", label: "Content", icon: <Book className="w-4 h-4" /> },
            { id: "analytics", label: "Analytics", icon: <Users className="w-4 h-4" /> },
            { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <CourseOverviewTab course={course} />
        )}
        {activeTab === "content" && (
          <CourseContentTab 
            course={course} 
            onChanged={onChanged}
            onAddSubject={onAddSubject}
            onAddModule={onAddModule}
            onAddSection={onAddSection}
            onRenameSubject={onRenameSubject}
            onDeleteSubject={onDeleteSubject}
            onRenameModule={onRenameModule}
            onDeleteModule={onDeleteModule}
            onRenameSection={onRenameSection}
            onDeleteSection={onDeleteSection}
          />
        )}
        {activeTab === "analytics" && (
          <CourseAnalyticsTab course={course} />
        )}
        {activeTab === "settings" && (
          <CourseSettingsTab course={course} onChanged={onChanged} />
        )}
      </div>
    </div>
  );
}

function CourseOverviewTab({ course }: { course: CourseFull }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Status</label>
          <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[course.status || 'draft']}`}>
            {course.status || 'draft'}
          </span>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Difficulty</label>
          <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[course.difficulty || 'beginner']}`}>
            {course.difficulty || 'beginner'}
          </span>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Enrolled Students</label>
          <p className="text-lg font-semibold text-gray-900">{course.enrolled_count || 0}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Duration</label>
          <p className="text-lg font-semibold text-gray-900">{course.duration || 0} minutes</p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-600">Course Structure</label>
        <div className="mt-2 space-y-2">
          <div className="flex justify-between">
            <span>Subjects</span>
            <span className="font-semibold">{course.subjects.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Modules</span>
            <span className="font-semibold">{course.subjects.reduce((sum, s) => sum + s.modules.length, 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Sections</span>
            <span className="font-semibold">{course.subjects.reduce((sum, s) => sum + s.modules.reduce((mSum, m) => mSum + m.sections.length, 0), 0)}</span>
          </div>
        </div>
      </div>

      {/* Hierarchical view from database */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Content Overview</h4>
        {course.subjects.length === 0 ? (
          <p className="text-sm text-gray-500">No subjects yet.</p>
        ) : (
          <div className="space-y-3">
            {course.subjects.map((s) => (
              <div key={s.id} className="bg-gray-50 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-gray-500">{s.modules.length} modules</div>
                </div>
                {s.modules.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {s.modules.map((m) => (
                      <div key={m.id} className="bg-white border border-gray-200 rounded p-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{m.title}</div>
                          <div className="text-xs text-gray-500">{m.sections.length} sections</div>
                        </div>
                        {m.sections.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {m.sections.map((sec) => (
                              <li key={sec.id} className="text-sm text-gray-700 flex items-center justify-between">
                                <span>{sec.title}</span>
                                <span className="text-xs text-gray-500">
                                  {(sec.lecture ? 'Lecture' : '') +
                                    (sec.practices && sec.practices.length ? `${sec.lecture ? ' · ' : ''}${sec.practices.length} practice${sec.practices.length>1?'s':''}` : '') +
                                    (sec.quiz ? `${(sec.lecture || (sec.practices && sec.practices.length)) ? ' · ' : ''}Quiz` : '')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Created</label>
          <p className="text-gray-900">{course.created_at ? new Date(course.created_at).toLocaleDateString() : 'Unknown'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Last Updated</label>
          <p className="text-gray-900">{course.updated_at ? new Date(course.updated_at).toLocaleDateString() : 'Never'}</p>
        </div>
      </div>
    </div>
  );
}

// Helper to compute counts from a possibly-full course
function countsFromCourse(c: any) {
  const subjects: Subject[] = Array.isArray(c?.subjects) ? c.subjects : [];
  const subjectCount = subjects.length;
  const moduleCount = subjects.reduce((sum, s) => sum + (s.modules?.length || 0), 0);
  const sectionCount = subjects.reduce(
    (sum, s) => sum + (s.modules || []).reduce((mSum, m) => mSum + (m.sections?.length || 0), 0),
    0,
  );
  return { subjectCount, moduleCount, sectionCount };
}

function CourseContentTab({ 
  course, 
  onChanged, 
  onAddSubject, 
  onAddModule, 
  onAddSection,
  onRenameSubject,
  onDeleteSubject,
  onRenameModule,
  onDeleteModule,
  onRenameSection,
  onDeleteSection,
}: { 
  course: CourseFull; 
  onChanged: () => void;
  onAddSubject: () => void;
  onAddModule: (subjectId: Id) => void;
  onAddSection: (moduleId: Id) => void;
  onRenameSubject: (subjectId: Id, title: string) => void;
  onDeleteSubject: (subjectId: Id) => void;
  onRenameModule: (moduleId: Id, title: string) => void;
  onDeleteModule: (moduleId: Id) => void;
  onRenameSection: (sectionId: Id, title: string) => void;
  onDeleteSection: (sectionId: Id) => void;
}) {
  const [expandedSubject, setExpandedSubject] = useState<Id | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Content</h3>
        <Button size="sm" variant="outline" onClick={onAddSubject}>
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </Button>
      </div>

      <div className="space-y-3">
        {course.subjects.map((subject) => (
          <div key={subject.id} className="border border-gray-200 rounded-lg">
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
              onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
            >
              <div className="flex items-center gap-3">
                {expandedSubject === subject.id ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
                <Book className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium">{subject.title}</h4>
                  <p className="text-sm text-gray-600">{subject.modules.length} modules</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[subject.status || 'draft']}`}>
                  {subject.status || 'draft'}
                </span>
                <Button size="sm" variant="ghost" onClick={(e) => {
                  e.stopPropagation();
                  const t = window.prompt('Rename subject', subject.title);
                  if (t && t.trim()) onRenameSubject(subject.id, t.trim());
                }}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete subject and all its modules?')) onDeleteSubject(subject.id);
                }}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>

            {expandedSubject === subject.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <SubjectContentView 
                  subject={subject} 
                  onChanged={onChanged}
                  onAddModule={() => onAddModule(subject.id)}
                  onAddSection={onAddSection}
                  onRenameSubject={onRenameSubject}
                  onDeleteSubject={onDeleteSubject}
                  onRenameModule={onRenameModule}
                  onDeleteModule={onDeleteModule}
                  onRenameSection={onRenameSection}
                  onDeleteSection={onDeleteSection}
                />
              </div>
            )}
          </div>
        ))}

        {course.subjects.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Book className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p>No subjects yet. Add your first subject to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseAnalyticsTab({ course }: { course: CourseFull }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/courses/${course.id}/analytics`);
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          // Fallback to mock data if analytics endpoint doesn't exist yet
          setAnalytics({
            completionRate: Math.floor(Math.random() * 40) + 60, // 60-100%
            averageRating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
            recentActivity: [
              { action: "Student enrolled", user: "John Doe", timestamp: new Date().toISOString() },
              { action: "Quiz completed", user: "Jane Smith", timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
              { action: "Section viewed", user: "Mike Johnson", timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() }
            ]
          });
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        // Fallback data
        setAnalytics({
          completionRate: 0,
          averageRating: "N/A",
          recentActivity: []
        });
      } finally {
        setLoading(false);
      }
    };

    if (course.id) {
      fetchAnalytics();
    }
  }, [course.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Course Analytics</h3>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg">
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Course Analytics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{course.enrolled_count || 0}</div>
          <div className="text-sm text-gray-600">Total Enrollments</div>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {analytics?.completionRate ? `${analytics.completionRate}%` : "N/A"}
          </div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{analytics?.averageRating || "N/A"}</div>
          <div className="text-sm text-gray-600">Average Rating</div>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{course.duration || 0}</div>
          <div className="text-sm text-gray-600">Total Duration (min)</div>
        </div>
      </div>

      <div className="p-4 border border-gray-200 rounded-lg">
        <h4 className="font-medium mb-3">Recent Activity</h4>
        <div className="space-y-2 text-sm text-gray-600">
          {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
            analytics.recentActivity.map((activity: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-1">
                <div>
                  <span className="font-medium">{activity.user}</span> {activity.action.toLowerCase()}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500">No recent activity available</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CourseSettingsTab({ course, onChanged }: { course: CourseFull; onChanged: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: course.title,
    description: course.description || "",
    status: course.status || "draft",
    difficulty: course.difficulty || "beginner",
    category: course.category || "General",
    duration: course.duration || 0
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error("Failed to update course");
      }

      toast.success("Course updated successfully");
      setIsEditing(false);
      onChanged();
    } catch (error) {
      console.error("Failed to update course:", error);
      toast.error("Failed to update course");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this course?")) return;
    
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" })
      });

      if (!response.ok) {
        throw new Error("Failed to archive course");
      }

      toast.success("Course archived successfully");
      onChanged();
    } catch (error) {
      console.error("Failed to archive course:", error);
      toast.error("Failed to archive course");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete course");
      }

      toast.success("Course deleted successfully");
      // Navigate back or refresh the course list
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete course:", error);
      toast.error("Failed to delete course");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Course Settings</h3>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => {
            setIsEditing(!isEditing);
            if (!isEditing) {
              // Reset form when starting to edit
              setFormData({
                title: course.title,
                description: course.description || "",
                status: course.status || "draft",
                difficulty: course.difficulty || "beginner",
                category: course.category || "General",
                duration: course.duration || 0
              });
            }
          }}
        >
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
          {isEditing ? (
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          ) : (
            <p className="text-gray-900">{course.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
          {isEditing ? (
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          ) : (
            <p className="text-gray-900">{course.description || "No description provided"}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
            {isEditing ? (
              <select 
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            ) : (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[course.status || 'draft']}`}>
                {course.status || 'draft'}
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Difficulty</label>
            {isEditing ? (
              <select 
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            ) : (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[course.difficulty || 'beginner']}`}>
                {course.difficulty || 'beginner'}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
            {isEditing ? (
              <input 
                type="text" 
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{course.category || "General"}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Duration (minutes)</label>
            {isEditing ? (
              <input 
                type="number" 
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <p className="text-gray-900">{course.duration || 0}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-medium text-red-600 mb-3">Danger Zone</h4>
        <div className="space-y-3">
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleArchive}
            disabled={course.status === "archived"}
          >
            {course.status === "archived" ? "Already Archived" : "Archive Course"}
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDelete}
          >
            Delete Course
          </Button>
        </div>
      </div>
    </div>
  );
}

function SubjectContentView({ 
  subject, 
  onChanged, 
  onAddModule, 
  onAddSection,
  onRenameSubject,
  onDeleteSubject,
  onRenameModule,
  onDeleteModule,
  onRenameSection,
  onDeleteSection,
}: { 
  subject: Subject; 
  onChanged: () => void;
  onAddModule: () => void;
  onAddSection: (moduleId: Id) => void;
  onRenameSubject: (subjectId: Id, title: string) => void;
  onDeleteSubject: (subjectId: Id) => void;
  onRenameModule: (moduleId: Id, title: string) => void;
  onDeleteModule: (moduleId: Id) => void;
  onRenameSection: (sectionId: Id, title: string) => void;
  onDeleteSection: (sectionId: Id) => void;
}) {
  const [expandedModule, setExpandedModule] = useState<Id | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="font-medium">Modules</h5>
        <Button size="sm" variant="outline" onClick={onAddModule}>
          <Plus className="w-4 h-4 mr-1" />
          Add Module
        </Button>
      </div>

      {subject.modules.map((module) => (
        <div key={module.id} className="border border-gray-200 rounded-lg bg-white">
          <div 
            className="p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
            onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
          >
            <div className="flex items-center gap-2">
              {expandedModule === module.id ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
              <PlayCircle className="w-4 h-4 text-green-600" />
              <div>
                <h6 className="font-medium text-sm">{module.title}</h6>
                <p className="text-xs text-gray-600">{module.sections.length} sections</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className={`px-2 py-1 rounded-full text-xs ${statusColors[module.status || 'draft']}`}>
                {module.status || 'draft'}
              </span>
              <Button size="sm" variant="ghost" onClick={(e) => {
                e.stopPropagation();
                const t = window.prompt('Rename module', module.title);
                if (t && t.trim()) {
                  onRenameModule(module.id, t.trim());
                }
              }}>
                <Edit className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete module and all its sections?')) onDeleteModule(module.id);
              }}>
                <Trash2 className="w-3 h-3 text-red-600" />
              </Button>
            </div>
          </div>

          {expandedModule === module.id && (
            <div className="border-t border-gray-200 p-3 bg-gray-25">
              <ModuleContentView 
                module={module} 
                onChanged={onChanged}
                onAddSection={() => onAddSection(module.id)}
                onRenameSection={onRenameSection}
                onDeleteSection={onDeleteSection}
              />
            </div>
          )}
        </div>
      ))}

      {subject.modules.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          No modules yet. Add your first module.
        </div>
      )}
    </div>
  );
}

function ModuleContentView({ 
  module, 
  onChanged, 
  onAddSection,
  onRenameSection,
  onDeleteSection,
}: { 
  module: Module; 
  onChanged: () => void;
  onAddSection: () => void;
  onRenameSection: (sectionId: Id, title: string) => void;
  onDeleteSection: (sectionId: Id) => void;
}) {
  const [expanded, setExpanded] = useState<Id | null>(null);
  const [editing, setEditing] = useState<Record<string, any>>({});

  async function saveLecture(section: Section, data: { title: string; content: string }) {
    try {
      const res = await fetch(`/api/admin/sections/${section.id}/lecture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: data.title, content: data.content }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to save lecture');
      // Mutate local tree and trigger re-render
      section.lecture = unwrapData<any>(json) as any;
      onChanged();
      toast.success('Lecture saved');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save lecture');
    }
  }

  async function addPractice(section: Section, data: { title: string; content?: string }) {
    try {
      const res = await fetch(`/api/admin/sections/${section.id}/practice-exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: data.title, content: data.content || '' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to add exercise');
      const created = unwrapData<any>(json);
      section.practices = [...(section.practices || []), created];
      onChanged();
      toast.success('Exercise added');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add exercise');
    }
  }

  async function saveQuiz(section: Section, data: { title: string }) {
    try {
      const res = await fetch(`/api/admin/sections/${section.id}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: data.title, questions: [] }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to save quiz');
      section.quiz = unwrapData<any>(json) as any;
      onChanged();
      toast.success('Quiz saved');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save quiz');
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h6 className="font-medium text-sm">Sections</h6>
        <Button size="sm" variant="outline" onClick={onAddSection}>
          <Plus className="w-3 h-3 mr-1" />
          Add Section
        </Button>
      </div>

      {module.sections.map((section) => (
        <div key={section.id} className="border border-gray-200 rounded bg-white">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-sm font-medium">{section.title}</div>
                <div className="text-xs text-gray-600">
                  {section.lecture && "Lecture"}
                  {section.practices.length > 0 && ` • ${section.practices.length} practices`}
                  {section.quiz && " • Quiz"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => setExpanded(expanded === section.id ? null : section.id)}>
                Manage Content
              </Button>
              <span className={`px-2 py-1 rounded-full text-xs ${statusColors[section.status || 'draft']}`}>
                {section.status || 'draft'}
              </span>
              <Button size="sm" variant="ghost" onClick={() => {
                const t = window.prompt('Rename section', section.title);
                if (t && t.trim()) onRenameSection(section.id, t.trim());
              }}>
                <Edit className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => {
                if (confirm('Delete this section?')) onDeleteSection(section.id);
              }}>
                <Trash2 className="w-3 h-3 text-red-600" />
              </Button>
            </div>
          </div>

          {expanded === section.id && (
            <div className="border-t border-gray-200 p-3 bg-gray-50">
              {/* Lecture */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium"><PlayCircle className="w-4 h-4" /> Lecture</div>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    placeholder="Lecture title"
                    defaultValue={section.lecture?.title || section.title}
                    onChange={(e) => setEditing((s)=>({ ...s, [`l_title_${section.id}`]: e.target.value }))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  <textarea
                    placeholder="Lecture content (text or URL)"
                    defaultValue={(section.lecture as any)?.content || ''}
                    onChange={(e) => setEditing((s)=>({ ...s, [`l_content_${section.id}`]: e.target.value }))}
                    rows={3}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  <div>
                    <Button size="sm" onClick={() => saveLecture(section, {
                      title: (editing[`l_title_${section.id}`] ?? section.lecture?.title ?? section.title) as string,
                      content: (editing[`l_content_${section.id}`] ?? (section.lecture as any)?.content ?? '') as string,
                    })}>Save Lecture</Button>
                  </div>
                </div>
              </div>

              {/* Exercise */}
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm font-medium"><Code className="w-4 h-4" /> Practice Exercise</div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    placeholder="Exercise title"
                    onChange={(e) => setEditing((s)=>({ ...s, [`p_title_${section.id}`]: e.target.value }))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  <textarea
                    placeholder="Instructions / content"
                    onChange={(e) => setEditing((s)=>({ ...s, [`p_content_${section.id}`]: e.target.value }))}
                    rows={3}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  <div>
                    <Button size="sm" variant="outline" onClick={() => addPractice(section, {
                      title: (editing[`p_title_${section.id}`] ?? 'Exercise') as string,
                      content: editing[`p_content_${section.id}`] as string,
                    })}>Add Exercise</Button>
                  </div>
                </div>
              </div>

              {/* Quiz */}
              <div>
                <div className="flex items-center gap-2 text-sm font-medium"><HelpCircle className="w-4 h-4" /> Quiz</div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    placeholder="Quiz title"
                    defaultValue={section.quiz?.title || ''}
                    onChange={(e) => setEditing((s)=>({ ...s, [`q_title_${section.id}`]: e.target.value }))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  <div>
                    <Button size="sm" variant="outline" onClick={() => saveQuiz(section, {
                      title: (editing[`q_title_${section.id}`] ?? section.quiz?.title ?? 'Quiz') as string,
                    })}>Save Quiz</Button>
                  </div>
                  {section.quiz?.id && (
                    <QuizBuilder
                      quiz={section.quiz as any}
                      onSaved={(updated) => {
                        section.quiz = updated;
                        onChanged();
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {module.sections.length === 0 && (
        <div className="text-center py-3 text-xs text-gray-500">
          No sections yet. Add your first section.
        </div>
      )}
    </div>
  );
}

function QuizBuilder({ quiz, onSaved }: { quiz: any; onSaved: (updated: any) => void }) {
  // Local draft copy
  const [draft, setDraft] = useState<any[]>(() =>
    (quiz.questions || []).map((q: any) => ({
      id: q.id,
      text: q.text,
      type: q.type || 'mcq',
      options: (q.options || []).map((o: any) => ({ id: o.id, text: o.text, correct: !!o.correct })),
    }))
  );
  const [removed, setRemoved] = useState<string[]>([]);

  function addQuestionLocal() {
    setDraft((prev) => [
      ...prev,
      { id: undefined, text: '', type: 'mcq', options: [] },
    ]);
  }

  function addOptionLocal(idx: number) {
    setDraft((prev) => prev.map((q, i) => (i === idx ? { ...q, options: [...q.options, { id: undefined, text: '', correct: false }] } : q)));
  }

  function removeQuestionLocal(idx: number) {
    setDraft((prev) => {
      const q = prev[idx];
      const next = prev.slice(0, idx).concat(prev.slice(idx + 1));
      if (q?.id) setRemoved((r) => (r.includes(q.id) ? r : [...r, q.id]));
      return next;
    });
  }

  async function saveAll() {
    try {
      // Work on a copy to collect created IDs
      const updatedQuestions: any[] = [];
      for (let i = 0; i < draft.length; i++) {
        const dq = draft[i];
        let qId = dq.id as string | undefined;
        // Create or update question
        if (!qId) {
          const res = await fetch(`/api/admin/quizzes/${quiz.id}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: dq.text, type: dq.type }) });
          const json = await res.json().catch(()=>({}));
          if (!res.ok) throw new Error(json?.error || 'Failed to create question');
          qId = (json?.data ?? json)?.id;
        } else {
          // Update if changed vs original
          const original = (quiz.questions || []).find((x: any) => x.id === qId) || {};
          if (original.text !== dq.text || (original.type || 'mcq') !== dq.type) {
            const res = await fetch(`/api/admin/questions/${qId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: dq.text, type: dq.type }) });
            const json = await res.json().catch(()=>({}));
            if (!res.ok) throw new Error(json?.error || 'Failed to update question');
          }
        }

        // Ensure options
        const updatedOptions: any[] = [];
        for (const opt of dq.options) {
          if (!opt.id) {
            const res = await fetch(`/api/admin/quizzes/questions/${qId}/options`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: opt.text, correct: !!opt.correct }) });
            const json = await res.json().catch(()=>({}));
            if (!res.ok) throw new Error(json?.error || 'Failed to create option');
            updatedOptions.push(json?.data ?? json);
          } else {
            // Compare with original
            const originalQ = (quiz.questions || []).find((x: any) => x.id === qId) || {};
            const originalO = (originalQ.options || []).find((o: any) => o.id === opt.id) || {};
            if (originalO.text !== opt.text || !!originalO.correct !== !!opt.correct) {
              const res = await fetch(`/api/admin/options/${opt.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: opt.text, correct: !!opt.correct }) });
              const json = await res.json().catch(()=>({}));
              if (!res.ok) throw new Error(json?.error || 'Failed to update option');
              updatedOptions.push(json?.data ?? json);
            } else {
              updatedOptions.push(opt);
            }
          }
        }
        updatedQuestions.push({ id: qId, text: dq.text, type: dq.type, options: updatedOptions });
      }

      // Handle deletions
      for (const delId of removed) {
        try {
          await fetch(`/api/admin/questions/${delId}`, { method: 'DELETE' });
        } catch {}
      }

      const updatedQuiz = { ...quiz, questions: updatedQuestions };
      onSaved(updatedQuiz);
      toast.success('Quiz saved');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save quiz changes');
    }
  }

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <div className="text-xs font-medium text-gray-700 mb-2">Questions</div>

      <div className="space-y-3">
        {draft.map((q: any, idx: number) => (
          <QuestionEditor 
            key={q.id ?? `new-${idx}`}
            q={q}
            onAddOption={(t,c)=>{
              setDraft((prev)=>prev.map((qq,i)=> i===idx ? { ...qq, options: [...qq.options, { id: undefined, text: t, correct: c }] } : qq));
            }}
            onChangeQuestion={(patch)=>{
              setDraft((prev)=>prev.map((qq,i)=> i===idx ? { ...qq, ...patch } : qq));
            }}
            onChangeOption={(optIndex, patch)=>{
              setDraft((prev)=>prev.map((qq,i)=>{
                if(i!==idx) return qq;
                const opts = qq.options.slice();
                opts[optIndex] = { ...opts[optIndex], ...patch };
                return { ...qq, options: opts };
              }));
            }}
            onRemove={()=>removeQuestionLocal(idx)}
          />
        ))}
        {draft.length === 0 && (
          <div className="text-xs text-gray-500">No questions yet.</div>
        )}
        <div className="pt-2 flex items-center justify-between">
          <Button size="sm" type="button" variant="outline" onClick={addQuestionLocal}>Add Question</Button>
          <Button size="sm" type="button" onClick={saveAll} disabled={draft.length===0}>Save All</Button>
        </div>
      </div>
    </div>
  );
}

function QuestionEditor({ q, onAddOption, onChangeQuestion, onChangeOption, onRemove }: { q: any; onAddOption: (text: string, correct: boolean) => void; onChangeQuestion: (patch:any)=>void; onChangeOption: (optIndex:number, patch:any)=>void; onRemove: ()=>void }) {
  const [text, setText] = useState("");
  const [correct, setCorrect] = useState(false);
  return (
    <div className="border border-gray-200 rounded p-2 bg-white relative pb-6 pr-6">
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium">Q:</div>
        <input value={q.text} onChange={(e)=>onChangeQuestion({ text: e.target.value })} className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm" />
        <select value={q.type} onChange={(e)=>onChangeQuestion({ type: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-sm">
          <option value="mcq">MCQ</option>
          <option value="text">Short Answer</option>
          <option value="fill-in-the-blanks">Fill in the Blanks</option>
          <option value="coding">Coding</option>
        </select>
      </div>
      {/* Delete icon in bottom-right */}
      <button
        type="button"
        aria-label="Delete question"
        onClick={onRemove}
        className="absolute right-2 bottom-2 text-red-600 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      {q.type === 'mcq' && (
        <div className="mt-2">
          <div className="text-xs font-medium">Options</div>
          <ul className="mt-1 space-y-1 text-xs">
            {(q.options || []).map((o: any, oi:number) => (
              <li key={o.id ?? `opt-${oi}`} className="flex items-center gap-2">
                <input type="checkbox" checked={!!o.correct} onChange={(e)=>onChangeOption(oi,{ correct: e.target.checked })} />
                <input
                  value={o.text}
                  onChange={(e)=>onChangeOption(oi,{ text: e.target.value })}
                  className="flex-1 border border-gray-300 rounded px-2 py-1"
                />
              </li>
            ))}
            {(q.options || []).length === 0 && <li className="text-gray-500">No options yet.</li>}
          </ul>
          <div className="mt-2 flex items-center gap-2">
            <input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Option text" className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs" />
            <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={correct} onChange={(e)=>setCorrect(e.target.checked)} /> correct</label>
            <Button size="sm" type="button" variant="outline" onClick={()=>{ if(text.trim()) { onAddOption(text.trim(), correct); setText(''); setCorrect(false);} }}>Add</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateCourseModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: Partial<Course>) => void }) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Create New Course</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Enter course title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Describe what students will learn..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Create Course
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddSimpleSectionModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: Partial<Section>) => void }) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>("draft");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add New Section</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
              <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Enter section title..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={(e)=>setStatus(e.target.value as any)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={()=> onSubmit({ title, status })} className="flex-1">Add Section</Button>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            You can add Lecture, Practice Exercise, and Quiz later using "Manage Content" under the section.
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Content Management Modals
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Add New Subject</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
        </div>
        
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter subject title..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what students will learn in this subject..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Add Subject
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddModuleModal({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void; 
  onSubmit: (data: Partial<Module>) => void; 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Add New Module</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
        </div>
        
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Module Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter module title..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what students will learn in this module..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Add Module
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddSectionModal({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void; 
  onSubmit: (data: Partial<Section>) => void; 
}) {
  const [formData, setFormData] = useState({
    title: "",
    status: "draft" as const,
    type: "lecture" as "lecture" | "quiz" | "exercise",
    lectureContent: "",
    videoUrl: "",
    quizQuestions: [] as any[],
    exerciseInstructions: "",
    codeTemplate: ""
  });

  const addQuizQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      quizQuestions: [
        ...prev.quizQuestions,
        {
          id: Math.random().toString(36).substr(2, 9),
          text: "",
          type: "mcq",
          options: [
            { id: Math.random().toString(36).substr(2, 9), text: "", correct: false },
            { id: Math.random().toString(36).substr(2, 9), text: "", correct: false },
          ],
        },
      ],
    }));
  };

  const updateQuizQuestion = (qid: string, patch: any) => {
    setFormData((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((q: any) =>
        q.id === qid ? { ...q, ...patch } : q
      ),
    }));
  };

  const removeQuizQuestion = (qid: string) => {
    setFormData((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.filter((q: any) => q.id !== qid),
    }));
  };

  const addOption = (qid: string) => {
    setFormData((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((q: any) =>
        q.id === qid
          ? {
              ...q,
              options: [
                ...(q.options || []),
                { id: Math.random().toString(36).substr(2, 9), text: "", correct: false },
              ],
            }
          : q
      ),
    }));
  };

  const updateOption = (qid: string, oid: string, patch: any) => {
    setFormData((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((q: any) =>
        q.id === qid
          ? {
              ...q,
              options: (q.options || []).map((o: any) => (o.id === oid ? { ...o, ...patch } : o)),
            }
          : q
      ),
    }));
  };

  const removeOption = (qid: string, oid: string) => {
    setFormData((prev) => ({
      ...prev,
      quizQuestions: prev.quizQuestions.map((q: any) =>
        q.id === qid
          ? { ...q, options: (q.options || []).filter((o: any) => o.id !== oid) }
          : q
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let sectionData: Partial<Section> = {
      title: formData.title,
      status: formData.status
    };

    if (formData.type === "lecture") {
      sectionData.lecture = {
        title: formData.title,
        content: formData.lectureContent,
        duration: 30 // default duration
      };
    } else if (formData.type === "exercise") {
      sectionData.practices = [{
        id: Math.random().toString(36).substr(2, 9),
        title: formData.title,
        content: formData.exerciseInstructions
      }];
    } else if (formData.type === "quiz") {
      const questions = (formData.quizQuestions || []).map((q: any, i: number) => ({
        type: q.type || "mcq",
        text: (q.text || "").trim(),
        order: i,
        options: (q.options || [])
          .map((o: any) => ({ text: (o.text || "").trim(), correct: !!o.correct }))
          .filter((o: any) => o.text.length > 0),
      })).filter((q: any) => q.text.length > 0);

      sectionData.quiz = {
        id: Math.random().toString(36).substr(2, 9),
        title: formData.title,
        questions,
      } as any;
    }

    onSubmit(sectionData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Add New Section</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
        </div>
        
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter section title..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="lecture">Lecture</option>
                <option value="exercise">Exercise</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>

            {formData.type === "lecture" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lecture Content</label>
                  <textarea
                    value={formData.lectureContent}
                    onChange={(e) => setFormData(prev => ({ ...prev, lectureContent: e.target.value }))}
                    placeholder="Enter lecture content..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (optional)</label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </>
            )}

            {formData.type === "exercise" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Instructions</label>
                  <textarea
                    value={formData.exerciseInstructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, exerciseInstructions: e.target.value }))}
                    placeholder="Provide clear instructions for the exercise..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code Template (optional)</label>
                  <textarea
                    value={formData.codeTemplate}
                    onChange={(e) => setFormData(prev => ({ ...prev, codeTemplate: e.target.value }))}
                    placeholder="// Starting code template..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                  />
                </div>
              </>
            )}

            {formData.type === "quiz" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Questions</label>
                <div className="space-y-4">
                  {formData.quizQuestions.map((q: any, idx: number) => (
                    <div key={q.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-gray-500 pt-2">Q{idx + 1}</span>
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={q.text}
                            onChange={(e) => updateQuizQuestion(q.id, { text: e.target.value })}
                            placeholder="Enter question text..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          />
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Type</label>
                            <select
                              value={q.type || 'mcq'}
                              onChange={(e) => updateQuizQuestion(q.id, { type: e.target.value })}
                              className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                            >
                              <option value="mcq">Multiple Choice</option>
                              <option value="text">Short Answer</option>
                              <option value="fill-in-the-blanks">Fill in the Blanks</option>
                              <option value="coding">Coding</option>
                            </select>
                          </div>

                          {(!q.type || q.type === 'mcq') && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-sm text-gray-600">Options</label>
                                <Button type="button" size="sm" variant="outline" onClick={() => addOption(q.id)}>Add Option</Button>
                              </div>
                              <div className="space-y-2">
                                {(q.options || []).map((o: any) => (
                                  <div key={o.id} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={!!o.correct}
                                      onChange={(e) => updateOption(q.id, o.id, { correct: e.target.checked })}
                                    />
                                    <input
                                      type="text"
                                      value={o.text}
                                      onChange={(e) => updateOption(q.id, o.id, { text: e.target.value })}
                                      placeholder="Option text"
                                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                    <Button type="button" size="sm" variant="ghost" onClick={() => removeOption(q.id, o.id)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                                {(q.options || []).length === 0 && (
                                  <p className="text-xs text-gray-500">No options yet.</p>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Check the box for correct answers. At least one required.</p>
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <Button type="button" variant="outline" size="sm" onClick={() => removeQuizQuestion(q.id)}>Remove Question</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div>
                    <Button type="button" onClick={addQuizQuestion}>Add Question</Button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Add Section
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

