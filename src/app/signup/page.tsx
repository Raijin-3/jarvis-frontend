import { redirect } from "next/navigation"
import { supabaseServer } from "@/lib/supabase-server"
import { SignupForm } from "@/components/auth/signup-form"
import { Brain, Sparkles, Trophy, BookOpen, TrendingUp, Users, Zap, Shield, Target, Rocket } from "lucide-react"

export const metadata = {
  title: "Create account | Jarvis",
  description: "Sign up for Jarvis - AI-powered learning platform",
}

export default async function SignupPage() {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (user) redirect("/dashboard")

  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-indigo-50">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_100%_-20%,rgba(16,185,129,.15),transparent)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(800px_600px_at_-10%_120%,rgba(99,102,241,.12),transparent)] animate-pulse" style={{animationDelay: '1s'}}></div>
        {/* Floating Shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce" style={{animationDelay: '0s', animationDuration: '6s'}}></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce" style={{animationDelay: '2s', animationDuration: '8s'}}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce" style={{animationDelay: '4s', animationDuration: '7s'}}></div>
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 p-4 md:p-6 lg:grid-cols-2 min-h-dvh items-center">
        {/* Left hero section - Enhanced */}
        <section className="relative order-2 lg:order-1 flex items-center">
          <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/40 p-8 shadow-2xl backdrop-blur-md lg:p-12 w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-indigo-500/5"></div>
            
            <div className="relative space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-4 py-2 text-sm font-medium text-emerald-700 backdrop-blur">
                  <Rocket className="h-4 w-4" />
                  Start Your Journey
                </div>
                <h1 className="text-4xl font-bold leading-tight text-gray-900 lg:text-5xl">
                  Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600">Jarvis</span> Today
                </h1>
                <p className="text-lg text-gray-600 max-w-md">
                  Create your account to access personalized AI-driven learning, adaptive practice, and accelerate your analytics career.
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="group rounded-xl border border-white/60 bg-white/60 p-4 backdrop-blur transition-all hover:bg-white/80 hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 p-2">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Personalized Path</h3>
                      <p className="text-sm text-gray-600">AI-curated learning journey</p>
                    </div>
                  </div>
                </div>

                <div className="group rounded-xl border border-white/60 bg-white/60 p-4 backdrop-blur transition-all hover:bg-white/80 hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 p-2">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Instant Feedback</h3>
                      <p className="text-sm text-gray-600">Real-time code analysis</p>
                    </div>
                  </div>
                </div>

                <div className="group rounded-xl border border-white/60 bg-white/60 p-4 backdrop-blur transition-all hover:bg-white/80 hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 p-2">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Achievement System</h3>
                      <p className="text-sm text-gray-600">Earn XP and unlock content</p>
                    </div>
                  </div>
                </div>

                <div className="group rounded-xl border border-white/60 bg-white/60 p-4 backdrop-blur transition-all hover:bg-white/80 hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-2">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Hands-on Projects</h3>
                      <p className="text-sm text-gray-600">Build real-world portfolio</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* What You Get */}
              <div className="rounded-xl border border-white/60 bg-white/60 p-6 backdrop-blur">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What you get with your free account:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    Access to beginner courses
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    AI-powered practice exercises
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    Progress tracking & analytics
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    Community discussion access
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    Daily coding challenges
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    Certificate of completion
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "New Users", value: "500+", subtitle: "this month", icon: <Users className="h-5 w-5" /> },
                  { label: "Success Rate", value: "94%", subtitle: "completion", icon: <TrendingUp className="h-5 w-5" /> },
                  { label: "Career Growth", value: "2.3x", subtitle: "salary boost", icon: <Trophy className="h-5 w-5" /> },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-white/60 bg-white/60 p-4 text-center backdrop-blur">
                    <div className="flex justify-center text-emerald-600 mb-2">{stat.icon}</div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-600">{stat.label}</div>
                    <div className="text-xs text-gray-500">{stat.subtitle}</div>
                  </div>
                ))}
              </div>

              {/* Security Badge */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm font-medium">Your data is secure and encrypted with industry-standard protection</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right panel: Enhanced Signup Form */}
        <section className="order-1 lg:order-2 flex items-center justify-center min-h-[calc(100vh-6rem)]">
          <div className="w-full max-w-md">
            <SignupForm />
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <a 
                  href="/login" 
                  className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors duration-200 underline decoration-2 underline-offset-4 hover:decoration-emerald-300"
                >
                  Sign in here
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

