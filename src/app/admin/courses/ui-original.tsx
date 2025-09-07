"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

/* =========================
   Types
   ========================= */
type Id = string;

type Lecture = { title: string; content: string };
type Quiz = { id: Id; title: string; questions?: Question[] } | null;
type Practice = { id: Id; title: string; content?: string; deleted?: boolean };
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
};
type Module = { id: Id; title: string; sections: Section[]; deleted?: boolean };
type Subject = {
  id: Id;
  title: string;
  modules: Module[];
  created_at?: string;
  updated_at?: string;
  deleted?: boolean;
};
type Course = { id: Id; title: string; description?: string };
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
    subjects: Array.isArray(c.subjects) ? c.subjects : [],
  };
}

/* =========================
   Page / Root Component
   ========================= */
export function CourseManager({ initialCourses }: { initialCourses: Course[] }) {
  const [courses, setCourses] = useState<Course[]>(initialCourses || []);
  const [loadingId, setLoadingId] = useState<Id | null>(null);
  const [expanded, setExpanded] = useState<Record<Id, boolean>>({});
  const [full, setFull] = useState<Record<Id, CourseFull>>({});
  const [newCourse, setNewCourse] = useState({ title: "", description: "" });

  const createCourse = async () => {
    if (!newCourse.title.trim()) return toast.error("Title is required");
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCourse.title.trim(),
          description: newCourse.description.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to create course");

      const created = unwrapData<Course>(json);
      setCourses((prev) => [created, ...prev]);
      setNewCourse({ title: "", description: "" });
      toast.success("Course created");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create course");
    }
  };

  const toggleExpand = async (id: Id) => {
    setExpanded((s) => ({ ...s, [id]: !s[id] }));

    if (!full[id]) {
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
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Left: create course */}
      <div className="rounded-xl border border-border bg-white/70 p-4 backdrop-blur">
        <div className="text-base font-semibold">New Course</div>
        <div className="mt-3 grid gap-2">
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            placeholder="Title"
            value={newCourse.title}
            onChange={(e) =>
              setNewCourse((s) => ({ ...s, title: e.target.value }))
            }
          />
          <textarea
            className="min-h-20 w-full rounded-md border border-border px-3 py-2 text-sm"
            placeholder="Description"
            value={newCourse.description}
            onChange={(e) =>
              setNewCourse((s) => ({ ...s, description: e.target.value }))
            }
          />
          <div>
            <Button size="sm" onClick={createCourse}>
              Create
            </Button>
          </div>
        </div>
      </div>

      {/* Right: table + expanded rows */}
      <div className="lg:col-span-2 rounded-xl border border-border bg-white/70 p-4 backdrop-blur">
        <div className="text-base font-semibold">Courses</div>
        <div className="mt-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-2 text-left font-medium">Title</th>
                <th className="p-2 text-left font-medium">Description</th>
                <th className="p-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-border">
                  <td className="p-2">{c.title}</td>
                  <td className="p-2">{c.description}</td>
                  <td className="p-2">
                    <Button size="sm" onClick={() => toggleExpand(c.id)}>
                      {expanded[c.id] ? "Collapse" : "View"}
                    </Button>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="p-2 text-center text-muted-foreground"
                  >
                    No courses yet. Create one on the left.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {courses.map(
          (c) =>
            expanded[c.id] && (
              <div
                key={c.id}
                className="mt-4 rounded-xl border border-border bg-white/70 p-4 backdrop-blur"
              >
                {loadingId === c.id && (
                  <div className="text-xs text-muted-foreground">Loading...</div>
                )}
                {full[c.id] && (
                  <CourseFullView
                    course={full[c.id]}
                    onChanged={() => setFull((f) => ({ ...f }))}
                    onCourseMetaUpdated={(patch) => {
                      setCourses((prev) =>
                        prev.map((x) => (x.id === c.id ? { ...x, ...patch } : x))
                      );
                      setFull((f) => ({
                        ...f,
                        [c.id]: { ...(f[c.id] || {}), ...patch },
                      }));
                    }}
                    onCourseDeleted={() => {
                      setCourses((prev) => prev.filter((x) => x.id !== c.id));
                      setFull((f) => {
                        const n = { ...f };
                        delete (n as any)[c.id];
                        return n;
                      });
                      setExpanded((e) => ({ ...e, [c.id]: false }));
                    }}
                  />
                )}
              </div>
            )
        )}
      </div>
    </div>
  );
}

