import { redirect } from "next/navigation"
import { FirstAssessmentRedirector } from "@/components/first-assessment-redirector"
import { apiGet } from "@/lib/api"
import { supabaseServer } from "@/lib/supabase-server"
import { Sidebar } from "./sidebar"
import { MobileSidebar } from "./mobile-sidebar"
import { BookOpen, Trophy, Target, TrendingUp, Star, Calendar, Brain, Sparkles, Award, Zap, Clock, ChevronRight, Play, Users, BarChart3, Flame } from "lucide-react"
import { GamificationProvider, GamificationStrip } from "@/components/gamification"

type DashboardData = {
  role?: string
  user: { id: string; displayName: string }
  stats?: { xp: number; streakDays: number; tier: "Bronze" | "Silver" | "Gold" }
  weeklyXp?: { week: string; XP: number }[]
  completion?: { name: string; value: number }[]
  nextActions?: { label: string; href: string }[]
  recommendations?: { title: string; tag: string }[]
  panels?: string[]
  coins?: number
  leaderboardPosition?: number
  badges?: { name: string; earnedAt?: string }[]
  history?: { date: string; action: string; xp?: number; coins?: number }[]
}

export default async function DashboardPage() {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect("/login")

  // Check user onboarding flow
  const profile = await apiGet<any>("/v1/profile").catch(() => null)
  
  // First: Check if profile onboarding is completed
  if (!profile?.onboarding_completed) {
    redirect("/profile")
  }

  // Second: Client-side one-time redirect to assessment after profile completion
  const shouldCheckFirstAssessment = !profile?.assessment_completed_at

  let data: DashboardData
  try {
    data = await apiGet<DashboardData>("/v1/dashboard")
  } catch {
    data = {
      role: 'student',
      user: { id: user.id, displayName: user.email?.split("@")[0] ?? "Learner" },
      stats: { xp: 1540, streakDays: 7, tier: "Silver" },
      weeklyXp: [
        { week: '2025-08-18', XP: 120 },
        { week: '2025-08-25', XP: 200 },
        { week: '2025-09-01', XP: 180 },
        { week: '2025-09-08', XP: 240 },
      ],
      completion: [
        { name: 'Core Lessons', value: 78 },
        { name: 'Practice Exercises', value: 65 },
        { name: 'Projects', value: 42 },
      ],
      nextActions: [
        { label: 'Complete SQL Advanced Module', href: '/curriculum' },
        { label: 'Take Data Visualization Assessment', href: '/assessment' },
        { label: 'Join Today\'s Live Session', href: '/schedule' },
        { label: 'Solve Daily Coding Challenge', href: '/logical-reasoning' },
      ],
      recommendations: [
        { title: 'Advanced SQL Window Functions', tag: 'SQL • Intermediate • 45 mins' },
        { title: 'Python Data Analysis Bootcamp', tag: 'Python • Beginner • 2 hours' },
        { title: 'Business Intelligence Case Study', tag: 'Project • Advanced • 1.5 hours' },
        { title: 'Statistical Testing in R', tag: 'Statistics • Intermediate • 30 mins' },
      ],
      coins: 450,
      leaderboardPosition: 8,
      badges: [
        { name: 'SQL Ninja', earnedAt: '2025-01-05' },
        { name: 'Data Visualization Pro', earnedAt: '2025-01-03' },
        { name: 'Weekly Warrior', earnedAt: '2025-01-01' },
        { name: 'Problem Solver', earnedAt: '2024-12-28' },
        { name: 'Team Player', earnedAt: '2024-12-25' },
      ],
      history: [
        { date: new Date().toISOString(), action: 'Completed Advanced Joins Module', xp: 50, coins: 25 },
        { date: new Date(Date.now() - 3600000).toISOString(), action: 'Earned badge: SQL Ninja', xp: 100, coins: 50 },
        { date: new Date(Date.now() - 86400000).toISOString(), action: 'Solved Daily Trivia Challenge', xp: 30, coins: 15 },
        { date: new Date(Date.now() - 2*86400000).toISOString(), action: 'Attended Live Session: Data Analytics', xp: 25, coins: 10 },
        { date: new Date(Date.now() - 3*86400000).toISOString(), action: 'Completed Python Basics Assessment', xp: 75, coins: 35 },
      ],
    }
  }

  const role = (data.role ?? 'student').toLowerCase()
  if (role === 'admin') redirect('/admin')
  if (role === 'teacher') redirect('/teacher')

  // Resolve display name dynamically: API -> Supabase metadata -> email -> fallback
  const displayName = (
    data.user?.displayName?.trim() ||
    (user?.user_metadata?.full_name && String(user.user_metadata.full_name).trim()) ||
    (user?.user_metadata?.name && String(user.user_metadata.name).trim()) ||
    (user?.user_metadata?.display_name && String(user.user_metadata.display_name).trim()) ||
    (user?.email ? user.email.split("@")[0] : undefined) ||
    "Learner"
  )
  const stats = data.stats ?? { xp: 0, streakDays: 0, tier: "Bronze" as const }
  const xp = stats.xp ?? 0
  const streakDays = stats.streakDays ?? 0
  const tier = stats.tier ?? "Bronze"
  const coins = typeof data.coins === 'number' ? data.coins : 0
  const leaderboardPosition = typeof data.leaderboardPosition === 'number' ? data.leaderboardPosition : 0
  const nextActions = Array.isArray(data.nextActions) ? data.nextActions : []
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : []
  const completion = Array.isArray(data.completion) ? data.completion : []
  const badges = Array.isArray(data.badges) ? data.badges : []
  const history = Array.isArray(data.history) ? data.history : []

  // Level derived from XP: 1000 XP per level
  const level = Math.floor(xp / 1000) + 1
  const progressWithinLevel = xp % 1000
  const progressPercent = (progressWithinLevel / 1000) * 100
  const xpToNext = 1000 - progressWithinLevel

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'gold': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'silver': return 'text-gray-600 bg-gray-100 border-gray-200'
      default: return 'text-amber-600 bg-amber-100 border-amber-200'
    }
  }

  // User data for sidebar
  const sidebarUser = {
    name: displayName,
    email: data.user?.email || 'learner@example.com',
    tier: tier,
    xp: xp,
    level: level
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <FirstAssessmentRedirector shouldCheck={shouldCheckFirstAssessment} />
      <MobileSidebar active="/dashboard" user={sidebarUser} />
      <div className="lg:flex lg:gap-6 max-w-screen-2xl mx-auto p-4 md:p-6">
        <Sidebar active="/dashboard" user={sidebarUser} />

        <section className="flex-1">
          {/* Dynamic Gamification Strip (live stats) */}
          <GamificationProvider userId={user.id}>
            <div className="mb-6">
              <GamificationStrip />
            </div>
          </GamificationProvider>
          {/* Enhanced Hero Section */}
          <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-8 backdrop-blur-xl shadow-xl mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-200/20 to-cyan-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 px-4 py-2 text-sm font-medium text-indigo-700">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  AI-Powered Learning Dashboard
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getTierColor(tier)}`}>
                    {tier} Tier
                  </div>
                  <div className="px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium">
                    Level {level}
                  </div>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold leading-tight text-gray-900 mb-3">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{displayName}</span>! 🚀
              </h1>
              <p className="text-lg text-gray-600 mb-6">Ready to continue your analytics journey? Let's make today count!</p>
              
              {/* Progress Ring and Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1">
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="3"
                        strokeDasharray={`${progressPercent}, 100`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor: '#6366f1'}} />
                          <stop offset="100%" style={{stopColor: '#8b5cf6'}} />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{Math.round(progressPercent)}%</div>
                        <div className="text-xs text-gray-500">to Level {level + 1}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <div className="text-sm text-gray-600">{xpToNext} XP to next level</div>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-xl bg-white/60 border border-white/60">
                      <div className="flex items-center justify-center mb-2">
                        <Zap className="h-5 w-5 text-indigo-500 mr-1" />
                      </div>
                      <div className="text-3xl font-bold text-indigo-600">{xp.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Total XP</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/60 border border-white/60">
                      <div className="flex items-center justify-center mb-2">
                        <Flame className="h-5 w-5 text-orange-500 mr-1" />
                      </div>
                      <div className="text-3xl font-bold text-emerald-600">{streakDays}</div>
                      <div className="text-sm text-gray-500">Day Streak</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/60 border border-white/60">
                      <div className="flex items-center justify-center mb-2">
                        <Star className="h-5 w-5 text-amber-500 mr-1" />
                      </div>
                      <div className="text-3xl font-bold text-amber-600">{coins.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Coins</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-white/60 border border-white/60">
                      <div className="flex items-center justify-center mb-2">
                        <Trophy className="h-5 w-5 text-purple-500 mr-1" />
                      </div>
                      <div className="text-3xl font-bold text-purple-600">#{leaderboardPosition}</div>
                      <div className="text-sm text-gray-500">Rank</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Quick Actions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Target className="h-6 w-6 text-indigo-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="/curriculum" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg transition-all hover:shadow-2xl hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent"></div>
                <div className="relative">
                  <BookOpen className="h-8 w-8 mb-3" />
                  <h3 className="font-semibold text-lg mb-1">My Courses</h3>
                  <p className="text-blue-100 text-sm">Continue learning</p>
                </div>
              </a>
              
              <a href="/assessment" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg transition-all hover:shadow-2xl hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent"></div>
                <div className="relative">
                  <Trophy className="h-8 w-8 mb-3" />
                  <h3 className="font-semibold text-lg mb-1">Take Exam</h3>
                  <p className="text-emerald-100 text-sm">Test your skills</p>
                </div>
              </a>
              
              <a href="/schedule" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg transition-all hover:shadow-2xl hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-transparent"></div>
                <div className="relative">
                  <Calendar className="h-8 w-8 mb-3" />
                  <h3 className="font-semibold text-lg mb-1">Class Schedule</h3>
                  <p className="text-purple-100 text-sm">View timetable</p>
                </div>
              </a>
              
              <a href="/logical-reasoning" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white shadow-lg transition-all hover:shadow-2xl hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-transparent"></div>
                <div className="relative">
                  <Brain className="h-8 w-8 mb-3" />
                  <h3 className="font-semibold text-lg mb-1">Daily Trivia</h3>
                  <p className="text-amber-100 text-sm">Brain training</p>
                </div>
              </a>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-emerald-500" />
              Learning Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {completion.map((item, index) => (
                <div key={item.name} className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <span className="text-2xl font-bold text-indigo-600">{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{width: `${item.value}%`}}
                    ></div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {item.value < 50 ? 'Keep going!' : item.value < 80 ? 'Great progress!' : 'Almost there!'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Actions & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Next Actions */}
            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Play className="h-5 w-5 text-indigo-500" />
                Next Actions
              </h3>
              <div className="space-y-4">
                {nextActions.map((action, index) => (
                  <a key={action.label} href={action.href} className="group flex items-center justify-between p-4 rounded-xl bg-white/60 border border-white/60 hover:bg-indigo-50 hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{action.label}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Recommended for You
              </h3>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.title} className="p-4 rounded-xl bg-white/60 border border-white/60 hover:bg-amber-50 hover:border-amber-200 transition-all cursor-pointer">
                    <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                    <p className="text-sm text-gray-600">{rec.tag}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Badges & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Badges */}
            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Recent Badges
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {badges.slice(0, 4).map((badge) => (
                  <div key={badge.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-white/60">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Award className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">{badge.name}</div>
                      <div className="text-xs text-gray-500">
                        {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Recent Activity
              </h3>
              <div className="space-y-4">
                {history.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-white/60">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{item.action}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.date).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      {item.xp && item.xp > 0 && (
                        <div className="text-sm font-medium text-indigo-600">+{item.xp} XP</div>
                      )}
                      {item.coins && item.coins > 0 && (
                        <div className="text-xs text-amber-600">+{item.coins} coins</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Motivational Banner */}
          <div className="rounded-2xl border border-gradient-to-r from-purple-200/60 to-pink-200/60 bg-gradient-to-br from-purple-50/80 to-pink-50/80 p-6 backdrop-blur-xl mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-200 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-purple-700" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900">🎯 Keep Up the Great Work!</h3>
                  <p className="text-sm text-purple-700">You're {xpToNext} XP away from Level {level + 1}. Complete a lesson to level up!</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{streakDays} 🔥</div>
                <div className="text-sm text-purple-600">Day Streak</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
