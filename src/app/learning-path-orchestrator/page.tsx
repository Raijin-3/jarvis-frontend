"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { 
  BookOpen, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight,
  Target,
  Trophy,
  Info,
  User,
  Clock,
  RefreshCw
} from "lucide-react";

// Types for the Learning Path Orchestrator
interface OrchestrationCourse {
  id: string;
  title: string;
  description?: string;
  subjects: OrchestrationSubject[];
}

interface OrchestrationSubject {
  id: string;
  title: string;
  course_id: string;
  order_index?: number;
  modules: OrchestrationModule[];
}

interface OrchestrationModule {
  id: string;
  title: string;
  subject_id: string;
  order_index?: number;
  status: 'Mandatory' | 'Optional';
  reason: string;
  mastery_percentage?: number;
  question_stats?: {
    available: number;
    answered: number;
    correct: number;
  };
}

interface PersonalizedLearningPath {
  userId: string;
  assessmentId?: string;
  courses: OrchestrationCourse[];
  metadata: {
    totalModules: number;
    mandatoryModules: number;
    optionalModules: number;
    generatedAt: string;
  };
}

interface AssessmentAnswer {
  questionId: string;
  answerText?: string;
  correct: boolean;
  moduleId?: string;
}

export default function LearningPathOrchestratorPage() {
  const [loading, setLoading] = useState(true);
  const [learningPath, setLearningPath] = useState<PersonalizedLearningPath | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [submittingAssessment, setSubmittingAssessment] = useState(false);

  useEffect(() => {
    loadLearningPath();
  }, []);

  const loadLearningPath = async (specificAssessmentId?: string) => {
    try {
      const queryParams = specificAssessmentId ? `?assessmentId=${specificAssessmentId}` : '';
      const response = await fetch(`/api/learning-path-orchestrator/generate${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth setup
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load learning path: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setLearningPath(result.data);
        // Auto-expand first course and subject for better UX
        if (result.data.courses.length > 0) {
          const firstCourse = result.data.courses[0];
          setExpandedCourses(new Set([firstCourse.id]));
          if (firstCourse.subjects.length > 0) {
            setExpandedSubjects(new Set([firstCourse.subjects[0].id]));
          }
        }
      } else {
        throw new Error('Failed to generate learning path');
      }
    } catch (error) {
      console.error('Error loading learning path:', error);
      toast.error('Failed to load learning path');
    } finally {
      setLoading(false);
    }
  };

  const submitAssessment = async () => {
    if (!assessmentId.trim()) {
      toast.error('Please enter an assessment ID');
      return;
    }

    setSubmittingAssessment(true);
    try {
      // This is a mock submission - in real implementation, you'd collect actual answers
      const mockAnswers: AssessmentAnswer[] = [
        {
          questionId: "q1",
          answerText: "Sample answer",
          correct: true,
          moduleId: "module1"
        },
        {
          questionId: "q2", 
          answerText: "Another answer",
          correct: false,
          moduleId: "module2"
        }
      ];

      const response = await fetch('/api/learning-path-orchestrator/submit-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth setup
        },
        body: JSON.stringify({
          assessmentId: assessmentId.trim(),
          answers: mockAnswers
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to submit assessment: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setLearningPath(result.data);
        toast.success('Assessment submitted successfully! Learning path updated.');
      } else {
        throw new Error('Failed to submit assessment');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setSubmittingAssessment(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  const toggleSubject = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const getStatusIcon = (status: 'Mandatory' | 'Optional') => {
    return status === 'Optional' 
      ? <CheckCircle className="h-5 w-5 text-green-600" />
      : <AlertCircle className="h-5 w-5 text-amber-600" />;
  };

  const getStatusColor = (status: 'Mandatory' | 'Optional') => {
    return status === 'Optional' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-amber-100 text-amber-800 border-amber-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized learning path...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Learning Path Orchestrator</h1>
              <p className="text-gray-600 mt-1">
                Personalized course structure based on your assessment performance
              </p>
            </div>
            <div className="text-right">
              <Button 
                onClick={() => loadLearningPath()} 
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Assessment Submission */}
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Enter Assessment ID"
              value={assessmentId}
              onChange={(e) => setAssessmentId(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <Button 
              onClick={submitAssessment} 
              disabled={submittingAssessment}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {submittingAssessment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit Assessment'
              )}
            </Button>
          </div>
        </div>

        {learningPath && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Courses</p>
                    <p className="text-2xl font-semibold text-gray-900">{learningPath.courses.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-indigo-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Modules</p>
                    <p className="text-2xl font-semibold text-gray-900">{learningPath.metadata.totalModules}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Mandatory</p>
                    <p className="text-2xl font-semibold text-gray-900">{learningPath.metadata.mandatoryModules}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Optional</p>
                    <p className="text-2xl font-semibold text-gray-900">{learningPath.metadata.optionalModules}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Hierarchy */}
            <div className="space-y-4">
              {learningPath.courses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-sm border">
                  {/* Course Header */}
                  <button
                    onClick={() => toggleCourse(course.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      {expandedCourses.has(course.id) ? 
                        <ChevronDown className="h-5 w-5 text-gray-500 mr-3" /> :
                        <ChevronRight className="h-5 w-5 text-gray-500 mr-3" />
                      }
                      <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
                      <div className="text-left">
                        <h2 className="text-xl font-semibold text-gray-900">{course.title}</h2>
                        {course.description && (
                          <p className="text-sm text-gray-600">{course.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {course.subjects.length} subjects
                    </div>
                  </button>

                  {/* Course Content */}
                  {expandedCourses.has(course.id) && (
                    <div className="border-t border-gray-200 px-6 pb-4">
                      {course.subjects.map((subject) => (
                        <div key={subject.id} className="mt-4">
                          {/* Subject Header */}
                          <button
                            onClick={() => toggleSubject(subject.id)}
                            className="w-full flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                          >
                            <div className="flex items-center">
                              {expandedSubjects.has(subject.id) ? 
                                <ChevronDown className="h-4 w-4 text-gray-500 mr-2" /> :
                                <ChevronRight className="h-4 w-4 text-gray-500 mr-2" />
                              }
                              <h3 className="text-lg font-medium text-gray-800">{subject.title}</h3>
                            </div>
                            <div className="text-sm text-gray-600">
                              {subject.modules.length} modules
                            </div>
                          </button>

                          {/* Subject Modules */}
                          {expandedSubjects.has(subject.id) && (
                            <div className="mt-3 space-y-2">
                              {subject.modules.map((module) => (
                                <div 
                                  key={module.id} 
                                  className="ml-6 p-4 bg-white border border-gray-200 rounded-lg"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900">{module.title}</h4>
                                      <p className="text-sm text-gray-600 mt-1">{module.reason}</p>
                                      
                                      {module.question_stats && (
                                        <div className="mt-2 text-xs text-gray-500">
                                          Questions: {module.question_stats.correct}/{module.question_stats.available} correct
                                          {module.mastery_percentage !== undefined && (
                                            <span className="ml-2 font-medium">
                                              ({module.mastery_percentage}% mastery)
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="ml-4 flex items-center">
                                      {getStatusIcon(module.status)}
                                      <span 
                                        className={`ml-2 px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(module.status)}`}
                                      >
                                        {module.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How module status is determined:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li><strong>Optional:</strong> ≥ 80% correct on module-based assessment questions</li>
                    <li><strong>Mandatory:</strong> &lt; 80% correct or no assessment questions available</li>
                    <li>Unanswered questions are treated as incorrect</li>
                    <li>Static content (Welcome, About, FAQ, etc.) is filtered out</li>
                  </ul>
                  <p className="mt-2 text-xs text-blue-600">
                    Generated: {new Date(learningPath.metadata.generatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {!learningPath && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No learning path data available.</p>
            <p className="text-sm text-gray-500 mt-2">
              Submit an assessment or refresh to generate your personalized learning path.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}