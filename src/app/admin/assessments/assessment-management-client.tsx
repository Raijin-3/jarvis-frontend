'use client'
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  RefreshCcw,
  ImageIcon,
  Filter,
  Clock,
  BookOpen,
  CheckCircle2,
  CircleOff,
  ChevronLeft,
  ChevronRight,
  Target,
} from "lucide-react"
interface AssessmentCategory {
  id: string
  name: string
  display_name: string
  description?: string | null
  color?: string | null
  icon?: string | null
  order_index?: number | null
}
interface AssessmentModule {
  id: string
  title: string
  subject_id: string
  subject_title?: string | null
  course_id?: string | null
  course_title?: string | null
}
interface AssessmentSubjectGroup {
  id: string
  title: string
  course_id: string
  course_title?: string | null
  modules: AssessmentModule[]
}
interface AssessmentCourse {
  id: string
  title: string
  subjects: AssessmentSubjectGroup[]
}
interface AssessmentQuestionOption {
  id?: string
  option_text: string
  is_correct: boolean
  explanation?: string | null
}
interface AssessmentTextAnswer {
  correct_answer: string
  case_sensitive: boolean
  exact_match: boolean
  alternate_answers: string[]
  keywords: string[]
}
interface AssessmentQuestion {
  id: string
  question_text: string
  question_type: string
  module_id?: string | null
  module?: AssessmentModule | null
  category_id?: string | null
  assessment_categories?: { display_name: string }
  difficulty_level: "easy" | "medium" | "hard"
  points_value: number
  time_limit_seconds: number
  tags?: string[] | null
  question_image_url?: string | null
  explanation?: string | null
  is_active?: boolean
  options?: AssessmentQuestionOption[]
  text_answer?: AssessmentTextAnswer | null
  created_at?: string
  updated_at?: string
}
interface QuestionFormState {
  question_text: string
  question_type: "mcq" | "short_text" | "fill_blank"
  subject_id: string
  category_id?: string | null
  difficulty_level: "easy" | "medium" | "hard"
  points_value: number
  time_limit_seconds: number
  explanation?: string
  tags: string[]
  question_image_url?: string | null
  options: AssessmentQuestionOption[]
  text_answer: AssessmentTextAnswer
}
const NO_CATEGORY_VALUE = "none";
const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple Choice",
  short_text: "Short Description",
  fill_blank: "Fill in the Blanks",
  text: "Short Description",
  image_mcq: "Image MCQ",
  image_text: "Image + Text",
}
const QUESTION_TYPE_OPTIONS = [
  { value: "mcq", label: "Multiple Choice" },
  { value: "short_text", label: "Short Description" },
  { value: "fill_blank", label: "Fill in the Blanks" },
]
const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]
const PAGE_SIZE = 10
const MAX_OPTIONS = 6
const sanitizeDelimited = (value: string): string[] =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
const createEmptyQuestionForm = (): QuestionFormState => ({
  question_text: "",
  question_type: "mcq",
  module_id: "",
  category_id: null,
  difficulty_level: "medium",
  points_value: 1,
  time_limit_seconds: 60,
  explanation: "",
  tags: [],
  question_image_url: null,
  options: [
    { option_text: "", is_correct: true, explanation: "" },
    { option_text: "", is_correct: false, explanation: "" },
  ],
  text_answer: {
    correct_answer: "",
    case_sensitive: false,
    exact_match: true,
    alternate_answers: [],
    keywords: [],
  },
})
const mapQuestionToForm = (question: AssessmentQuestion): QuestionFormState => {
  const normalizedType: QuestionFormState["question_type"] =
    question.question_type === "mcq" || question.question_type === "image_mcq"
      ? "mcq"
      : question.question_type === "fill_blank"
        ? "fill_blank"
        : "short_text"
  const baseOptions =
    normalizedType === "mcq"
      ? (question.options ?? []).map((option) => ({
          option_text: option.option_text ?? "",
          is_correct: !!option.is_correct,
          explanation: option.explanation ?? "",
        }))
      : createEmptyQuestionForm().options
  const textAnswer = question.text_answer
    ? {
        correct_answer: question.text_answer.correct_answer ?? "",
        case_sensitive: !!question.text_answer.case_sensitive,
        exact_match: question.text_answer.exact_match ?? true,
        alternate_answers: question.text_answer.alternate_answers ?? [],
        keywords: question.text_answer.keywords ?? [],
      }
    : createEmptyQuestionForm().text_answer
  return {
    question_text: question.question_text ?? "",
    question_type: normalizedType,
    module_id: question.module_id ?? "",
    category_id: question.category_id ?? null,
    difficulty_level: question.difficulty_level ?? "medium",
    points_value: question.points_value ?? 1,
    time_limit_seconds: question.time_limit_seconds ?? 60,
    explanation: question.explanation ?? "",
    tags: Array.isArray(question.tags) ? question.tags : [],
    question_image_url: question.question_image_url ?? null,
    options: baseOptions.length >= 2 ? baseOptions : createEmptyQuestionForm().options,
    text_answer: textAnswer,
  }
}
const buildQuestionPayload = (form: QuestionFormState) => {
  const payload: any = {
    question_text: form.question_text.trim(),
    question_type: form.question_type,
    module_id: form.module_id,
    category_id: form.category_id ?? null,
    difficulty_level: form.difficulty_level,
    points_value: form.points_value,
    time_limit_seconds: form.time_limit_seconds,
    explanation: form.explanation?.trim() || null,
    tags: form.tags,
    question_image_url: form.question_image_url || null,
  }
  if (form.question_type === "mcq") {
    payload.options = form.options.map((option, index) => ({
      option_text: option.option_text.trim(),
      is_correct: option.is_correct,
      order_index: index,
      explanation: option.explanation?.trim() || null,
    }))
  } else {
    payload.text_answer = {
      correct_answer: form.text_answer.correct_answer.trim(),
      case_sensitive: form.text_answer.case_sensitive,
      exact_match: form.text_answer.exact_match,
      alternate_answers: form.text_answer.alternate_answers,
      keywords: form.text_answer.keywords,
    }
  }
  return payload
}
const formatModuleDisplay = (module?: AssessmentModule) => {
  if (!module) return ""
  const parts = [module.course_title, module.subject_title, module.title].filter(Boolean) as string[]
  return parts.length > 0 ? parts.join(' - ') : module.title
}
export function AssessmentManagementClient() {
  const [activeTab, setActiveTab] = useState<"questions" | "categories">("questions")
  const [categories, setCategories] = useState<AssessmentCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [modules, setModules] = useState<AssessmentModule[]>([])
  const [courses, setCourses] = useState<AssessmentCourse[]>([])
  const [modulesLoading, setModulesLoading] = useState(false)
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [questionPagination, setQuestionPagination] = useState({ page: 1, total: 0, pages: 1 })
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedModule, setSelectedModule] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [page, setPage] = useState(1)
  const [reloadToken, setReloadToken] = useState(0)
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [questionDialogLoading, setQuestionDialogLoading] = useState(false)
  const [questionSaving, setQuestionSaving] = useState(false)
  const [questionImageUploading, setQuestionImageUploading] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(createEmptyQuestionForm())
  const [tagsInput, setTagsInput] = useState("")
  const [alternateAnswersInput, setAlternateAnswersInput] = useState("")
  const [keywordsInput, setKeywordsInput] = useState("")
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [categorySaving, setCategorySaving] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ id: "", name: "", display_name: "", description: "" })
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const resetQuestionDialog = () => {
    const defaults = createEmptyQuestionForm()
    setQuestionForm(defaults)
    setTagsInput("")
    setAlternateAnswersInput("")
    setKeywordsInput("")
    setEditingQuestionId(null)
    setQuestionDialogLoading(false)
    setQuestionSaving(false)
    setQuestionImageUploading(false)
  }
  const resetCategoryDialog = () => {
    setCategoryForm({ id: "", name: "", display_name: "", description: "" })
    setCategorySaving(false)
  }
  const loadCategories = async () => {
    setCategoriesLoading(true)
    try {
      const response = await fetch("/api/admin/assessments/categories")
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load categories")
    } finally {
      setCategoriesLoading(false)
    }
  }

  const loadModules = async () => {
    setModulesLoading(true)
    try {
      const response = await fetch("/api/admin/assessments/modules")
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json()

      const fetchedCourses: AssessmentCourse[] = Array.isArray(data?.courses)
        ? data.courses.map((course: any) => ({
            id: course.id,
            title: course.title,
            subjects: Array.isArray(course.subjects)
              ? course.subjects.map((subject: any) => ({
                  id: subject.id,
                  title: subject.title,
                  course_id: subject.course_id,
                  course_title: course.title,
                  modules: Array.isArray(subject.modules)
                    ? subject.modules.map((module: any) => ({
                        id: module.id,
                        title: module.title,
                        subject_id: module.subject_id,
                        subject_title: module.subject_title ?? subject.title ?? null,
                        course_id: module.course_id ?? course.id,
                        course_title: module.course_title ?? course.title ?? null,
                      }))
                    : [],
                }))
              : [],
          }))
        : []

      const fetchedModules: AssessmentModule[] = Array.isArray(data?.modules)
        ? data.modules.map((module: any) => ({
            id: module.id,
            title: module.title,
            subject_id: module.subject_id,
            subject_title: module.subject_title ?? null,
            course_id: module.course_id ?? null,
            course_title: module.course_title ?? null,
          }))
        : []

      setCourses(fetchedCourses)
      setModules(fetchedModules)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load course modules")
    } finally {
      setModulesLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    loadModules()
  }, [])
  useEffect(() => {
    let ignore = false
    const fetchQuestions = async () => {
      setQuestionsLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        })
        if (searchTerm.trim()) params.set("search", searchTerm.trim())
        if (selectedModule !== "all") params.set("module_id", selectedModule)
        if (selectedCategory !== "all") params.set("category_id", selectedCategory)
        if (selectedType !== "all") params.set("question_type", selectedType)
        if (selectedDifficulty !== "all") params.set("difficulty_level", selectedDifficulty)
        const response = await fetch(`/api/admin/assessments/questions?${params.toString()}`)
        if (!response.ok) throw new Error(await response.text())
        const data = await response.json()
        if (!ignore) {
          setQuestions(Array.isArray(data?.questions) ? data.questions : [])
          if (data?.pagination) {
            setQuestionPagination({
              page: data.pagination.page ?? page,
              total: data.pagination.total ?? 0,
              pages: data.pagination.pages ?? 1,
            })
          } else {
            const totalCount = Array.isArray(data?.questions) ? data.questions.length : 0
            setQuestionPagination({ page, total: totalCount, pages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) })
          }
        }
      } catch (error) {
        console.error(error)
        if (!ignore) toast.error("Failed to load assessment questions")
      } finally {
        if (!ignore) setQuestionsLoading(false)
      }
    }
    fetchQuestions()
    return () => {
      ignore = true
    }
  }, [page, searchTerm, selectedModule, selectedCategory, selectedType, selectedDifficulty, reloadToken])
  const moduleOptions = useMemo(() => {
    if (courses.length > 0) return courses
    if (modules.length === 0) return []
    const groupedByCourse = modules.reduce<Record<string, AssessmentModule[]>>((acc, module) => {
      const courseTitle = module.course_title ?? 'Ungrouped'
      acc[courseTitle] = acc[courseTitle] || []
      acc[courseTitle].push(module)
      return acc
    }, {})
    return Object.entries(groupedByCourse).map(([title, mods]) => ({
      id: title,
      title,
      subjects: [
        {
          id: title,
          title,
          course_id: mods[0]?.course_id ?? '',
          course_title: title,
          modules: mods,
        },
      ],
    }))
  }, [courses, modules])
  const handleApplySearch = () => {
    setSearchTerm(searchInput.trim())
    setPage(1)
  }
  const handleRefreshQuestions = () => setReloadToken((token) => token + 1)
  const handleNewQuestion = () => {
    resetQuestionDialog()
    const defaults = createEmptyQuestionForm()
    setQuestionForm(defaults)
    setTagsInput("")
    setAlternateAnswersInput("")
    setKeywordsInput("")
    setQuestionDialogOpen(true)
  }
  const handleEditQuestion = async (questionId: string) => {
    resetQuestionDialog()
    setQuestionDialogLoading(true)
    try {
      const response = await fetch(`/api/admin/assessments/questions/${questionId}`)
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json()
      const mapped = mapQuestionToForm(data)
      setQuestionForm(mapped)
      setTagsInput(mapped.tags.join(", "))
      setAlternateAnswersInput(mapped.text_answer.alternate_answers.join(", "))
      setKeywordsInput(mapped.text_answer.keywords.join(", "))
      setEditingQuestionId(questionId)
      setQuestionDialogOpen(true)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load question details")
    } finally {
      setQuestionDialogLoading(false)
    }
  }
  const handleToggleQuestionStatus = async (question: AssessmentQuestion) => {
    try {
      const response = await fetch(`/api/admin/assessments/questions/${question.id}/toggle-status`, {
        method: "PUT",
      })
      if (!response.ok) throw new Error(await response.text())
      toast.success(`Question ${question.is_active === false ? "activated" : "deactivated"}`)
      handleRefreshQuestions()
    } catch (error) {
      console.error(error)
      toast.error("Failed to toggle question status")
    }
  }
  const handleDeleteQuestion = async (question: AssessmentQuestion) => {
    const confirmed = confirm("Are you sure you want to delete this question?")
    if (!confirmed) return
    try {
      const response = await fetch(`/api/admin/assessments/questions/${question.id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error(await response.text())
      toast.success("Question deleted")
      handleRefreshQuestions()
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete question")
    }
  }
  const handleSaveQuestion = async () => {
    if (questionSaving) return
    const sanitizedTags = sanitizeDelimited(tagsInput)
    const sanitizedAlternateAnswers = sanitizeDelimited(alternateAnswersInput)
    const sanitizedKeywords = sanitizeDelimited(keywordsInput)
    const formForSubmission: QuestionFormState = {
      ...questionForm,
      tags: sanitizedTags,
      text_answer: {
        ...questionForm.text_answer,
        alternate_answers: sanitizedAlternateAnswers,
        keywords: sanitizedKeywords,
      },
    }
    if (!formForSubmission.question_text.trim()) {
      toast.error("Question text is required")
      return
    }
    if (!formForSubmission.module_id) {
      toast.error("Please select a module")
      return
    }
    if (formForSubmission.time_limit_seconds < 10) {
      toast.error("Time limit must be at least 10 seconds")
      return
    }
    if (formForSubmission.points_value < 1) {
      toast.error("Points must be at least 1")
      return
    }
    if (formForSubmission.question_type === "mcq") {
      const trimmedOptions = formForSubmission.options
        .map((option) => ({
          ...option,
          option_text: option.option_text.trim(),
        }))
        .filter((option) => option.option_text.length > 0)
      if (trimmedOptions.length < 2) {
        toast.error("Enter at least two options")
        return
      }
      if (!trimmedOptions.some((option) => option.is_correct)) {
        toast.error("Mark the correct option")
        return
      }
      formForSubmission.options = trimmedOptions
    } else {
      if (!formForSubmission.text_answer.correct_answer.trim()) {
        toast.error("Specify the correct answer")
        return
      }
    }
    setQuestionSaving(true)
    try {
      const payload = buildQuestionPayload(formForSubmission)
      const isEditing = Boolean(editingQuestionId)
      const response = await fetch(
        isEditing
          ? `/api/admin/assessments/questions/${editingQuestionId}`
          : "/api/admin/assessments/questions",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      if (!response.ok) throw new Error(await response.text())
      toast.success(isEditing ? "Question updated" : "Question created")
      setQuestionDialogOpen(false)
      resetQuestionDialog()
      handleRefreshQuestions()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save question")
    } finally {
      setQuestionSaving(false)
    }
  }
  const handleQuestionImageUpload = async (file: File) => {
    setQuestionImageUploading(true)
    try {
      const formData = new FormData()
      formData.append("image", file)
      const response = await fetch("/api/admin/assessments/upload-image", {
        method: "POST",
        body: formData,
      })
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json()
      if (!data?.url) throw new Error("Image upload failed")
      setQuestionForm((prev) => ({ ...prev, question_image_url: data.url }))
      toast.success("Image uploaded")
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload image")
    } finally {
      setQuestionImageUploading(false)
    }
  }
  const handleAddOption = () => {
    setQuestionForm((prev) => {
      if (prev.options.length >= MAX_OPTIONS) return prev
      return {
        ...prev,
        options: [...prev.options, { option_text: "", is_correct: false, explanation: "" }],
      }
    })
  }
  const handleUpdateOption = (
    index: number,
    field: keyof AssessmentQuestionOption,
    value: string | boolean
  ) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((option, idx) =>
        idx === index
          ? {
              ...option,
              [field]: field === "option_text" || field === "explanation" ? String(value) : value,
            }
          : option
      ),
    }))
  }
  const handleMarkOptionCorrect = (index: number) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((option, idx) => ({
        ...option,
        is_correct: idx === index,
      })),
    }))
  }
  const handleRemoveOption = (index: number) => {
    setQuestionForm((prev) => {
      if (prev.options.length <= 2) return prev
      const filtered = prev.options.filter((_, idx) => idx !== index)
      let corrected = filtered
      if (!filtered.some((option) => option.is_correct) && filtered.length > 0) {
        corrected = filtered.map((option, idx) => ({
          ...option,
          is_correct: idx === 0,
        }))
      }
      return {
        ...prev,
        options: corrected,
      }
    })
  }
  const handleSaveCategory = async () => {
    if (categorySaving) return
    if (!categoryForm.name.trim() || !categoryForm.display_name.trim()) {
      toast.error("Name and display label are required")
      return
    }
    setCategorySaving(true)
    try {
      const payload = {
        name: categoryForm.name.trim(),
        display_name: categoryForm.display_name.trim(),
        description: categoryForm.description?.trim() || null,
      }
      const isEditing = Boolean(categoryForm.id)
      const response = await fetch(
        isEditing
          ? `/api/admin/assessments/categories/${categoryForm.id}`
          : "/api/admin/assessments/categories",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      if (!response.ok) throw new Error(await response.text())
      toast.success(isEditing ? "Category updated" : "Category created")
      setCategoryDialogOpen(false)
      resetCategoryDialog()
      loadCategories()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save category")
    } finally {
      setCategorySaving(false)
    }
  }
  const handleDeleteCategory = async (category: AssessmentCategory) => {
    const confirmed = confirm(`Delete category "${category.display_name}"?`)
    if (!confirmed) return
    try {
      const response = await fetch(`/api/admin/assessments/categories/${category.id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error(await response.text())
      toast.success("Category deleted")
      loadCategories()
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete category")
    }
  }
  const totalPages = Math.max(1, questionPagination.pages || Math.ceil(questionPagination.total / PAGE_SIZE) || 1)
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Assessment Management</h1>
          <p className="text-muted-foreground text-sm">
            Build and maintain categories and questions for your course assessments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefreshQuestions} disabled={questionsLoading}>
            {questionsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button onClick={handleNewQuestion}>
            <Plus className="mr-2 h-4 w-4" />
            New Question
          </Button>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="w-full max-w-xs">
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Question Bank</CardTitle>
                  <CardDescription>
                    Filter by module, difficulty, or type to narrow down the question bank.
                  </CardDescription>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <div className="flex w-full gap-2">
                    <Input
                      placeholder="Search question text..."
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          handleApplySearch()
                        }
                      }}
                    />
                    <Button variant="outline" onClick={handleApplySearch}>
                      <Filter className="mr-2 h-4 w-4" />
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Module</Label>
                  <Select
                    value={selectedModule}
                    onValueChange={(value) => {
                      setSelectedModule(value)
                      setPage(1)
                    }}
                    disabled={modulesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All modules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All modules</SelectItem>
                      {moduleOptions.map((course) => (
                        <SelectGroup key={course.id}>
                          <SelectLabel>{course.title}</SelectLabel>
                          {course.subjects.map((subject) =>
                            subject.modules.map((module) => (
                              <SelectItem key={module.id} value={module.id}>
                                {formatModuleDisplay(module)}
                              </SelectItem>
                            ))
                          )}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Question type</Label>
                  <Select
                    value={selectedType}
                    onValueChange={(value) => {
                      setSelectedType(value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {QUESTION_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Difficulty</Label>
                  <Select
                    value={selectedDifficulty}
                    onValueChange={(value) => {
                      setSelectedDifficulty(value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All difficulty levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All difficulty levels</SelectItem>
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              {questionsLoading ? (
                <div className="flex flex-1 items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading questions...
                </div>
              ) : questions.length === 0 ? (
                <div className="grid place-items-center gap-2 py-12 text-center text-muted-foreground">
                  <BookOpen className="h-8 w-8" />
                  <div className="text-sm">No questions match the current filters.</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[320px]">Question</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((question) => {
                        const moduleDisplay = formatModuleDisplay(question.module ?? undefined)
                        const categoryDisplay = question.assessment_categories?.display_name
                        return (
                          <TableRow key={question.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-start gap-2">
                                  <span className="font-medium leading-tight line-clamp-2">
                                    {question.question_text}
                                  </span>
                                  {question.is_active === false && (
                                    <Badge variant="outline" className="border-amber-200 text-amber-600">
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  {moduleDisplay && (
                                    <span className="inline-flex items-center gap-1">
                                      <BookOpen className="h-3.5 w-3.5" /> {moduleDisplay}
                                    </span>
                                  )}
                                  {categoryDisplay && (
                                    <span className="inline-flex items-center gap-1">
                                      <Target className="h-3.5 w-3.5" /> {categoryDisplay}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> {question.time_limit_seconds}s
                                  </span>
                                  {Array.isArray(question.tags) && question.tags.length > 0 && (
                                    <span className="inline-flex flex-wrap items-center gap-1">
                                      {question.tags.slice(0, 3).map((tag) => (
                                        <Badge key={tag} variant="secondary" className="text-xs font-normal">
                                          #{tag}
                                        </Badge>
                                      ))}
                                      {question.tags.length > 3 && <span>+{question.tags.length - 3}</span>}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {QUESTION_TYPE_LABELS[question.question_type] ?? question.question_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  question.difficulty_level === "easy"
                                    ? "outline"
                                    : question.difficulty_level === "medium"
                                      ? "secondary"
                                      : "default"
                                }
                              >
                                {question.difficulty_level.charAt(0).toUpperCase() + question.difficulty_level.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{question.points_value}</TableCell>
                            <TableCell>{question.time_limit_seconds}s</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditQuestion(question.id)}>
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleQuestionStatus(question)}>
                                    {question.is_active === false ? "Activate" : "Deactivate"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteQuestion(question)} className="text-destructive">
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {questionPagination.page} of {totalPages} - {questionPagination.total} total questions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1 || questionsLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages || questionsLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Organise questions by skill or topic for easier grouping.</CardDescription>
              </div>
              <Button
                onClick={() => {
                  resetCategoryDialog()
                  setCategoryDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> New Category
              </Button>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="flex flex-1 items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <div className="grid place-items-center gap-2 py-12 text-center text-muted-foreground">
                  <CircleOff className="h-8 w-8" />
                  <div className="text-sm">No categories yet. Create one to get started.</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Display label</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.display_name}</TableCell>
                          <TableCell className="max-w-[320px] text-muted-foreground">
                            {category.description || ""}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setCategoryForm({
                                      id: category.id,
                                      name: category.name ?? "",
                                      display_name: category.display_name ?? "",
                                      description: category.description ?? "",
                                    })
                                    setCategoryDialogOpen(true)
                                  }}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteCategory(category)}
                                  className="text-destructive"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog
        open={questionDialogOpen}
        onOpenChange={(open) => {
          setQuestionDialogOpen(open)
          if (!open) resetQuestionDialog()
        }}
      >
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden" showCloseButton={!questionSaving}>
          <div className="flex h-full flex-col">
            <DialogHeader>
              <DialogTitle>{editingQuestionId ? "Edit question" : "Create question"}</DialogTitle>
              <DialogDescription>
                {editingQuestionId
                  ? "Update the question content, timing, and answer configuration."
                  : "Add a new question with the required timing, module, and answer settings."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-1">
              {questionDialogLoading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading question...
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="question_text">Question</Label>
                      <Textarea
                        id="question_text"
                        rows={3}
                        value={questionForm.question_text}
                        onChange={(event) =>
                          setQuestionForm((prev) => ({ ...prev, question_text: event.target.value }))
                        }
                        placeholder="Enter the question prompt"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Question type</Label>
                      <Select
                        value={questionForm.question_type}
                        onValueChange={(value: QuestionFormState["question_type"]) =>
                          setQuestionForm((prev) => ({
                            ...prev,
                            question_type: value,
                            options:
                              value === "mcq"
                                ? prev.options
                                : createEmptyQuestionForm().options,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Module</Label>
                      <Select
                        value={questionForm.module_id}
                        onValueChange={(value) => setQuestionForm((prev) => ({ ...prev, module_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                        <SelectContent>
                          {moduleOptions.map((course) => (
                            <SelectGroup key={course.id}>
                              <SelectLabel>{course.title}</SelectLabel>
                              {course.subjects.map((subject) =>
                                subject.modules.map((module) => (
                                  <SelectItem key={module.id} value={module.id}>
                                    {formatModuleDisplay(module)}
                                  </SelectItem>
                                ))
                              )}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <Select
                        value={questionForm.category_id ?? NO_CATEGORY_VALUE}
                        onValueChange={(value) =>
                          setQuestionForm((prev) => ({ ...prev, category_id: value === NO_CATEGORY_VALUE ? null : value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_CATEGORY_VALUE}>No category</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Difficulty</Label>
                      <Select
                        value={questionForm.difficulty_level}
                        onValueChange={(value: QuestionFormState["difficulty_level"]) =>
                          setQuestionForm((prev) => ({ ...prev, difficulty_level: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="points_value">Points</Label>
                      <Input
                        id="points_value"
                        type="number"
                        min={1}
                        value={questionForm.points_value}
                        onChange={(event) =>
                          setQuestionForm((prev) => ({
                            ...prev,
                            points_value: Number(event.target.value) || 0,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="time_limit">Time limit (seconds)</Label>
                      <Input
                        id="time_limit"
                        type="number"
                        min={10}
                        value={questionForm.time_limit_seconds}
                        onChange={(event) =>
                          setQuestionForm((prev) => ({
                            ...prev,
                            time_limit_seconds: Number(event.target.value) || 0,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="question_tags">Tags</Label>
                      <Input
                        id="question_tags"
                        placeholder="Comma separated keywords"
                        value={tagsInput}
                        onChange={(event) => setTagsInput(event.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="question_explanation">Explanation (optional)</Label>
                      <Textarea
                        id="question_explanation"
                        rows={2}
                        placeholder="Give learners context once the question is reviewed"
                        value={questionForm.explanation}
                        onChange={(event) =>
                          setQuestionForm((prev) => ({ ...prev, explanation: event.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-3 sm:col-span-2">
                      <Label>Associated media</Label>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) {
                              handleQuestionImageUpload(file)
                            }
                            event.target.value = ""
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={questionImageUploading}
                        >
                          {questionImageUploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ImageIcon className="mr-2 h-4 w-4" />
                          )}
                          {questionImageUploading ? "Uploading..." : "Upload image"}
                        </Button>
                        {questionForm.question_image_url && (
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <img
                              src={questionForm.question_image_url}
                              alt="Question visual"
                              className="h-14 w-14 rounded border object-cover"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => setQuestionForm((prev) => ({ ...prev, question_image_url: null }))}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Separator />

                  {questionForm.question_type === "mcq" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Answer options</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddOption}
                          disabled={questionForm.options.length >= MAX_OPTIONS}
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add option
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {questionForm.options.map((option, index) => (
                          <div key={index} className="rounded-lg border p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="font-medium">Option {index + 1}</div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={option.is_correct ? "default" : "outline"}>
                                  {option.is_correct ? (
                                    <span className="inline-flex items-center gap-1">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Correct answer
                                    </span>
                                  ) : (
                                    "Incorrect"
                                  )}
                                </Badge>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleMarkOptionCorrect(index)}
                                  disabled={option.is_correct}
                                >
                                  Mark correct
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveOption(index)}
                                  disabled={questionForm.options.length <= 2}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3 space-y-2">
                              <Input
                                value={option.option_text}
                                onChange={(event) => handleUpdateOption(index, "option_text", event.target.value)}
                                placeholder="Option text"
                              />
                              <Input
                                value={option.explanation ?? ""}
                                onChange={(event) => handleUpdateOption(index, "explanation", event.target.value)}
                                placeholder="Explanation (optional)"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Correct answer</Label>
                      <Input
                        value={questionForm.text_answer.correct_answer}
                        onChange={(event) =>
                          setQuestionForm((prev) => ({
                            ...prev,
                            text_answer: {
                              ...prev.text_answer,
                              correct_answer: event.target.value,
                            },
                          }))
                        }
                        placeholder="Expected learner response"
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <div className="font-medium">Case sensitive</div>
                            <p className="text-muted-foreground text-xs">
                              Require exact casing when matching responses.
                            </p>
                          </div>
                          <Switch
                            checked={questionForm.text_answer.case_sensitive}
                            onCheckedChange={(checked) =>
                              setQuestionForm((prev) => ({
                                ...prev,
                                text_answer: {
                                  ...prev.text_answer,
                                  case_sensitive: checked,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <div className="font-medium">Exact match</div>
                            <p className="text-muted-foreground text-xs">
                              Require learners to match the answer exactly.
                            </p>
                          </div>
                          <Switch
                            checked={questionForm.text_answer.exact_match}
                            onCheckedChange={(checked) =>
                              setQuestionForm((prev) => ({
                                ...prev,
                                text_answer: {
                                  ...prev.text_answer,
                                  exact_match: checked,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Alternate acceptable answers</Label>
                        <Input
                          placeholder="Optional, comma separated"
                          value={alternateAnswersInput}
                          onChange={(event) => setAlternateAnswersInput(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Keywords for partial matches</Label>
                        <Input
                          placeholder="Optional, comma separated"
                          value={keywordsInput}
                          onChange={(event) => setKeywordsInput(event.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="mt-4 flex shrink-0 items-center justify-end gap-2 border-t pt-3">
              <Button variant="outline" onClick={() => setQuestionDialogOpen(false)} disabled={questionSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveQuestion} disabled={questionSaving}>
                {questionSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {questionSaving ? "Saving" : editingQuestionId ? "Save changes" : "Create question"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          setCategoryDialogOpen(open)
          if (!open) resetCategoryDialog()
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden" showCloseButton={!categorySaving}>
            <DialogHeader>
            <DialogTitle>{categoryForm.id ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>
              Provide a short identifier and a display label for the assessment category.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="category_name">System name</Label>
              <Input
                id="category_name"
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. python_basics"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category_display">Display label</Label>
              <Input
                id="category_display"
                value={categoryForm.display_name}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, display_name: event.target.value }))
                }
                placeholder="e.g. Python Basics"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category_description">Description</Label>
              <Textarea
                id="category_description"
                rows={3}
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Optional description"
              />
            </div>
            <div className="shrink-0 border-t pt-3">
              <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)} disabled={categorySaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={categorySaving}>
              {categorySaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {categorySaving ? "Saving" : categoryForm.id ? "Save changes" : "Create category"}
            </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

