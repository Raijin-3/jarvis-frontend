"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { 
  Trophy, 
  Clock, 
  Users, 
  Star, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  BookOpen, 
  Code, 
  FileCheck, 
  Award,
  Sparkles,
  TrendingUp,
  Target,
  Play,
  ChevronRight,
  Lightbulb
} from "lucide-react";

interface LearningPath {
  id: string;
  title: string;
  description: string;
  career_goal: string;
  difficulty_level: string;
  estimated_duration_weeks: number;
  icon: string;
  color: string;
  steps: LearningPathStep[];
}

interface LearningPathStep {
  id: string;
  title: string;
  description: string;
  step_type: string;
  order_index: number;
  estimated_hours: number;
  skills: string[];
  prerequisites: string[];
  is_required: boolean;
  course_structure?: CourseStructure;
}

interface CourseStructure {
  courses: Course[];
}

interface Course {
  id: string;
  title: string;
  description?: string;
  subjects: Subject[];
}

interface Subject {
  id: string;
  title: string;
  course_id: string;
  order_index?: number;
  modules: LearningModule[];
}

interface LearningModule {
  id: string;
  title: string;
  subject_id: string;
  order_index?: number;
  is_mandatory: boolean;
  assessment_based: boolean;
  sections: ModuleSection[];
}

interface ModuleSection {
  id: string;
  title: string;
  module_id: string;
  order_index?: number;
}

