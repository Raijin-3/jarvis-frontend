import { redirect } from "next/navigation";
import { FirstAssessmentRedirector } from "@/components/first-assessment-redirector";
import { apiGet } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase-server";
import { Sidebar } from "../dashboard/sidebar";
import { MobileSidebar } from "../dashboard/mobile-sidebar";
import { GamificationProvider, GamificationStrip, DailyChallenges, NotificationCenter, BadgeMini } from "@/components/gamification";
import { BookOpen, Trophy, Target, TrendingUp, Star, Calendar, Brain, Sparkles, Award, Zap, Clock, ChevronRight, Play, Users, BarChart3, Flame } from "lucide-react";

type DashboardData = {
  role?: string;
  user: { id: string; displayName: string };
  nextActions?: { label: string; href: string }[];
  recommendations?: { title: string; tag: string }[];
};

export default async function DashboardGamifiedPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  // Check user onboarding flow
  const profile = await apiGet<any>("/v1/profile").catch(() => null);

  // First: Check if profile onboarding is completed
  if (!profile?.onboarding_completed) {
    redirect("/profile");
  }

  // Second: Client-side one-time redirect to assessment after profile completion
  const shouldCheckFirstAssessment = !profile?.assessment_completed_at;

  let data: DashboardData;
  try {
    data = await apiGet<DashboardData>("/v1/dashboard");
  } catch {
    data = {
      role: "student",
      user: { id: user.id, displayName: user.email?.split("@")[0] ?? "Learner" },
      nextActions: [
        { label: "Complete SQL Advanced Module", href: "/curriculum" },
        { label: "Take Data Visualization Assessment", href: "/assessment" },
        { label: "Join Today's Live Session", href: "/schedule" },
        { label: "Solve Daily Coding Challenge", href: "/logical-reasoning" },
      ],
      recommendations: [
        { title: "Advanced SQL Window Functions", tag: "SQL • Intermediate • 45 mins" },
        { title: "Python Data Analysis Bootcamp", tag: "Python • Beginner • 2 hours" },
        { title: "Business Intelligence Case Study", tag: "Project • Advanced • 1.5 hours" },
        { title: "Statistical Testing in R", tag: "Statistics • Intermediate • 30 mins" },
      ],
    };
  }

  const role = (data.role ?? "student").toLowerCase();
  if (role === "admin") redirect("/admin");
  if (role === "teacher") redirect("/teacher");

  // Resolve display name dynamically
  const displayName =
    data.user?.displayName?.trim() ||
    (user?.user_metadata?.full_name && String(user.user_metadata.full_name).trim()) ||
    (user?.user_metadata?.name && String(user.user_metadata.name).trim()) ||
    (user?.user_metadata?.display_name && String(user.user_metadata.display_name).trim()) ||
    (user?.email ? user.email.split("@")[0] : undefined) ||
    "Learner";

  const nextActions = Array.isArray(data.nextActions) ? data.nextActions : [];
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];

  // User data for sidebar (using basic defaults for now)
  const sidebarUser = {
    name: displayName,
    email: data.user?.email || "learner@example.com",
    tier: "Silver",
    xp: 0,
    level: 1,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <FirstAssessmentRedirector shouldCheck={shouldCheckFirstAssessment} />
      <MobileSidebar active="/dashboard" user={sidebarUser} />
      
      <GamificationProvider userId={user.id}>
        <div className="lg:flex lg:gap-6 max-w-screen-2xl mx-auto p-4 md:p-6">
          <Sidebar active="/dashboard" user={sidebarUser} />

          <section className="flex-1 space-y-6">
            {/* Welcome Header */}
            <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-8 backdrop-blur-xl shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5"></div>
              <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 px-4 py-2 text-sm font-medium text-indigo-700">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    Dynamic Gamification Dashboard
                  </div>
                </div>
                
                <h1 className="text-4xl font-bold leading-tight text-gray-900 mb-3">
                  Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{displayName}</span>! 🚀
                </h1>
                <p className="text-lg text-gray-600 mb-6">Ready to level up your skills? Let's make today amazing!</p>
              </div>
            </div>

            {/* Dynamic Gamification Strip */}
            <GamificationStrip 
              onContinueLearning={() => {
                window.location.href = '/curriculum';
              }}
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Daily Challenges */}
              <div className="lg:col-span-2 space-y-6">
                <DailyChallenges />
                
                {/* Quick Actions */}
                <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Target className="h-6 w-6 text-indigo-500" />
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="/curriculum" className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white shadow-lg transition-all hover:shadow-2xl hover:scale-105">
                      <div className="relative">
                        <BookOpen className="h-6 w-6 mb-2" />
                        <h3 className="font-semibold mb-1">My Courses</h3>
                        <p className="text-blue-100 text-sm">Continue learning</p>
                      </div>
                    </a>
                    
                    <a href="/assessment" className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white shadow-lg transition-all hover:shadow-2xl hover:scale-105">
                      <div className="relative">
                        <Trophy className="h-6 w-6 mb-2" />
                        <h3 className="font-semibold mb-1">Take Assessment</h3>
                        <p className="text-emerald-100 text-sm">Test your skills</p>
                      </div>
                    </a>

                    <a href="/labs" className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-white shadow-lg transition-all hover:shadow-2xl hover:scale-105">
                      <div className="relative">
                        <Brain className="h-6 w-6 mb-2" />
                        <h3 className="font-semibold mb-1">Practice Labs</h3>
                        <p className="text-purple-100 text-sm">Hands-on coding</p>
                      </div>
                    </a>

                    <a href="/gamification" className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 p-4 text-white shadow-lg transition-all hover:shadow-2xl hover:scale-105">
                      <div className="relative">
                        <Award className="h-6 w-6 mb-2" />
                        <h3 className="font-semibold mb-1">Gamification Hub</h3>
                        <p className="text-pink-100 text-sm">View achievements</p>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Recommended Learning */}
                <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    Recommended for You
                  </h3>
                  <div className="space-y-4">
                    {recommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-white/60 hover:shadow-md transition-shadow group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                            <BookOpen className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">{rec.title}</div>
                            <div className="text-xs text-gray-500">{rec.tag}</div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Notifications and Stats */}
              <div className="space-y-6">
                <NotificationCenter maxItems={5} />
                
                {/* Quick Stats */}
                <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Learning Overview
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">This Week</span>
                      <span className="text-sm font-medium text-gray-900">5 hours studied</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Courses Active</span>
                      <span className="text-sm font-medium text-gray-900">3 courses</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completion Rate</span>
                      <span className="text-sm font-medium text-green-600">85%</span>
                    </div>
                  </div>
                </div>

                {/* Next Actions */}
                <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    Up Next
                  </h3>
                  <div className="space-y-3">
                    {nextActions.slice(0, 4).map((action, index) => (
                      <a
                        key={index}
                        href={action.href}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border border-white/60 hover:shadow-md transition-shadow group"
                      >
                        <div className="p-1.5 bg-gradient-to-br from-green-100 to-emerald-100 rounded-md">
                          <Play className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-700 group-hover:text-green-600 transition-colors flex-1">
                          {action.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </GamificationProvider>
    </div>
  );
}