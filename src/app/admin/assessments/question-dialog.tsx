'use client'

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Loader2, Trash2, Upload, X } from "lucide-react"

const SUPPORTED_QUESTION_TYPES = ["mcq", "image_mcq", "short_text", "text", "image_text", "fill_blank"] as const
type SupportedQuestionType = (typeof SUPPORTED_QUESTION_TYPES)[number]

type DialogModule = {
  id: string
  title: string
  subject_id: string
  subject_title?: string | null
  course_id?: string | null
  course_title?: string | null
}

interface QuestionFormState {
  question_text: string
  question_type: SupportedQuestionType
  module_id: string
  category_id?: string | null
  difficulty_level: "easy" | "medium" | "hard"
  points_value: number
  time_limit_seconds: number
  explanation?: string
  tags: string[]
  question_image_url?: string | null
  options: Array<{
    option_text: string
    is_correct: boolean
    explanation?: string
  }>
  text_answer: {
    correct_answer: string
    case_sensitive: boolean
    exact_match: boolean
    alternate_answers: string[]
    keywords: string[]
  }
}

interface QuestionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modules: DialogModule[]
  categories: Array<{ id: string; display_name: string; name: string }>
  editingQuestion?: any
  onSave: (question: any) => Promise<void>
}

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

const MULTIPLE_CHOICE_TYPES = new Set<SupportedQuestionType>(["mcq", "image_mcq"])
const TEXT_ANSWER_TYPES = new Set<SupportedQuestionType>(["short_text", "text", "image_text", "fill_blank"])
const QUESTION_TYPE_OPTIONS: Array<{ value: SupportedQuestionType; label: string }> = [
  { value: "mcq", label: "Multiple Choice" },
  { value: "image_mcq", label: "Image Multiple Choice" },
  { value: "short_text", label: "Short Answer" },
  { value: "text", label: "Long Answer" },
  { value: "image_text", label: "Image Prompt (Text Answer)" },
  { value: "fill_blank", label: "Fill in the Blank" },
]
const normalizeQuestionType = (type: string | undefined): SupportedQuestionType =>
  SUPPORTED_QUESTION_TYPES.includes(type as SupportedQuestionType)
    ? (type as SupportedQuestionType)
    : "mcq"
const isMultipleChoiceType = (type: SupportedQuestionType) => MULTIPLE_CHOICE_TYPES.has(type)
const isTextAnswerType = (type: SupportedQuestionType) => TEXT_ANSWER_TYPES.has(type)