const getCourseBadgeLabel = (title: string | undefined, index: number): string => {
  if (!title) {
    return `C${index + 1}`;
  }

  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return `C${index + 1}`;
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const hasCourseStructure = (
  step: LearningPathStep
): step is LearningPathStep & { course_structure: CourseStructure } =>
  Boolean(step.course_structure && step.course_structure.courses?.length);

interface UserProgress {
  learning_path_id: string;
  progress_percentage: number;
  completed_steps: string[];
}

export function LearningPathContent({ isFirstTime, profile }: { isFirstTime: boolean; profile: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recommendedPath, setRecommendedPath] = useState<LearningPath | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const courseStructureSteps = recommendedPath?.steps?.filter(hasCourseStructure) ?? [];

  useEffect(() => {
    loadRecommendedPath();
  }, []);

  const loadRecommendedPath = async () => {
    try {
      // Get recommended path based on user profile
      const res = await fetch("/api/learning-paths/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          career_goals: profile?.career_goals || profile?.reason_for_learning,
          focus_areas: profile?.focus_areas || [],
          experience_level: profile?.experience_level
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        console.error("Learning path recommendation failed:", res.status, errorText);
        throw new Error(`Failed to get recommendation (${res.status}): ${errorText}`);
      }
      
      const path = await res.json();
      
      if (!path || !path.id) {
        throw new Error("Invalid path data received");
      }
      
      // Get path details with steps
      const detailsRes = await fetch(`/api/learning-paths/${path.id}`);
      if (detailsRes.ok) {
        const pathDetails = await detailsRes.json();
        setRecommendedPath(pathDetails);
      } else {
        console.warn("Failed to load path details, using basic path info");
        setRecommendedPath(path);
      }

      // Check if user is already enrolled
      try {
        const progressRes = await fetch("/api/learning-paths/user/progress");
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          const pathProgress = progressData.find((p: any) => p.learning_path_id === path.id);
          if (pathProgress) {
            setUserProgress(pathProgress);
          }
        }
      } catch (progressError) {
        console.warn("Failed to load user progress:", progressError);
        // Don't fail the entire flow if progress loading fails
      }

    } catch (e: any) {
      console.error("Full error in loadRecommendedPath:", e);
      toast.error(e.message || "Failed to load learning path recommendation");
    } finally {
      setLoading(false);
    }
  };

  const enrollInPath = async () => {
    if (!recommendedPath) return;
    
    setEnrolling(true);
    try {
      const res = await fetch(`/api/learning-paths/${recommendedPath.id}/enroll`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to enroll");

      await toast.promise(
        Promise.resolve(),
        {
          loading: "Enrolling in your learning path...",
          success: "Welcome to your learning journey! 🎉",
          error: "Failed to enroll",
        }
      );

      // Refresh progress
      await loadRecommendedPath();
      
      if (isFirstTime) {
        router.replace("/dashboard");
      }

    } catch (e: any) {
      toast.error(e.message || "Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  };

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'project':
        return <Code className="h-5 w-5" />;
      case 'assessment':
        return <FileCheck className="h-5 w-5" />;
      case 'milestone':
        return <Award className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getStepColor = (stepType: string) => {
    switch (stepType) {
      case 'project':
        return 'from-purple-500 to-indigo-500';
      case 'assessment':
        return 'from-emerald-500 to-teal-500';
      case 'milestone':
        return 'from-amber-500 to-orange-500';
      default:
        return 'from-blue-500 to-cyan-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Creating your personalized learning path...</p>
        </div>
      </div>
    );
  }

  if (!recommendedPath) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load learning path recommendation.</p>
        <Button onClick={() => router.replace("/dashboard")} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen ${isFirstTime ? 'bg-gradient-to-br from-indigo-50 via-white to-emerald-50' : ''}`}>
      {isFirstTime && (
        <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_100%_-20%,rgba(99,102,241,.12),transparent)] opacity-60"></div>
      )}
      
      <div className="relative z-10 max-w-5xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          {isFirstTime && (
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 px-4 py-2 text-sm font-medium text-indigo-700">
              <Sparkles className="h-4 w-4" />
              Congratulations on completing your assessment!
            </div>
          )}
          
          <h1 className="text-4xl font-bold text-gray-900">
            Your Personalized Learning Path
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Based on your assessment and profile, we've crafted a roadmap to help you become a successful{' '}
            <span className="font-semibold text-indigo-600">
              {recommendedPath.career_goal?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Professional'}
            </span>
          </p>
        </div>

        {/* Path Overview Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-8 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br" style={{ background: `linear-gradient(135deg, ${recommendedPath.color || '#4f46e5'}15, ${recommendedPath.color || '#4f46e5'}08)` }}></div>
          
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">{recommendedPath.icon || '📚'}</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{recommendedPath.title || 'Learning Path'}</h2>
                  <p className="text-gray-600 capitalize">{recommendedPath.difficulty_level || 'beginner'} Level</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">{recommendedPath.description || 'Personalized learning path to help you reach your goals.'}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">{recommendedPath.estimated_duration_weeks || 8} weeks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">{recommendedPath.steps?.length || 0} steps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {recommendedPath.steps?.filter(s => s.is_required).length || 0} mandatory
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {recommendedPath.steps?.filter(s => !s.is_required).length || 0} optional
                  </span>
                </div>
              </div>

              {userProgress ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Your Progress</span>
                    <span className="text-sm font-medium text-indigo-600">{userProgress.progress_percentage}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${userProgress.progress_percentage}%` }}
                    />
                  </div>
                  <Button 
                    onClick={() => router.push('/learning-path')} 
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                  >
                    Continue Learning <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={enrollInPath}
                  disabled={enrolling}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  {enrolling ? (
                    "Enrolling..."
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start My Journey
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-2xl blur-2xl"></div>
                <div className="relative bg-white/60 backdrop-blur rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">What You'll Learn</h3>
                  <div className="space-y-3">
                    {recommendedPath.steps?.slice(0, 4).map((step, idx) => (
                      <div key={step.id} className="flex items-start gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r ${getStepColor(step.step_type || 'lesson')} text-white text-sm font-medium`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{step.title}</p>
                          <p className="text-xs text-gray-600">{step.estimated_hours}h</p>
                        </div>
                      </div>
                    ))}
                    {recommendedPath.steps && recommendedPath.steps.length > 4 && (
                      <div className="text-center pt-2">
                        <span className="text-xs text-gray-500">
                          +{recommendedPath.steps.length - 4} more steps
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Structure Overview */}
        {courseStructureSteps.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Structure Overview</h2>
              <p className="text-gray-600">Organized learning path with mandatory and optional modules based on your assessment results</p>
            </div>

            <div className="space-y-8">
              {courseStructureSteps.map((step, stepIndex) => (
                <div key={step.id} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {step.title || `Course Group ${stepIndex + 1}`}
                    </h3>
                    <div className="text-sm text-gray-500">
                      Estimated {step.estimated_hours || 0}h - {step.is_required ? 'Mandatory step' : 'Optional step'}
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur rounded-xl border border-gray-200 p-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {step.course_structure.courses.map((course, courseIndex) => (
                        <div key={course.id} className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-sm font-bold text-white">
                              {getCourseBadgeLabel(course.title, courseIndex)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{course.title}</h4>
                              {course.description && (
                                <p className="text-xs text-gray-500">{course.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4 pl-1">
                            {course.subjects.map((subject) => (
                              <div key={subject.id} className="border-l-2 border-blue-200 pl-4">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium text-gray-800">{subject.title}</span>
                                  <span className="text-xs text-gray-500">
                                    {subject.modules.length} module{subject.modules.length === 1 ? '' : 's'}
                                  </span>
                                </div>
                                {subject.modules.length > 0 ? (
                                  <div className="mt-2 space-y-2">
                                    {subject.modules.map((module) => (
                                      <div
                                        key={module.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-700">{module.title}</span>
                                          {module.assessment_based && (
                                            <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                                              <Lightbulb className="h-3 w-3" />
                                              Assessment-based
                                            </span>
                                          )}
                                        </div>
                                        <div
                                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            module.is_mandatory
                                              ? 'bg-red-100 text-red-700 border border-red-200'
                                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                          }`}
                                        >
                                          {module.is_mandatory ? 'Mandatory' : 'Optional'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-2 text-xs italic text-gray-500">Modules will be available soon.</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-1">Personalized Learning Path</h3>
                  <p className="text-sm text-amber-800">
                    Module requirements are personalized based on your assessment results.
                    Modules marked as "Optional" indicate areas where you demonstrated proficiency,
                    while "Mandatory" modules focus on areas that need strengthening.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {recommendedPath.steps && recommendedPath.steps.length > 0 && courseStructureSteps.length === 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning Steps</h2>
              <p className="text-gray-600">Step-by-step progression through your learning journey</p>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-xl border border-gray-200 p-6">
              <div className="space-y-4">
                {recommendedPath.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r ${getStepColor(step.step_type || 'lesson')} text-white text-sm font-medium`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{step.title}</h4>
                        <p className="text-sm text-gray-600">{step.estimated_hours}h estimated</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${step.is_required ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {step.is_required ? 'Mandatory' : 'Optional'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Roadmap */}
        {recommendedPath.steps && recommendedPath.steps.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Learning Roadmap</h2>
              <p className="text-gray-600">Follow this step-by-step path to achieve your career goals</p>
            </div>

            <div className="space-y-4">
              {recommendedPath.steps.map((step, index) => {
                const isCompleted = userProgress?.completed_steps?.includes(step.id) || false;
                const isNext = !isCompleted && userProgress?.completed_steps?.length === index;
                
                return (
                  <div 
                    key={step.id}
                    className={`relative group transition-all duration-200 ${
                      isCompleted 
                        ? 'opacity-75' 
                        : isNext 
                          ? 'ring-2 ring-indigo-500 ring-offset-2' 
                          : ''
                    }`}
                  >
                    <div className="flex items-start gap-6 p-6 bg-white/80 backdrop-blur rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200">
                      {/* Step Number & Icon */}
                      <div className="flex-shrink-0 relative">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                          isCompleted 
                            ? 'bg-green-100 text-green-600' 
                            : isNext
                              ? `bg-gradient-to-r ${getStepColor(step.step_type || 'lesson')} text-white`
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : (
                            <span className="font-bold">{index + 1}</span>
                          )}
                        </div>
                        
                        {/* Connection Line */}
                        {index < recommendedPath.steps.length - 1 && (
                          <div className="absolute top-12 left-1/2 w-px h-8 bg-gray-300 -translate-x-px"></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                              <div className={`flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-r ${getStepColor(step.step_type || 'lesson')}`}>
                                {getStepIcon(step.step_type || 'lesson')}
                              </div>
                              {/* Mandatory/Optional Badge */}
                              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                step.is_required 
                                  ? 'bg-red-100 text-red-700 border border-red-200' 
                                  : 'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
                                {step.is_required ? 'MANDATORY' : 'OPTIONAL'}
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-medium text-gray-900">{step.estimated_hours || 0}h</div>
                            <div className="text-xs text-gray-500 capitalize">{step.step_type?.replace('_', ' ') || 'lesson'}</div>
                          </div>
                        </div>

                        {/* Skills */}
                        {step.skills && step.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {step.skills.map((skill, skillIdx) => (
                              <span 
                                key={skillIdx}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700"
                              >
                                <Lightbulb className="h-3 w-3 mr-1" />
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action Button */}
                        {isNext && (
                          <Button size="sm" className="mt-2 bg-gradient-to-r from-indigo-600 to-purple-600">
                            Start This Step <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isFirstTime && !userProgress && (
          <div className="text-center space-y-4">
            <Button 
              onClick={enrollInPath}
              disabled={enrolling}
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-lg px-8 py-3"
            >
              {enrolling ? "Enrolling..." : "Start My Learning Journey"}
            </Button>
            <p className="text-sm text-gray-600">
              You can always access your learning path from the sidebar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}