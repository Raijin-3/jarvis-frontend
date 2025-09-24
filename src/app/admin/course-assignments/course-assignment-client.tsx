'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  GraduationCap,
  Target,
  TrendingUp
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Textarea } from '@/components/ui/textarea'

// Form validation schemas
const assignCourseSchema = z.object({
  user_id: z.string().min(1, 'Please select a student'),
  course_ids: z.array(z.string()).min(1, 'Please select at least one course'),
  due_date: z.string().optional(),
  notes: z.string().optional(),
})

const updateAssignmentSchema = z.object({
  due_date: z.string().optional(),
  status: z.enum(['assigned', 'in_progress', 'completed', 'overdue']).optional(),
  progress_percentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

type AssignCourseData = z.infer<typeof assignCourseSchema>
type UpdateAssignmentData = z.infer<typeof updateAssignmentSchema>

interface CourseAssignment {
  id: string
  user_id: string
  course_id: string
  assigned_by: string
  assigned_at: string
  due_date?: string
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue'
  progress_percentage: number
  completed_at?: string
  notes?: string
  created_at: string
  updated_at: string
  user: {
    id: string
    email: string
    full_name?: string
    role: string
  }
  course: {
    id: string
    title: string
    description?: string
    status?: string
  }
  assigner: {
    id: string
    email: string
    full_name?: string
  }
}

interface AssignmentStats {
  totalAssignments: number
  assigned: number
  inProgress: number
  completed: number
  overdue: number
  completionRate: number
  newAssignmentsThisMonth: number
}

interface User {
  id: string
  email: string
  profile: {
    full_name?: string
    role: string
  }
}

interface Course {
  id: string
  title: string
  description?: string
  status?: string
}

export function CourseAssignmentManagementClient() {
  const [assignments, setAssignments] = useState<CourseAssignment[]>([])
  const [stats, setStats] = useState<AssignmentStats>({
    totalAssignments: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    completionRate: 0,
    newAssignmentsThisMonth: 0
  })
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'in_progress' | 'completed' | 'overdue'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<CourseAssignment | null>(null)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  const {
    register: registerAssign,
    handleSubmit: handleSubmitAssign,
    formState: { errors: assignErrors, isSubmitting: isAssigning },
    reset: resetAssign,
    control: controlAssign,
    setValue: setAssignValue
  } = useForm<AssignCourseData>({
    resolver: zodResolver(assignCourseSchema)
  })

  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    formState: { errors: updateErrors, isSubmitting: isUpdating },
    reset: resetUpdate,
    setValue: setUpdateValue,
    control: controlUpdate
  } = useForm<UpdateAssignmentData>({
    resolver: zodResolver(updateAssignmentSchema)
  })

  // Fetch assignments
  const fetchAssignments = async (page = 1, search = '', status = 'all') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(status !== 'all' && { status })
      })

      const response = await fetch(`/api/admin/course-assignments?${params}`)
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`Failed to fetch assignments (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      console.log(data.assignments);
      setAssignments(data.assignments)
      setTotalPages(data.totalPages)
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred'
      toast.error(`Failed to fetch assignments: ${errorMessage}`)
      console.error('Error fetching assignments:', error)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/course-assignments/stats')
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`Failed to fetch stats (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      toast.error('Failed to fetch statistics')
      console.error('Error fetching stats:', error)
    }
  }

  // Fetch users (students only)
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=student')
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`Error fetching users (${response.status}): ${errorText}`)
      } else {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses')
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error(`Error fetching courses (${response.status}): ${errorText}`)
      } else {
        const data = await response.json()
        setCourses(data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchAssignments(currentPage, searchQuery, statusFilter),
        fetchStats(),
        fetchUsers(),
        fetchCourses()
      ])
      setLoading(false)
    }
    loadData()
  }, [currentPage, searchQuery, statusFilter])

  // Update form when dialog opens/closes or courses load
  useEffect(() => {
    if (!isAssignDialogOpen || !courses.length) return
    setAssignValue('course_ids', selectedCourses)
  }, [isAssignDialogOpen, selectedCourses, courses, setAssignValue])

  // Search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  // Filter handler
  const handleStatusFilter = (status: 'all' | 'assigned' | 'in_progress' | 'completed' | 'overdue') => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  // Assign course handler
  const handleAssignCourse = async (data: AssignCourseData) => {
    try {
      const response = await fetch('/api/admin/course-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      toast.success('Courses assigned successfully')
      setIsAssignDialogOpen(false)
      resetAssign()
      await fetchAssignments(currentPage, searchQuery, statusFilter)
      await fetchStats()
    } catch (error: any) {
      toast.error(`Failed to assign course: ${error.message}`)
    }
  }

  // Edit assignment handler
  const handleEditAssignment = (assignment: CourseAssignment) => {
    setSelectedAssignment(assignment)
    setUpdateValue('due_date', assignment.due_date ? assignment.due_date.split('T')[0] : '')
    setUpdateValue('status', assignment.status)
    setUpdateValue('progress_percentage', assignment.progress_percentage)
    setUpdateValue('notes', assignment.notes || '')
    setIsEditDialogOpen(true)
  }

  // Update assignment handler
  const handleUpdateAssignment = async (data: UpdateAssignmentData) => {
    if (!selectedAssignment) return

    try {
      const response = await fetch(`/api/admin/course-assignments/${selectedAssignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      toast.success('Assignment updated successfully')
      setIsEditDialogOpen(false)
      setSelectedAssignment(null)
      resetUpdate()
      await fetchAssignments(currentPage, searchQuery, statusFilter)
      await fetchStats()
    } catch (error: any) {
      toast.error(`Failed to update assignment: ${error.message}`)
    }
  }

  // Delete assignment handler
  const handleDeleteAssignment = async (assignment: CourseAssignment) => {
    if (!confirm(`Remove course assignment for ${assignment.user?.full_name || assignment.user?.email || 'Unknown Student'}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/course-assignments/${assignment.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      toast.success('Assignment removed successfully')
      await fetchAssignments(currentPage, searchQuery, statusFilter)
      await fetchStats()
    } catch (error: any) {
      toast.error(`Failed to remove assignment: ${error.message}`)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'in_progress': return 'secondary'
      case 'assigned': return 'outline'
      case 'overdue': return 'destructive'
      default: return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--brand))]/10 via-transparent to-[hsl(var(--brand-accent))]/10" />
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Course Assignments
                </h1>
                <p className="text-gray-600 mt-2">
                  Assign and manage course enrollments for students
                </p>
              </div>
              <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))] hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Assign Course to Student</DialogTitle>
                    <DialogDescription>
                      Select a student and course to create a new assignment
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitAssign(handleAssignCourse)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="user_id">Student</Label>
                        <Controller
                          name="user_id"
                          control={controlAssign}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a student" />
                              </SelectTrigger>
                              <SelectContent>
                                {users.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.profile.full_name || user.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {assignErrors.user_id && (
                          <p className="text-sm text-red-600">{assignErrors.user_id.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Courses</Label>
                        <Controller
                          name="course_ids"
                          control={controlAssign}
                          render={({ field }) => (
                            <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                              {courses.map((course) => (
                                <div key={course.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`course-${course.id}`}
                                    checked={field.value?.includes(course.id)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      const newValue = checked
                                        ? [...(field.value || []), course.id]
                                        : (field.value || []).filter(id => id !== course.id);
                                      field.onChange(newValue);
                                    }}
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                  />
                                  <label
                                    htmlFor={`course-${course.id}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {course.title}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        />
                        {assignErrors.course_ids && (
                          <p className="text-sm text-red-600">{assignErrors.course_ids.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="due_date">Due Date (Optional)</Label>
                        <Input
                          id="due_date"
                          type="date"
                          {...registerAssign('due_date')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Additional notes or instructions..."
                          {...registerAssign('notes')}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAssignDialogOpen(false)}
                        disabled={isAssigning}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isAssigning}
                        className="bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))]"
                      >
                        {isAssigning ? 'Assigning...' : 'Assign Course'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-white/20 bg-white/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssignments}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newAssignmentsThisMonth} this month
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-white/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completionRate}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-white/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/20 bg-white/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overdue}</div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card className="border-white/20 bg-white/80 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Assignment Management</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assignments..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {assignment.user?.full_name || assignment.user?.email || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.user?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{assignment.course?.title || 'Course Not Found'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(assignment.status)}>
                        {assignment.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${assignment.progress_percentage}%` }}
                          />
                        </div>
                        <span className="text-sm">{assignment.progress_percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(assignment.assigned_at)}</TableCell>
                    <TableCell>
                      {assignment.due_date ? formatDate(assignment.due_date) : 'No due date'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditAssignment(assignment)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteAssignment(assignment)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Assignment Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Assignment</DialogTitle>
              <DialogDescription>
                Update assignment details and progress
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitUpdate(handleUpdateAssignment)} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Controller
                    name="status"
                    control={controlUpdate}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="progress_percentage">Progress (%)</Label>
                  <Input
                    id="progress_percentage"
                    type="number"
                    min="0"
                    max="100"
                    {...registerUpdate('progress_percentage', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    {...registerUpdate('due_date')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes or instructions..."
                    {...registerUpdate('notes')}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))]"
                >
                  {isUpdating ? 'Updating...' : 'Update Assignment'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