export function QuestionDialog({
  open,
  onOpenChange,
  modules,
  categories,
  editingQuestion,
  onSave
}: QuestionDialogProps) {
  const [form, setForm] = useState<QuestionFormState>(createEmptyQuestionForm())
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tagsInput, setTagsInput] = useState("")
  const [alternateAnswersInput, setAlternateAnswersInput] = useState("")
  const [keywordsInput, setKeywordsInput] = useState("")
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isMultipleChoice = isMultipleChoiceType(form.question_type)
  const isTextAnswer = isTextAnswerType(form.question_type)

  const resetForm = () => {
    setForm(createEmptyQuestionForm())
    setTagsInput("")
    setAlternateAnswersInput("")
    setKeywordsInput("")
    setImagePreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) {
        URL.revokeObjectURL(prev)
      }
      return null
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  useEffect(() => {
    return () => {
      if (imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  useEffect(() => {
    if (!form.question_image_url) {
      setImagePreviewUrl((prev) => {
        if (prev && !prev.startsWith("blob:")) {
          return null
        }
        return prev
      })
      return
    }

    setImagePreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) {
        return prev
      }
      if (prev === form.question_image_url) {
        return prev
      }
      // form.question_image_url can be undefined, coerce to null to satisfy state type string | null
      return form.question_image_url ?? null
    })
  }, [form.question_image_url])

  useEffect(() => {
    if (!open) {
      resetForm()
      return
    }

    if (!editingQuestion) {
      resetForm()
      return
    }

    const baseForm = createEmptyQuestionForm()
    const normalizedType = normalizeQuestionType(editingQuestion.question_type)

    const normalizedOptions =
      isMultipleChoiceType(normalizedType) &&
      Array.isArray(editingQuestion.options) &&
      editingQuestion.options.length > 0
        ? editingQuestion.options.map((option: any) => ({
            option_text: option.option_text ?? "",
            is_correct: Boolean(option.is_correct),
            explanation: option.explanation ?? "",
          }))
        : baseForm.options

    const normalizedTextAnswer =
      isTextAnswerType(normalizedType) && editingQuestion.text_answer
        ? {
            correct_answer: editingQuestion.text_answer.correct_answer ?? "",
            case_sensitive: Boolean(editingQuestion.text_answer.case_sensitive),
            exact_match: Boolean(editingQuestion.text_answer.exact_match),
            alternate_answers: Array.isArray(editingQuestion.text_answer.alternate_answers)
              ? editingQuestion.text_answer.alternate_answers
              : [],
            keywords: Array.isArray(editingQuestion.text_answer.keywords)
              ? editingQuestion.text_answer.keywords
              : [],
          }
        : { ...baseForm.text_answer }

    setForm({
      question_text: editingQuestion.question_text ?? "",
      question_type: normalizedType,
      module_id: editingQuestion.module_id ?? "",
      category_id: editingQuestion.category_id ?? null,
      difficulty_level: editingQuestion.difficulty_level ?? baseForm.difficulty_level,
      points_value: editingQuestion.points_value ?? baseForm.points_value,
      time_limit_seconds: editingQuestion.time_limit_seconds ?? baseForm.time_limit_seconds,
      explanation: editingQuestion.explanation ?? "",
      tags: Array.isArray(editingQuestion.tags) ? editingQuestion.tags : [],
      question_image_url: editingQuestion.question_image_url ?? null,
      options: normalizedOptions.length >= 2 ? normalizedOptions : baseForm.options,
      text_answer: normalizedTextAnswer,
    })

    setTagsInput((Array.isArray(editingQuestion.tags) ? editingQuestion.tags : []).join(", "))
    setAlternateAnswersInput(
      normalizedTextAnswer.alternate_answers.length > 0
        ? normalizedTextAnswer.alternate_answers.join(", ")
        : ""
    )
    setKeywordsInput(
      normalizedTextAnswer.keywords.length > 0
        ? normalizedTextAnswer.keywords.join(", ")
        : ""
    )
    setImagePreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [open, editingQuestion])

  const getModuleLabel = (module: DialogModule | null | undefined) => {
    if (!module) return ""
    const parts = [module.course_title, module.subject_title, module.title].filter(Boolean) as string[]
    return parts.length > 0 ? parts.join(' - ') : module.title
  }



  const handleSave = async () => {
    if (!form.question_text.trim()) {
      toast.error("Question text is required")
      return
    }

    if (!form.module_id) {
      toast.error("Please select a module")
      return
    }

    if (isMultipleChoice) {
      const hasValidOptions = form.options.every(opt => opt.option_text.trim())
      const hasCorrectAnswer = form.options.some(opt => opt.is_correct)

      if (!hasValidOptions) {
        toast.error("All options must have text")
        return
      }

      if (!hasCorrectAnswer) {
        toast.error("At least one option must be marked as correct")
        return
      }
    }

    if (isTextAnswer && !form.text_answer.correct_answer.trim()) {
      toast.error("Correct answer is required")
      return
    }

    setSaving(true)
    try {
      const payload = {
        question_text: form.question_text.trim(),
        question_type: form.question_type,
        module_id: form.module_id,
        category_id: form.category_id || null,
        difficulty_level: form.difficulty_level,
        points_value: form.points_value,
        time_limit_seconds: form.time_limit_seconds,
        explanation: form.explanation?.trim() || null,
        tags: form.tags,
        question_image_url: form.question_image_url || null,
        ...(isMultipleChoice
          ? {
              options: form.options.map((option, index) => ({
                option_text: option.option_text.trim(),
                is_correct: option.is_correct,
                order_index: index,
                explanation: option.explanation?.trim() || null,
              })),
            }
          : isTextAnswer
            ? {
                text_answer: {
                  correct_answer: form.text_answer.correct_answer.trim(),
                  case_sensitive: form.text_answer.case_sensitive,
                  exact_match: form.text_answer.exact_match,
                  alternate_answers: form.text_answer.alternate_answers,
                  keywords: form.text_answer.keywords,
                },
              }
            : {}),
      }

      await onSave(
        editingQuestion ? { ...payload, id: editingQuestion.id } : payload
      )
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error("Save question error:", error)
      toast.error(editingQuestion ? "Failed to update question" : "Failed to create question")
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setImagePreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) {
        URL.revokeObjectURL(prev)
      }
      return objectUrl
    })

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/admin/assessments/upload-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      setForm(prev => ({ ...prev, question_image_url: data.url }))
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error('Upload error:', error)
      toast.error("Failed to upload image")
      setImagePreviewUrl((prev) => {
        if (prev?.startsWith("blob:")) {
          URL.revokeObjectURL(prev)
        }
        return null
      })
    } finally {
      setUploading(false)
      input.value = ""
    }
  }


  const addOption = () => {
    if (form.options.length >= 6) return
    setForm(prev => ({
      ...prev,
      options: [...prev.options, { option_text: "", is_correct: false, explanation: "" }]
    }))
  }

  const removeOption = (index: number) => {
    if (form.options.length <= 2) return
    setForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
  }

  const updateOption = (index: number, field: keyof typeof form.options[0], value: any) => {
    setForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }))
  }

  const handleTagsChange = (value: string) => {
    setTagsInput(value)
    const tags = value.split(',').map(t => t.trim()).filter(t => t.length > 0)
    setForm(prev => ({ ...prev, tags }))
  }

  const handleAlternateAnswersChange = (value: string) => {
    setAlternateAnswersInput(value)
    const answers = value.split(',').map(t => t.trim()).filter(t => t.length > 0)
    setForm(prev => ({
      ...prev,
      text_answer: { ...prev.text_answer, alternate_answers: answers }
    }))
  }

  const handleKeywordsChange = (value: string) => {
    setKeywordsInput(value)
    const keywords = value.split(',').map(t => t.trim()).filter(t => t.length > 0)
    setForm(prev => ({
      ...prev,
      text_answer: { ...prev.text_answer, keywords }
    }))
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm()
      onOpenChange(open)
    }}>
        {/* increase the width of dialog content to fit the screen width */}
      <DialogContent className="max-w-full md:max-w-[90vw] lg:max-w-[80vw] xl:max-w-[60vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingQuestion ? "Edit Question" : "Create New Question"}
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive assessment question with rich assessment metadata.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[80vh] overflow-y-auto">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="question_text">Question Text *</Label>
                <Textarea
                  id="question_text"
                  placeholder="Enter your question here..."
                  value={form.question_text}
                  onChange={(e) => setForm(prev => ({ ...prev, question_text: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="question_type">Question Type *</Label>
                  <Select
                    value={form.question_type}
                    onValueChange={(value: SupportedQuestionType) =>
                      setForm(prev => ({ ...prev, question_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a question type" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPE_OPTIONS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty_level">Difficulty Level *</Label>
                  <Select
                    value={form.difficulty_level}
                    onValueChange={(value: any) => setForm(prev => ({ ...prev, difficulty_level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="module_id">Module *</Label>
                  <Select
                    value={form.module_id}
                    onValueChange={(value) => setForm(prev => ({ ...prev, module_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a module" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {getModuleLabel(module)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <Select
                    value={form.category_id || "none"}
                    onValueChange={(value) => setForm(prev => ({ ...prev, category_id: value === "none" ? null : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="points_value">Points Value</Label>
                  <Input
                    id="points_value"
                    type="number"
                    min="1"
                    value={form.points_value}
                    onChange={(e) => setForm(prev => ({ ...prev, points_value: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time_limit_seconds">Time Limit (seconds)</Label>
                  <Input
                    id="time_limit_seconds"
                    type="number"
                    min="10"
                    value={form.time_limit_seconds}
                    onChange={(e) => setForm(prev => ({ ...prev, time_limit_seconds: parseInt(e.target.value) || 60 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation">Explanation</Label>
                <Textarea
                  id="explanation"
                  placeholder="Optional explanation for this question..."
                  value={form.explanation}
                  onChange={(e) => setForm(prev => ({ ...prev, explanation: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Comma-separated tags (e.g., variables, loops, arrays)"
                  value={tagsInput}
                  onChange={(e) => handleTagsChange(e.target.value)}
                />
                {form.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {form.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Question Image</h3>
              
              <div className="space-y-2">
                <Label>Upload Image (Optional)</Label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploading ? "Uploading..." : "Upload Image"}
                  </Button>
                  
                  {(imagePreviewUrl || form.question_image_url) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setForm(prev => ({ ...prev, question_image_url: null }))
                        setImagePreviewUrl((prev) => {
                          if (prev?.startsWith("blob:")) {
                            URL.revokeObjectURL(prev)
                          }
                          return null
                        })
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {(imagePreviewUrl || form.question_image_url) && (
                  <div className="mt-2">
                    <img
                      src={imagePreviewUrl || form.question_image_url || undefined}
                      alt="Question"
                      className="max-w-full h-40 object-contain rounded-md border"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Answer Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Answer Configuration</h3>
              
              {isMultipleChoice ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Answer Options</Label>
                    {form.options.length < 6 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {form.options.map((option, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={option.is_correct}
                              onCheckedChange={(checked) => updateOption(index, 'is_correct', checked)}
                            />
                            <Label className="text-sm font-medium">
                              Correct Answer
                            </Label>
                          </div>
                          <Input
                            placeholder={`Option ${index + 1} text`}
                            value={option.option_text}
                            onChange={(e) => updateOption(index, 'option_text', e.target.value)}
                          />
                          <Input
                            placeholder="Optional explanation for this option"
                            value={option.explanation || ""}
                            onChange={(e) => updateOption(index, 'explanation', e.target.value)}
                          />
                        </div>
                        
                        {form.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : isTextAnswer && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="correct_answer">Correct Answer *</Label>
                    <Input
                      id="correct_answer"
                      placeholder="Enter the correct answer"
                      value={form.text_answer.correct_answer}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        text_answer: { ...prev.text_answer, correct_answer: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="font-medium">Case Sensitive</div>
                        <p className="text-xs text-muted-foreground">
                          Consider letter case in answers
                        </p>
                      </div>
                      <Switch
                        checked={form.text_answer.case_sensitive}
                        onCheckedChange={(checked) => setForm(prev => ({
                          ...prev,
                          text_answer: { ...prev.text_answer, case_sensitive: checked }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="font-medium">Exact Match</div>
                        <p className="text-xs text-muted-foreground">
                          Require exact word matching
                        </p>
                      </div>
                      <Switch
                        checked={form.text_answer.exact_match}
                        onCheckedChange={(checked) => setForm(prev => ({
                          ...prev,
                          text_answer: { ...prev.text_answer, exact_match: checked }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alternate_answers">Alternate Answers</Label>
                    <Input
                      id="alternate_answers"
                      placeholder="Comma-separated alternate correct answers"
                      value={alternateAnswersInput}
                      onChange={(e) => handleAlternateAnswersChange(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords</Label>
                    <Input
                      id="keywords"
                      placeholder="Comma-separated keywords for partial matching"
                      value={keywordsInput}
                      onChange={(e) => handleKeywordsChange(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Sidebar */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview</h3>
            <div className="border rounded-lg p-4 space-y-4">
              <div>
                <div className="font-medium text-sm text-muted-foreground mb-2">Question Text</div>
                <div className="text-sm">
                  {form.question_text || "Enter question text..."}
                </div>
              </div>

              {(imagePreviewUrl || form.question_image_url) && (
                <div>
                  <div className="font-medium text-sm text-muted-foreground mb-2">Image</div>
                  <img
                    src={imagePreviewUrl || form.question_image_url || undefined}
                    alt="Preview"
                    className="w-full max-h-32 object-contain rounded border"
                  />
                </div>
              )}

              {isMultipleChoice && (
                <div>
                  <div className="font-medium text-sm text-muted-foreground mb-2">Options</div>
                  <div className="space-y-1">
                    {form.options.map((option, index) => (
                      <div
                        key={index}
                        className={`text-sm p-2 rounded ${
                          option.is_correct
                            ? "bg-green-100 text-green-800 font-medium"
                            : "bg-gray-50"
                        }`}
                      >
                        {`${String.fromCharCode(65 + index)}. ${option.option_text || `Option ${index + 1}`}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <div>Type: {form.question_type.replace('_', ' ')}</div>
                <div>Difficulty: {form.difficulty_level}</div>
                <div>Points: {form.points_value}</div>
                <div>Time: {form.time_limit_seconds}s</div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {saving ? "Saving..." : editingQuestion ? "Save Changes" : "Create Question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


