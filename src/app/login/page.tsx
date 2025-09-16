// src/app/login/page.tsx
import { redirect } from "next/navigation"
import { supabaseServer } from "@/lib/supabase-server"
import { apiGet } from "@/lib/api"
import { LoginForm } from "@/components/auth/login-form"
import { Brain, Sparkles, Trophy, BookOpen, TrendingUp, Users } from "lucide-react"

export const metadata = {
  title: "Sign in | Jarvis",
  description: "AI-powered learning platform authentication",
}

export default async function LoginPage() {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (user) {
    try {
      const p = await apiGet<any>("/v1/profile")
      const role = String(p?.role || '').toLowerCase()
      
      // Admin goes directly to admin page
      if (role === 'admin') redirect('/admin')
      
      // Teacher goes to teacher page
      if (role === 'teacher') redirect('/teacher')
      
      // Student flow: profile -> assessment -> learning path -> dashboard
      const onboardingCompleted = Boolean(p?.onboarding_completed)
      const assessmentCompleted = Boolean(p?.assessment_completed_at)
      const learningPathSet = Boolean(p?.learning_path_preference)
      
      if (!onboardingCompleted) redirect("/profile")
      if (!assessmentCompleted) redirect("/assessment") 
      if (!learningPathSet) redirect("/learning-path")
      
      // All completed - go to dashboard
      redirect("/dashboard")
    } catch {
      // If profile fetch fails, send to dashboard; dashboard will guard and redirect if needed
      redirect("/dashboard")
    }
  }

  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_100%_-20%,rgba(99,102,241,.15),transparent)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(800px_600px_at_-10%_120%,rgba(16,185,129,.12),transparent)] animate-pulse" style={{animationDelay: '1s'}}></div>
        {/* Floating Shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce" style={{animationDelay: '0s', animationDuration: '6s'}}></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce" style={{animationDelay: '2s', animationDuration: '8s'}}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce" style={{animationDelay: '4s', animationDuration: '7s'}}></div>
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 p-4 md:p-6 lg:grid-cols-2 min-h-dvh items-center">
        {/* Left hero section - Enhanced */}
        <section className="relative order-2 lg:order-1">
          <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/40 p-8 shadow-2xl backdrop-blur-md lg:p-12">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5"></div>
            
            <div className="relative space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100/80 px-4 py-2 text-sm font-medium text-indigo-700 backdrop-blur">
                  <Brain className="h-4 w-4" />
                  AI-Powered Learning
                </div>
                <h1 className="text-4xl font-bold leading-tight text-gray-900 lg:text-5xl">
                  Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">Jarvis</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-md">
                  Transform your analytics journey with personalized AI-driven learning paths, adaptive practice, and real-world projects.
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="group rounded-xl border border-white/60 bg-white/60 p-4 backdrop-blur transition-all hover:bg-white/80 hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 p-2">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Adaptive Learning</h3>
                      <p className="text-sm text-gray-600">AI adjusts difficulty in real-time</p>
                    </div>
                  </div>
                </div>

                <div className="group rounded-xl border border-white/60 bg-white/60 p-4 backdrop-blur transition-all hover:bg-white/80 hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 p-2">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Case Studies</h3>
                      <p className="text-sm text-gray-600">Real-world projects & scenarios</p>
                    </div>
                  </div>
                </div>

                <div className="group rounded-xl border border-white/60 bg-white/60 p-4 backdrop-blur transition-all hover:bg-white/80 hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 p-2">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Gamification</h3>
                      <p className="text-sm text-gray-600">XP, streaks, and leaderboards</p>
                    </div>
                  </div>
                </div>

                <div className="group rounded-xl border border-white/60 bg-white/60 p-4 backdrop-blur transition-all hover:bg-white/80 hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-2">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Analytics</h3>
                      <p className="text-sm text-gray-600">Track your progress & insights</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Active Learners", value: "12,000+", icon: <Users className="h-5 w-5" /> },
                  { label: "Time Saved", value: "37%", icon: <TrendingUp className="h-5 w-5" /> },
                  { label: "Projects Shipped", value: "8,500+", icon: <Trophy className="h-5 w-5" /> },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-white/60 bg-white/60 p-4 text-center backdrop-blur">
                    <div className="flex justify-center text-indigo-600 mb-2">{stat.icon}</div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Security Badge */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-emerald-700">
                  <div className="rounded-full bg-emerald-100 p-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  </div>
                  <span className="text-sm font-medium">Secure authentication powered by Supabase</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right panel: Enhanced Login Form */}
        <section className="order-1 lg:order-2 flex items-center justify-center">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </section>
      </div>
    </div>
  )
}
