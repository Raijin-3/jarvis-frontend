import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { Sidebar } from "../dashboard/sidebar";
import { MobileSidebar } from "../dashboard/mobile-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Clock, FileCheck2, Play, Star, Target, Award, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";

export const metadata = { title: "Exams - Jarvis" };

type Exam = {
  id: string;
  title: string;
  durationMinutes: number;
  questionLimit: number;
};

const UPCOMING: Exam[] = [
  { id: "sql-1", title: "SQL Fundamentals Exam", durationMinutes: 90, questionLimit: 16 },
  { id: "sql-2", title: "Advanced SQL – Exam 2", durationMinutes: 90, questionLimit: 19 },
  { id: "analytics-1", title: "Data Analytics Basics", durationMinutes: 75, questionLimit: 14 },
  { id: "python-1", title: "Python for Data Science", durationMinutes: 120, questionLimit: 22 },
];

const COMPLETED = [
  { 
    id: "intro-1", 
    title: "Introduction to Analytics", 
    score: 85, 
    completedAt: "2025-01-02", 
    passed: true,
    durationMinutes: 60,
    questionLimit: 12
  },
  { 
    id: "stats-1", 
    title: "Statistics Fundamentals", 
    score: 72, 
    completedAt: "2025-01-15", 
    passed: true,
    durationMinutes: 90,
    questionLimit: 15
  },
];

export default async function AssessmentPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/50">
      <MobileSidebar active="/assessment" />
      <div className="lg:flex lg:gap-6 max-w-screen-2xl mx-auto p-4 md:p-6">
        <Sidebar active="/assessment" />
        <section className="flex-1">
          {/* Enhanced Hero Section */}
          <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-8 backdrop-blur-xl shadow-xl mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200/50 px-4 py-2 text-sm font-medium text-emerald-700">
                  <Trophy className="h-4 w-4 text-emerald-500" />
                  Assessment Center
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>2 exams completed</span>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold leading-tight text-gray-900 mb-3">
                Test Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Knowledge</span>
              </h1>
              <p className="text-lg text-gray-600 mb-6">Take comprehensive exams to validate your learning and earn certifications.</p>
              
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Target className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">78%</div>
                      <div className="text-sm text-gray-500">Average Score</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileCheck2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">4</div>
                      <div className="text-sm text-gray-500">Available Exams</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Star className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-amber-600">2</div>
                      <div className="text-sm text-gray-500">Certificates Earned</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Tabs */}
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/60 border border-white/60 rounded-xl p-1">
              <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Available Exams
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Completed Exams
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {UPCOMING.map((ex, index) => (
                  <div key={ex.id} className="group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg transition-all hover:shadow-2xl hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl ${
                            index % 2 === 0 ? 'bg-emerald-100' : 'bg-blue-100'
                          }`}>
                            <FileCheck2 className={`h-6 w-6 ${
                              index % 2 === 0 ? 'text-emerald-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{ex.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                                {ex.questionLimit} questions
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                      
                      {/* Exam Details */}
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-gray-500" />
                          <div>
                            <div className="font-medium text-gray-900">{ex.durationMinutes} Minutes</div>
                            <div className="text-sm text-gray-500">Total duration</div>
                          </div>
                        </div>
                        
                        <div className="rounded-lg bg-white/60 border border-white/60 p-3">
                          <div className="text-sm text-gray-600">
                            Test your understanding of key concepts and practical applications.
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <a 
                        href="/assessment/start" 
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all hover:shadow-lg ${
                          index % 2 === 0 
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700' 
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                        }`}
                      >
                        <Play className="h-4 w-4" />
                        Start Exam
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <div className="space-y-4">
                {COMPLETED.map((exam) => (
                  <div key={exam.id} className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${exam.passed ? 'bg-green-100' : 'bg-red-100'}`}>
                          {exam.passed ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <AlertCircle className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{exam.title}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>Completed: {new Date(exam.completedAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{exam.questionLimit} questions</span>
                            <span>•</span>
                            <span>{exam.durationMinutes} minutes</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${exam.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {exam.score}%
                        </div>
                        <div className={`text-sm ${exam.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {exam.passed ? 'Passed' : 'Failed'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {COMPLETED.length === 0 && (
                  <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-12 backdrop-blur-xl shadow-lg text-center">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No completed exams yet</h3>
                    <p className="text-gray-600">Your completed exams will appear here after submission.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}
