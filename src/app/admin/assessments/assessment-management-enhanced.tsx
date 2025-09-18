'use client'

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Badge } from "@/components/ui/badge"
import { QuestionDialog } from "./question-dialog"
import { toast } from "sonner"
import type { LucideIcon } from "lucide-react"
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  Download,
  Upload,
  FileText,
  Settings,
  TrendingUp,
  Brain,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2
} from "lucide-react"

interface AssessmentModule {
  id: string
  title: string
  subject_id: string
  subject_title?: string | null
  course_id?: string | null
  course_title?: string | null
}

interface AssessmentCategory {
  id: string
  name: string
  display_name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  order_index?: number
}

interface AssessmentQuestion {
  id: string
  question_text: string
  question_type: string
  module_id?: string | null
  module?: AssessmentModule | null
  difficulty_level: "easy" | "medium" | "hard"
  points_value: number
  time_limit_seconds: number
  tags?: string[] | null
  question_image_url?: string | null
  explanation?: string | null
  is_active?: boolean
  options?: Array<{ id?: string; option_text: string; is_correct: boolean; explanation?: string | null }>
  text_answer?: {
    correct_answer: string
    case_sensitive: boolean
    exact_match: boolean
    alternate_answers: string[]
    keywords: string[]
  } | null
  created_at?: string
  updated_at?: string
  usage_count?: number
  success_rate?: number
}

type QuestionFilters = {
  search: string
  module: string
  difficulty: string
  type: string
}

const DIFFICULTY_COLORS: Record<AssessmentQuestion["difficulty_level"], string> = {
  easy: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  hard: "bg-red-100 text-red-700 border-red-200"
}

const QUESTION_TYPE_ICONS: Record<string, LucideIcon> = {
  mcq: CheckCircle2,
  short_text: FileText,
  fill_blank: Edit,
  image_mcq: CheckCircle2,
  image_text: FileText
}

export function EnhancedAssessmentManagement() {
  const [activeTab, setActiveTab] = useState<"questions" | "analytics">("questions")
  const [modules, setModules] = useState<AssessmentModule[]>([])
  const [categories, setCategories] = useState<AssessmentCategory[]>([])
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [loading, setLoading] = useState({ modules: false, questions: false, categories: false })
  const [filters, setFilters] = useState<QuestionFilters>({
    search: "",
    module: "all",
    difficulty: "all",
    type: "all"
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  })
  const [dialogs, setDialogs] = useState({ question: false })

  const getModuleLabel = useCallback((module?: AssessmentModule | null) => {
    if (!module) return "-"
    const parts = [module.course_title, module.subject_title, module.title].filter(Boolean) as string[]
    return parts.length > 0 ? parts.join(' - ') : module.title
  }, [])


  const loadModules = useCallback(async () => {
    setLoading(prev => ({ ...prev, modules: true }))
    try {
      const response = await fetch("/api/admin/assessments/modules")
      if (!response.ok) throw new Error("Failed to load modules")
      const data = await response.json()
      setModules(Array.isArray(data?.modules) ? data.modules : [])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load modules")
    } finally {
      setLoading(prev => ({ ...prev, modules: false }))
    }
  }, [])

  const loadCategories = useCallback(async () => {
    setLoading(prev => ({ ...prev, categories: true }))
    try {
      const response = await fetch("/api/admin/assessments/categories")
      if (!response.ok) throw new Error("Failed to load categories")
      const data = await response.json()
      setCategories(Array.isArray(data?.categories) ? data.categories : [])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load categories")
    } finally {
      setLoading(prev => ({ ...prev, categories: false }))
    }
  }, [])

  const loadQuestions = useCallback(async () => {
    setLoading(prev => ({ ...prev, questions: true }))
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit)
      })

      if (filters.search) params.set("search", filters.search)
      if (filters.module !== "all") params.set("module_id", filters.module)
      if (filters.difficulty !== "all") params.set("difficulty_level", filters.difficulty)
      if (filters.type !== "all") params.set("question_type", filters.type)

      const response = await fetch(`/api/admin/assessments/questions?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to load questions")
      const data = await response.json()

      setQuestions(Array.isArray(data?.questions) ? data.questions : [])
      if (data?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total ?? 0,
          pages: data.pagination.pages ?? 1
        }))
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load questions")
    } finally {
      setLoading(prev => ({ ...prev, questions: false }))
    }
  }, [filters.difficulty, filters.search, filters.module, filters.type, pagination.limit, pagination.page])

  const saveQuestion = async (questionData: any) => {
    const response = await fetch("/api/admin/assessments/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questionData)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error)
    }

    toast.success("Question created successfully")
    await loadQuestions()
  }

  useEffect(() => {
    loadModules()
    loadCategories()
  }, [loadModules, loadCategories])

  useEffect(() => {
    if (activeTab === "questions") {
      loadQuestions()
    }
  }, [activeTab, loadQuestions])

  const updateFilter = (key: keyof QuestionFilters, value: string) => {
    setPagination(prev => ({ ...prev, page: 1 }))
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const QuestionsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Questions</h2>
          <p className="text-muted-foreground">Manage assessment questions and their configurations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast("Import coming soon")}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={() => toast("Export coming soon")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setDialogs(prev => ({ ...prev, question: true }))}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filters.module} onValueChange={(value) => updateFilter("module", value)} >
              <SelectTrigger>
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {getModuleLabel(module)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.difficulty} onValueChange={(value) => updateFilter("difficulty", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(value) => updateFilter("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="mcq">Multiple Choice</SelectItem>
                <SelectItem value="short_text">Short Text</SelectItem>
                <SelectItem value="fill_blank">Fill in Blanks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading.questions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading questions...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Brain className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No questions yet</h3>
              <p className="text-muted-foreground mb-4">Create your first assessment question to get started.</p>
              <Button onClick={() => setDialogs(prev => ({ ...prev, question: true }))}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="max-w-md">
                        <div className="space-y-1">
                          <p className="font-medium line-clamp-2">{question.question_text}</p>
                          {question.tags && question.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {question.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {question.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{question.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const Icon = QUESTION_TYPE_ICONS[question.question_type]
                            return Icon ? <Icon className="h-4 w-4" /> : null
                          })()}
                          <span className="capitalize text-sm">
                            {question.question_type.replace("_", " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getModuleLabel(question.module)}</TableCell>
                      <TableCell>
                        <Badge className={DIFFICULTY_COLORS[question.difficulty_level]}>
                          {question.difficulty_level}
                        </Badge>
                      </TableCell>
                      <TableCell>{question.points_value}</TableCell>
                      <TableCell>
                        {question.is_active ? (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {question.usage_count || 0} uses
                          {typeof question.success_rate === "number" && (
                            <div className="text-xs">
                              {Math.round(question.success_rate * 100)}% success
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
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

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} questions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, index) => {
                const pageNumber = index + 1
                return (
                  <Button
                    key={pageNumber}
                    variant={pagination.page === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: pageNumber }))}
                  >
                    {pageNumber}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
              disabled={pagination.page >= pagination.pages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Assessment Management</h1>
              <p className="text-muted-foreground">Create, manage, and analyze assessment content</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "questions" | "analytics")} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-fit lg:grid-cols-2">
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-6">
            <QuestionsTab />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Analytics</CardTitle>
                <CardDescription>Deep insights into assessment performance and usage patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <QuestionDialog
        open={dialogs.question}
        onOpenChange={(open) => setDialogs(prev => ({ ...prev, question: open }))}
        modules={modules}
        categories={categories}
        onSave={saveQuestion}
      />
    </div>
  )
}