/* =========================
   Course Full
   ========================= */
function CourseFullView({
  course,
  onChanged,
  onCourseMetaUpdated,
  onCourseDeleted,
}: {
  course: CourseFull;
  onChanged: () => void;
  onCourseMetaUpdated: (p: { title?: string; description?: string }) => void;
  onCourseDeleted: () => void;
}) {
  const [subjectTitle, setSubjectTitle] = useState("");
  const [meta, setMeta] = useState({
    title: course.title || "",
    description: course.description || "",
  });

  const saveMeta = async () => {
    if (!meta.title.trim()) return toast.error("Title is required");
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meta.title.trim(),
          description: meta.description.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to update course");

      const updated = unwrapData<Course>(json);
      onCourseMetaUpdated({
        title: updated.title,
        description: updated.description,
      });
      toast.success("Course updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update course");
    }
  };

  const deleteCourse = async () => {
    if (!confirm("Delete this course and all its content? This cannot be undone."))
      return;
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to delete course");
      onCourseDeleted();
      toast.success("Course deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete course");
    }
  };

  const addSubject = async () => {
    if (!subjectTitle.trim()) return toast.error("Subject title required");
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: subjectTitle.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(json?.error || `Failed to create subject (${res.status})`);

      // ✅ handle both { data: {...} } and flat responses
      const subjectData = unwrapData<Subject>(json);

      if (!subjectData?.id || !subjectData?.title) {
        throw new Error("Invalid subject data received from API");
      }

      const nextSubjects = [
        ...(course.subjects ?? []),
        {
          id: subjectData.id,
          title: subjectData.title,
          modules: [],
          created_at: subjectData.created_at ?? new Date().toISOString(),
          updated_at: subjectData.updated_at ?? new Date().toISOString(),
        } as Subject,
      ];

      // Assign immutably (still fine in this prop-driven setup)
      (course as any).subjects = nextSubjects;

      setSubjectTitle("");
      onChanged();
      toast.success("Subject added");
    } catch (e: any) {
      toast.error(e?.message || "Failed to add subject");
    }
  };

  const visibleSubjects = (course.subjects ?? []).filter((s) => !s?.deleted);
  
  return (
    <div className="grid gap-3">
      <div className="rounded-md border border-border p-3">
        <div className="text-sm font-semibold">Course Details</div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground">Title</label>
            <input
              className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
              value={meta.title}
              onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Description</label>
            <input
              className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
              value={meta.description}
              onChange={(e) =>
                setMeta((m) => ({ ...m, description: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Button size="sm" onClick={saveMeta}>
            Save
          </Button>
          <Button size="sm" variant="destructive" onClick={deleteCourse}>
            Delete Course
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border p-3">
        <div className="text-sm font-semibold">Subjects</div>
        <div className="mt-2 flex items-center gap-2">
          <input
            className="w-64 rounded-md border border-border px-2 py-1 text-sm"
            placeholder="New subject title"
            value={subjectTitle}
            onChange={(e) => setSubjectTitle(e.target.value)}
          />
          <Button size="sm" onClick={addSubject}>
            Add Subject
          </Button>
        </div>

        <div className="mt-2 space-y-2">
          {visibleSubjects.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No subjects yet. Add a subject above to get started.
            </div>
          ) : (
            visibleSubjects.map((s) => (
              <SubjectItem key={s.id} subject={s} onChanged={onChanged} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Subject
   ========================= */
function SubjectItem({ subject, onChanged }: { subject: Subject; onChanged: () => void }) {
  const [title, setTitle] = useState("");
  const [rename, setRename] = useState(subject.title || "");

  const addModule = async () => {
    if (!title.trim()) return toast.error("Module title required");
    if (!subject.id) return toast.error("Subject ID is missing. Please refresh the page.");
    
    try {
      const res = await fetch(`/api/admin/subjects/${subject.id}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to add module");

      const moduleData = unwrapData<Module>(json);
      if (!moduleData?.id) throw new Error("Module created but missing ID");

      const nextModules = [
        ...(subject.modules ?? []),
        { id: moduleData.id, title: moduleData.title, sections: [] as Section[] },
      ];
      (subject as any).modules = nextModules;

      setTitle("");
      onChanged();
      toast.success("Module added");
    } catch (e: any) {
      toast.error(e?.message || "Failed to add module");
    }
  };

  const saveRename = async () => {
    if (!rename.trim()) return toast.error("Title required");
    try {
      const res = await fetch(`/api/admin/subjects/${subject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: rename.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to rename subject");

      const updated = unwrapData<Subject>(json);
      (subject as any).title = updated.title;
      onChanged();
      toast.success("Subject renamed");
    } catch (e: any) {
      toast.error(e?.message || "Failed to rename subject");
    }
  };

  const deleteSubject = async () => {
    if (!confirm("Delete this subject and all its modules/sections?")) return;
    try {
      const res = await fetch(`/api/admin/subjects/${subject.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to delete subject");
      (subject as any).deleted = true;
      onChanged();
      toast.success("Subject deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete subject");
    }
  };

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">{subject.title}</div>
        <div className="flex items-center gap-2">
          <input
            className="w-52 rounded-md border border-border px-2 py-1 text-sm"
            value={rename}
            onChange={(e) => setRename(e.target.value)}
          />
          <Button size="sm" onClick={saveRename}>
            Rename
          </Button>
          <Button size="sm" variant="destructive" onClick={deleteSubject}>
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-border p-3">
        <div className="text-sm font-semibold">Modules</div>
        <div className="mt-2 flex items-center gap-2">
          <input
            className="w-64 rounded-md border border-border px-2 py-1 text-sm"
            placeholder="New module title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button size="sm" onClick={addModule}>
            Add Module
          </Button>
        </div>
        <div className="mt-2 space-y-2">
          {(subject.modules || [])
            .filter((m) => !m.deleted)
            .map((m) => <ModuleItem key={m.id} module={m} onChanged={onChanged} />)}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Module
   ========================= */
function ModuleItem({ module, onChanged }: { module: Module; onChanged: () => void }) {
  const [title, setTitle] = useState("");
  const [rename, setRename] = useState(module.title || "");

  const addSection = async () => {
    if (!title.trim()) return toast.error("Section title required");
    try {
      const res = await fetch(`/api/admin/modules/${module.id}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to add section");

      const sectionData = unwrapData<Section>(json);
      if (!sectionData?.id) throw new Error("Section created but missing ID");

      const nextSections = [
        ...(module.sections ?? []),
        { id: sectionData.id, title: sectionData.title, lecture: null, practices: [], quiz: null } as Section,
      ];
      (module as any).sections = nextSections;

      setTitle("");
      onChanged();
      toast.success("Section added");
    } catch (e: any) {
      toast.error(e?.message || "Failed to add section");
    }
  };

  const saveRename = async () => {
    if (!rename.trim()) return toast.error("Title required");
    try {
      const res = await fetch(`/api/admin/modules/${module.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: rename.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to rename module");

      const updated = unwrapData<Module>(json);
      (module as any).title = updated.title;
      onChanged();
      toast.success("Module renamed");
    } catch (e: any) {
      toast.error(e?.message || "Failed to rename module");
    }
  };

  const deleteModule = async () => {
    if (!confirm("Delete this module and all its sections?")) return;
    try {
      const res = await fetch(`/api/admin/modules/${module.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to delete module");
      (module as any).deleted = true;
      onChanged();
      toast.success("Module deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete module");
    }
  };

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">{module.title}</div>
        <div className="flex items-center gap-2">
          <input
            className="w-52 rounded-md border border-border px-2 py-1 text-sm"
            value={rename}
            onChange={(e) => setRename(e.target.value)}
          />
          <Button size="sm" onClick={saveRename}>
            Rename
          </Button>
          <Button size="sm" variant="destructive" onClick={deleteModule}>
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-border p-3">
        <div className="text-sm font-semibold">Sections</div>
        <div className="mt-2 flex items-center gap-2">
          <input
            className="w-64 rounded-md border border-border px-2 py-1 text-sm"
            placeholder="New section title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        <Button size="sm" onClick={addSection}>
            Add Section
          </Button>
        </div>
        <div className="mt-2 space-y-2">
          {(module.sections || [])
            .filter((s) => !s.deleted)
            .map((s) => (
              <SectionItem key={s.id} section={s} onChanged={onChanged} />
            ))}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Section
   ========================= */
function SectionItem({ section, onChanged }: { section: Section; onChanged: () => void }) {
  const [lecture, setLecture] = useState<Lecture>({
    title: section?.lecture?.title || "",
    content: section?.lecture?.content || "",
  });
  const [prTitle, setPrTitle] = useState("");
  const [prContent, setPrContent] = useState("");
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [rename, setRename] = useState(section.title || "");

  const saveLecture = async () => {
    if (!lecture.title.trim()) return toast.error("Lecture title required");
    try {
      const res = await fetch(`/api/admin/sections/${section.id}/lecture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lecture.title.trim(),
          content: lecture.content,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to save lecture");

      const saved = unwrapData<Lecture>(json);
      (section as any).lecture = saved;
      onChanged();
      toast.success("Lecture saved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save lecture");
    }
  };

  const addPractice = async () => {
    if (!prTitle.trim()) return toast.error("Title required");
    if (!prContent.trim()) return toast.error("Content required");

    try {
      const res = await fetch(`/api/admin/sections/${section.id}/practice-exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: prTitle.trim(), content: prContent.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");

      (section.practices ||= []).push(json);
      setPrTitle("");
      setPrContent("");
      onChanged();
      toast.success("Exercise added");
    } catch (e: any) {
      toast.error(e?.message || "Failed to add exercise");
    }
  };

  const createQuiz = async () => {
    if (!newQuizTitle.trim()) return toast.error("Quiz title required");
    try {
      const res = await fetch(`/api/admin/sections/${section.id}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newQuizTitle.trim(), questions: [] }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to create quiz");

      const created = unwrapData<NonNullable<Quiz>>(json);
      (section as any).quiz = created;
      onChanged();
      toast.success("Quiz created");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create quiz");
    }
  };

  const saveRename = async () => {
    if (!rename.trim()) return toast.error("Title required");
    try {
      const res = await fetch(`/api/admin/sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: rename.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to rename section");

      const updated = unwrapData<Section>(json);
      (section as any).title = updated.title;
      onChanged();
      toast.success("Section renamed");
    } catch (e: any) {
      toast.error(e?.message || "Failed to rename section");
    }
  };

  const deleteSection = async () => {
    if (!confirm("Delete this section and all its content?")) return;
    try {
      const res = await fetch(`/api/admin/sections/${section.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to delete section");
      (section as any).deleted = true;
      onChanged();
      toast.success("Section deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete section");
    }
  };

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">{section.title}</div>
        <div className="flex items-center gap-2">
          <input
            className="w-52 rounded-md border border-border px-2 py-1 text-sm"
            value={rename}
            onChange={(e) => setRename(e.target.value)}
          />
          <Button size="sm" onClick={saveRename}>
            Rename
          </Button>
          <Button size="sm" variant="destructive" onClick={deleteSection}>
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-3 grid-gap-3 md:grid-cols-2">
        {/* Lecture */}
        <div className="rounded-md border border-border p-3">
          <div className="text-sm font-semibold">Lecture</div>
          <div className="mt-2 grid gap-2">
            <input
              className="w-full rounded-md border border-border px-2 py-1 text-sm"
              placeholder="Title"
              value={lecture.title}
              onChange={(e) =>
                setLecture((s) => ({ ...s, title: e.target.value }))
              }
            />
            <textarea
              className="h-24 w-full rounded-md border border-border p-2 text-sm"
              placeholder="Content (Markdown/HTML/plain)"
              value={lecture.content}
              onChange={(e) =>
                setLecture((s) => ({ ...s, content: e.target.value }))
              }
            />
            <div className="mt-2">
              <Button size="sm" onClick={saveLecture}>
                Save Lecture
              </Button>
            </div>
          </div>
        </div>

        {/* Practice */}
        <div className="rounded-md border border-border p-3">
          <div className="text-sm font-semibold">Practice Exercises</div>
          <div className="mt-2 flex items-center gap-2">
            <input
              className="w-full rounded-md border border-border px-2 py-1 text-sm"
              placeholder="New exercise title"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
            />
            <textarea
              className="h-24 w-full rounded-md border border-border px-2 py-1 text-sm"
              placeholder="Exercise content (instructions, problem statement, etc.)"
              value={prContent}
              onChange={(e) => setPrContent(e.target.value)}
            />
            <Button size="sm" onClick={addPractice}>
              Add
            </Button>
          </div>
          <div className="mt-2 space-y-2">
            {(section.practices || [])
              .filter((p) => !p.deleted)
              .map((p) => <PracticeItem key={p.id} practice={p} onChanged={onChanged} />)}
          </div>
        </div>

        {/* Quiz */}
        <div className="rounded-xl border border-border bg-white/70 p-4 backdrop-blur">
          <div className="text-base font-semibold">Quiz</div>
          {section.quiz ? (
            <QuizManager quiz={section.quiz} onChanged={onChanged} />
          ) : (
            <div className="mt-3 grid gap-2">
              <input
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
                placeholder="New Quiz Title"
                value={newQuizTitle}
                onChange={(e) => setNewQuizTitle(e.target.value)}
              />
              <div>
                <Button size="sm" onClick={createQuiz}>
                  Create Quiz
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Practice
   ========================= */
function PracticeItem({ practice, onChanged }: { practice: Practice; onChanged: () => void }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    title: practice.title || "",
    content: practice.content || "",
  });

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    try {
      const res = await fetch(`/api/admin/practice-exercises/${practice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title.trim(), content: form.content }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to update exercise");

      const updated = unwrapData<Practice>(json);
      (practice as any).title = updated.title;
      (practice as any).content = updated.content;

      setEdit(false);
      onChanged();
      toast.success("Exercise updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update exercise");
    }
  };

  const remove = async () => {
    if (!confirm("Delete this exercise?")) return;
    try {
      const res = await fetch(`/api/admin/practice-exercises/${practice.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to delete exercise");
      (practice as any).deleted = true;
      onChanged();
      toast.success("Exercise deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete exercise");
    }
  };

  return (
    <li className="rounded-md border border-border p-2">
      {!edit ? (
        <div className="flex items-center justify-between">
          <div className="text-sm">{practice.title}</div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setEdit(true)}>
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={remove}>
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          <input
            className="w-full rounded-md border border-border px-2 py-1 text-sm"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="h-20 w-full rounded-md border border-border p-2 text-sm"
            value={form.content}
            onChange={(e) =>
              setForm((f) => ({ ...f, content: e.target.value }))
            }
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={save}>
              Save
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEdit(false);
                setForm({
                  title: practice.title || "",
                  content: practice.content || "",
                });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

/* =========================
   Quiz Manager
   ========================= */
function QuizManager({
  quiz,
  onChanged,
}: { quiz: Quiz; onChanged: () => void }) {
  const [meta, setMeta] = useState({ title: quiz?.title || "" });
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState<"mcq" | "text" | "fill-in-the-blanks" | "coding">("mcq");
  const [newQuestionContent, setNewQuestionContent] = useState("");

  const saveMeta = async () => {
    if (!meta.title.trim()) return toast.error("Title is required");
    if (!quiz?.id) return;
    try {
      const res = await fetch(`/api/admin/quizzes/${quiz.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: meta.title.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to update quiz");

      quiz.title = unwrapData<Quiz>(json)!.title;
      onChanged();
      toast.success("Quiz updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update quiz");
    }
  };

  const deleteQuiz = async () => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    if (!quiz?.id) return;
    try {
      const res = await fetch(`/api/admin/quizzes/${quiz.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to delete quiz");

      (quiz as any) = null; // Mark for deletion
      onChanged();
      toast.success("Quiz deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete quiz");
    }
  };

  const createQuestion = async () => {
    if (!newQuestionText.trim()) return toast.error("Question text is required");
    if (!quiz?.id) return;
    try {
      const res = await fetch(`/api/admin/quizzes/${quiz.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newQuestionType,
          text: newQuestionText.trim(),
          order_index: (quiz.questions?.length || 0) + 1,
          content: newQuestionContent,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to create question");

      const created = unwrapData<Question>(json);
      if (!quiz.questions) quiz.questions = [];
      quiz.questions.push(created);
      onChanged();
      setNewQuestionText("");
      setNewQuestionContent("");
      toast.success("Question created");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create question");
    }
  };

  return (
    <div className="mt-3 grid gap-4">
      <div className="flex items-center justify-between">
        <input
          className="w-full rounded-md border border-border px-3 py-2 text-sm font-medium"
          value={meta.title}
          onChange={(e) => setMeta((s) => ({ ...s, title: e.target.value }))}
          onBlur={saveMeta}
        />
        <Button size="sm" variant="destructive" onClick={deleteQuiz}>
          Delete Quiz
        </Button>
      </div>

      {/* Questions */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-5 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">Quiz Questions</h3>
            <p className="text-xs text-muted-foreground">
              {(quiz?.questions || []).filter(q => !q.deleted).length} question(s) created
            </p>
          </div>
        </div>
        
        <div className="mb-4 p-4 rounded-lg border border-dashed border-border bg-white/70">
          <h4 className="text-sm font-medium mb-3">Add New Question</h4>
          <div className="grid gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Question Text</label>
                <textarea
                  className="min-h-20 w-full rounded-md border border-border px-3 py-2 text-sm"
                  placeholder="Enter your question here..."
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Question Type</label>
                <select
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                  value={newQuestionType}
                  onChange={(e) => setNewQuestionType(e.target.value as any)}
                >
                  <option value="mcq">Multiple Choice Question</option>
                  <option value="text">Text Answer</option>
                  <option value="fill-in-the-blanks">Fill in the Blanks</option>
                  <option value="coding">Coding Challenge</option>
                </select>
              </div>
            </div>
            
            {newQuestionType === "coding" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Code Content (JSON)</label>
                <textarea
                  className="h-40 w-full rounded-md border border-border p-2 text-sm font-mono"
                  placeholder='{"starterCode": "function solve() {\n  // Your solution here\n}", "testCases": [...]}'
                  value={newQuestionContent}
                  onChange={(e) => setNewQuestionContent(e.target.value)}
                />
              </div>
            )}
            
            <div className="flex justify-end">
              <Button size="sm" onClick={createQuestion} disabled={!newQuestionText.trim()}>
                {newQuestionType === "mcq" ? "Create MCQ Question" : `Create ${newQuestionType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Question`}
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-4">
          {(quiz?.questions || [])
            .filter((q) => !q.deleted)
            .map((q) => (
              <QuestionView key={q.id} question={q} onChanged={onChanged} />
            ))}
          {(quiz?.questions || []).filter(q => !q.deleted).length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              <div className="text-4xl mb-2">❓</div>
              <p className="text-sm">No questions yet</p>
              <p className="text-xs">Create questions above to build your quiz</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Question View
   ========================= */
function QuestionView({
  question,
  onChanged,
}: { question: Question; onChanged: () => void }) {
  const [meta, setMeta] = useState({ text: question.text || "", type: question.type || "mcq", content: question.content || "" });
  const [bulkOptions, setBulkOptions] = useState([
    { text: "", correct: false, id: "new-1" },
    { text: "", correct: false, id: "new-2" },
  ]);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const saveMeta = async () => {
    if (!meta.text.trim()) return toast.error("Question text is required");
    try {
      const res = await fetch(`/api/admin/quizzes/questions/${question.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: meta.text.trim(), type: meta.type, order_index: question.order_index, content: meta.content }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to update question");

      question.text = unwrapData<Question>(json).text;
      question.type = unwrapData<Question>(json).type;
      question.content = unwrapData<Question>(json).content;
      onChanged();
      toast.success("Question updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update question");
    }
  };

  const deleteQuestion = async () => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`/api/admin/quizzes/questions/${question.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to delete question");

      question.deleted = true;
      onChanged();
      toast.success("Question deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete question");
    }
  };

  const validateMCQOptions = (options: { text: string; correct: boolean }[]) => {
    const validOptions = options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      toast.error("MCQ questions need at least 2 options");
      return false;
    }
    if (!validOptions.some(opt => opt.correct)) {
      toast.error("MCQ questions need at least one correct answer");
      return false;
    }
    return true;
  };

  const createBulkOptions = async () => {
    const validOptions = bulkOptions.filter(opt => opt.text.trim());
    if (!validateMCQOptions(validOptions)) return;

    try {
      // Create options one by one
      for (const optionData of validOptions) {
        const res = await fetch(`/api/admin/quizzes/questions/${question.id}/options`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: optionData.text.trim(),
            correct: optionData.correct,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Failed to create option");

        const created = unwrapData<Option>(json);
        if (!question.options) question.options = [];
        question.options.push(created);
      }

      onChanged();
      setBulkOptions([
        { text: "", correct: false, id: "new-1" },
        { text: "", correct: false, id: "new-2" },
      ]);
      setShowBulkAdd(false);
      toast.success(`${validOptions.length} options created`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create options");
    }
  };

  const addBulkOptionRow = () => {
    setBulkOptions(prev => [...prev, { text: "", correct: false, id: `new-${Date.now()}` }]);
  };

  const removeBulkOptionRow = (id: string) => {
    if (bulkOptions.length > 2) {
      setBulkOptions(prev => prev.filter(opt => opt.id !== id));
    }
  };

  const updateBulkOption = (id: string, field: "text" | "correct", value: string | boolean) => {
    setBulkOptions(prev => prev.map(opt => 
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
  };

  const existingOptions = (question.options || []).filter(o => !o.deleted);
  const hasCorrectAnswer = existingOptions.some(opt => opt.correct);

  return (
    <div className="mt-4 rounded-xl border border-border bg-white/70 p-4 backdrop-blur shadow-sm">
      {!question.deleted && (
        <div className="grid gap-4">
          {/* Question Header */}
          <div className="flex items-start gap-3">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Question Text</label>
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-border px-3 py-2 text-sm font-medium resize-vertical"
                  placeholder="Enter your question here..."
                  value={meta.text}
                  onChange={(e) => setMeta((s) => ({ ...s, text: e.target.value }))}
                  onBlur={saveMeta}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Question Type</label>
                <select
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                  value={meta.type}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    setMeta((s) => ({ ...s, type: newType }));
                    if (newType === "mcq" && existingOptions.length === 0) {
                      setIsExpanded(true);
                    }
                  }}
                  onBlur={saveMeta}
                >
                  <option value="mcq">Multiple Choice Question</option>
                  <option value="text">Text Answer</option>
                  <option value="fill-in-the-blanks">Fill in the Blanks</option>
                  <option value="coding">Coding Challenge</option>
                </select>
                {meta.type === "mcq" && !hasCorrectAnswer && existingOptions.length > 0 && (
                  <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>No correct answer set</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {meta.type === "mcq" && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? "Collapse" : "Manage Options"}
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={deleteQuestion}>
                Delete
              </Button>
            </div>
          </div>

          {meta.type === "coding" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Code Content (JSON)</label>
              <textarea
                className="h-40 w-full rounded-md border border-border p-2 text-sm font-mono"
                placeholder='{"starterCode": "function solve() {\n  // Your solution here\n}", "testCases": [...]}'
                value={meta.content}
                onChange={(e) => setMeta((s) => ({ ...s, content: e.target.value }))}
                onBlur={saveMeta}
              />
            </div>
          )}

          {/* Enhanced MCQ Options Management */}
          {meta.type === "mcq" && isExpanded && (
            <div className="rounded-xl border border-border bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold">Answer Options</h3>
                  <p className="text-xs text-muted-foreground">
                    {existingOptions.length} option(s) • {hasCorrectAnswer ? "✅ Has correct answer" : "❌ No correct answer"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!showBulkAdd && (
                    <Button size="sm" variant="outline" onClick={() => setShowBulkAdd(true)}>
                      Bulk Add Options
                    </Button>
                  )}
                </div>
              </div>

              {/* Existing Options */}
              {existingOptions.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Current Options</label>
                  <div className="space-y-2">
                    {existingOptions.map((option, index) => (
                      <OptionView key={option.id} option={option} onChanged={onChanged} index={index + 1} />
                    ))}
                  </div>
                </div>
              )}

              {/* Bulk Add Interface */}
              {showBulkAdd && (
                <div className="mb-4 p-4 rounded-lg border border-dashed border-border bg-white/70">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Add Multiple Options</h4>
                    <Button size="sm" variant="ghost" onClick={() => setShowBulkAdd(false)}>
                      ✕
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {bulkOptions.map((option, index) => (
                      <div key={option.id} className="flex items-center gap-3 p-3 rounded-md border border-border bg-white">
                        <span className="text-sm font-mono text-muted-foreground min-w-[24px]">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <input
                          className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          value={option.text}
                          onChange={(e) => updateBulkOption(option.id, "text", e.target.value)}
                        />
                        <label className="flex items-center space-x-2 text-sm min-w-[80px]">
                          <input
                            type="radio"
                            name="correct-answer"
                            checked={option.correct}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBulkOptions(prev => prev.map(opt => 
                                  ({ ...opt, correct: opt.id === option.id })
                                ));
                              }
                            }}
                          />
                          <span className="text-xs">Correct</span>
                        </label>
                        {bulkOptions.length > 2 && (
                          <Button size="sm" variant="ghost" onClick={() => removeBulkOptionRow(option.id)}>
                            ✕
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-4">
                    <Button size="sm" variant="outline" onClick={addBulkOptionRow}>
                      + Add Another Option
                    </Button>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setShowBulkAdd(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={createBulkOptions}>
                        Create Options
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {existingOptions.length === 0 && !showBulkAdd && (
                <div className="text-center p-8 text-muted-foreground">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-sm">No options yet</p>
                  <p className="text-xs mb-4">Create answer options for this multiple choice question</p>
                  <Button size="sm" onClick={() => setShowBulkAdd(true)}>
                    Add Options
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================
   Option View
   ========================= */
function OptionView({
  option,
  onChanged,
  index,
}: { option: Option; onChanged: () => void; index?: number }) {
  const [meta, setMeta] = useState({ text: option.text || "", correct: option.correct || false });

  const saveMeta = async () => {
    if (!meta.text.trim()) return toast.error("Option text is required");
    try {
      const res = await fetch(`/api/admin/quizzes/options/${option.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: meta.text.trim(), correct: meta.correct }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to update option");

      option.text = unwrapData<Option>(json).text;
      option.correct = unwrapData<Option>(json).correct;
      onChanged();
      toast.success("Option updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update option");
    }
  };

  const deleteOption = async () => {
    if (!confirm("Are you sure you want to delete this option?")) return;
    try {
      const res = await fetch(`/api/admin/quizzes/options/${option.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to delete option");

      option.deleted = true;
      onChanged();
      toast.success("Option deleted");
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete option");
    }
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
      meta.correct 
        ? 'border-green-200 bg-green-50/70 shadow-sm' 
        : 'border-border bg-white/70 hover:bg-gray-50/70'
    } backdrop-blur`}>
      {!option.deleted && (
        <>
          <div className="flex items-center gap-3 flex-1">
            <span className={`text-sm font-mono min-w-[24px] ${
              meta.correct ? 'text-green-700 font-semibold' : 'text-muted-foreground'
            }`}>
              {index ? String.fromCharCode(64 + index) + '.' : '•'}
            </span>
            <input
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                meta.correct 
                  ? 'border-green-200 bg-green-50/50 text-green-900' 
                  : 'border-border bg-white'
              }`}
              placeholder="Enter option text..."
              value={meta.text}
              onChange={(e) => setMeta((s) => ({ ...s, text: e.target.value }))}
              onBlur={saveMeta}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <label className={`flex items-center space-x-2 text-sm cursor-pointer ${
              meta.correct ? 'text-green-700 font-medium' : 'text-muted-foreground'
            }`}>
              <input
                type="checkbox"
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                checked={meta.correct}
                onChange={(e) => setMeta((s) => ({ ...s, correct: e.target.checked }))}
                onBlur={saveMeta}
              />
              <span className="flex items-center gap-1">
                {meta.correct && <span className="text-green-600">✓</span>}
                <span>Correct</span>
              </span>
            </label>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={deleteOption}
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              ✕
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
