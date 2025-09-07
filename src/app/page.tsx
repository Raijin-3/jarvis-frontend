"use client"

import Link from "next/link"
import {
  Brain, Sparkles, LineChart, Trophy, ShieldCheck, BookOpen, Rocket,
  ArrowRight, CheckCircle2, BarChart3, Workflow, Users, MessageSquare,
  TrendingUp, Target, Zap, Star, Award, Globe, Play, ChevronRight, Clock
} from "lucide-react"

export default function Page() {
  return (
    <div className="min-h-screen relative">
      {/* Modern Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50" />
        
        {/* Animated Orbs */}
        <div 
          className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" 
          style={{ animationDuration: '4s', animationDelay: '0s' }} 
        />
        <div 
          className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-emerald-400/15 to-teal-400/15 rounded-full blur-3xl animate-pulse" 
          style={{ animationDuration: '6s', animationDelay: '2s' }} 
        />
        <div 
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse" 
          style={{ animationDuration: '5s', animationDelay: '1s' }} 
        />
      </div>

      <main className="relative">
        <HeroSection />
        <LogosSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ShowcaseSection />
        <TestimonialsSection />
        <FAQSection />
      </main>

      <FooterSection />
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-md shadow-lg animate-in slide-in-from-bottom-4 duration-1000">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent font-semibold">
                AI-powered learning
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-8 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl animate-in slide-in-from-bottom-6 duration-1000 delay-200">
              Learn Analytics{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
                faster
              </span>{" "}
              with AI
            </h1>

            {/* Subtext */}
            <p className="mt-6 max-w-xl text-lg text-gray-600 md:text-xl leading-relaxed animate-in slide-in-from-bottom-8 duration-1000 delay-400">
              Jarvis personalizes your learning path using adaptive practice, AI-generated case studies, 
              and interview prep—all gamified with XP, streaks, and leaderboards.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row animate-in slide-in-from-bottom-10 duration-1000 delay-600">
              <Link
                href="/login"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Start Learning Free 
                <Rocket className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#how"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-8 py-4 font-semibold backdrop-blur-md hover:bg-white/20 transition-all duration-300"
              >
                See How it Works 
                <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-6 animate-in slide-in-from-bottom-12 duration-1000 delay-800">
              {[
                { icon: <TrendingUp className="h-6 w-6" />, value: "37%", label: "Time Saved", color: "from-emerald-500 to-teal-500" },
                { icon: <Users className="h-6 w-6" />, value: "12,000+", label: "Learners", color: "from-indigo-500 to-purple-500" },
                { icon: <Award className="h-6 w-6" />, value: "8,500+", label: "Projects", color: "from-purple-500 to-pink-500" },
              ].map((stat, index) => (
                <div key={stat.label} className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className={`inline-flex p-2 rounded-xl bg-gradient-to-r ${stat.color} shadow-md mb-3`}>
                      <div className="text-white">{stat.icon}</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Enhanced Dashboard Preview */}
          <div className="relative lg:pl-8 animate-in slide-in-from-right-8 duration-1000 delay-300">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-emerald-500/10" />
                
                <div className="relative p-6 md:p-8">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg">
                        <Brain className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Your Learning Path</h3>
                        <p className="text-gray-600">Data Analytics Track</p>
                      </div>
                    </div>
                    <div className="rounded-full bg-gradient-to-r from-emerald-100 to-emerald-200 px-4 py-2 shadow-sm">
                      <span className="text-sm font-bold text-emerald-700">AI-Adaptive</span>
                    </div>
                  </div>

                  {/* Course Cards */}
                  <div className="grid gap-4 md:grid-cols-2 mb-8">
                    <LearningCard 
                      title="SQL Mastery" 
                      subtitle="Beginner • Required" 
                      icon={<BookOpen className="h-5 w-5" />} 
                      progress={85} 
                      color="from-blue-500 to-cyan-500"
                    />
                    <LearningCard 
                      title="A/B Testing" 
                      subtitle="Intermediate • Recommended" 
                      icon={<BarChart3 className="h-5 w-5" />} 
                      progress={60} 
                      color="from-emerald-500 to-teal-500"
                    />
                    <LearningCard 
                      title="Case Study" 
                      subtitle="Advanced • Project" 
                      icon={<Workflow className="h-5 w-5" />} 
                      progress={30} 
                      color="from-purple-500 to-pink-500"
                    />
                    <LearningCard 
                      title="Interview Prep" 
                      subtitle="Mock Interviews" 
                      icon={<MessageSquare className="h-5 w-5" />} 
                      progress={0} 
                      color="from-orange-500 to-red-500"
                    />
                  </div>

                  {/* Progress Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "XP Points", value: "5,420", gradient: "from-yellow-400 via-orange-400 to-red-500" },
                      { label: "Day Streak", value: "12", gradient: "from-emerald-400 via-teal-400 to-blue-500" },
                      { label: "Tier", value: "Silver", gradient: "from-gray-400 via-gray-500 to-gray-600" },
                    ].map((item, index) => (
                      <div key={item.label} className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm text-center">
                        <div className="text-xs font-medium text-gray-600 mb-2">{item.label}</div>
                        <div className={`text-lg font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Floating Achievement Badges */}
              <div className="absolute -top-4 -right-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-4 -left-4 p-3 rounded-2xl bg-gradient-to-r from-purple-400 to-indigo-500 shadow-xl animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3s' }}>
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function LogosSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 md:p-12 backdrop-blur-md shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-emerald-500/5" />
          
          <div className="relative text-center">
            <p className="text-gray-600 font-medium mb-8">Trusted by learners from</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center mb-8">
              {[
                { name: "Microsoft", gradient: "from-blue-600 to-blue-800" },
                { name: "Google", gradient: "from-emerald-600 to-green-700" },
                { name: "Amazon", gradient: "from-orange-500 to-yellow-600" },
                { name: "Apple", gradient: "from-gray-700 to-gray-900" },
                { name: "Meta", gradient: "from-blue-500 to-indigo-600" },
                { name: "Netflix", gradient: "from-red-600 to-red-800" },
              ].map((company) => (
                <div key={company.name} className="group cursor-pointer">
                  <div className={`text-xl font-bold bg-gradient-to-r ${company.gradient} bg-clip-text text-transparent opacity-70 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110`}>
                    {company.name}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-gray-600">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-emerald-100/80 backdrop-blur-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="font-medium">Verified by industry leaders</span>
              </div>
              <div className="hidden md:block w-2 h-2 rounded-full bg-gray-300" />
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-600" />
                <span className="font-medium">95+ countries</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: <Brain className="h-7 w-7" />,
      title: "Adaptive Learning",
      description: "AI-powered difficulty calibration that adapts to your learning pace in real-time.",
      gradient: "from-purple-500 to-indigo-600",
      bgGradient: "from-purple-50/50 to-indigo-50/50",
      borderGradient: "from-purple-200/50 to-indigo-200/50",
    },
    {
      icon: <Sparkles className="h-7 w-7" />,
      title: "AI Case Studies",
      description: "Generate domain-specific assignments and real-world projects on demand.",
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50/50 to-teal-50/50",
      borderGradient: "from-emerald-200/50 to-teal-200/50",
    },
    {
      icon: <ShieldCheck className="h-7 w-7" />,
      title: "Smart Feedback",
      description: "Get targeted hints, personalized strength plans, and AI-powered interview scorecards.",
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-50/50 to-cyan-50/50",
      borderGradient: "from-blue-200/50 to-cyan-200/50",
    },
    {
      icon: <Trophy className="h-7 w-7" />,
      title: "Gamified Learning",
      description: "Earn XP, maintain streaks, climb tiers, and compete on weekly leaderboards.",
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-50/50 to-orange-50/50",
      borderGradient: "from-amber-200/50 to-orange-200/50",
    },
    {
      icon: <LineChart className="h-7 w-7" />,
      title: "Advanced Analytics",
      description: "Track engagement, completion rates, learning hours, and AI adoption metrics.",
      gradient: "from-rose-500 to-pink-600",
      bgGradient: "from-rose-50/50 to-pink-50/50",
      borderGradient: "from-rose-200/50 to-pink-200/50",
    },
    {
      icon: <Users className="h-7 w-7" />,
      title: "Social Learning",
      description: "Join cohorts, challenge friends to duels, and participate in group challenges.",
      gradient: "from-violet-500 to-purple-600",
      bgGradient: "from-violet-50/50 to-purple-50/50",
      borderGradient: "from-violet-200/50 to-purple-200/50",
    },
  ]

  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-md shadow-lg mb-6">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent font-semibold">
              Everything You Need
            </span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Go from{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Learner
            </span>{" "}
            to{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
              Job-Ready
            </span>
          </h2>
          
          <p className="mx-auto max-w-3xl text-xl text-gray-600 leading-relaxed">
            Bite-sized lessons, adaptive practice, real datasets, and career preparation — 
            all powered by AI in one comprehensive platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title} 
              className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105"
              style={{ 
                animationDelay: `${index * 150}ms`,
                animation: 'fadeInUp 0.8s ease-out forwards'
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed mb-6 group-hover:text-gray-700 transition-colors">
                  {feature.description}
                </p>
                
                <div className="flex items-center text-sm font-semibold group-hover:translate-x-1 transition-transform duration-300">
                  <span className={`bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                    Learn more
                  </span>
                  <ArrowRight className="ml-2 h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    { 
      title: "1. Assess & Personalize", 
      description: "Take a 25-Q placement; we map your mandatory & optional modules.", 
      icon: <Target className="h-6 w-6" />,
      color: "from-indigo-500 to-purple-500"
    },
    { 
      title: "2. Practice Adaptively", 
      description: "One-question flow ramps difficulty; spaced review fills gaps.", 
      icon: <Brain className="h-6 w-6" />,
      color: "from-emerald-500 to-teal-500"
    },
    { 
      title: "3. Build & Showcase", 
      description: "Ship real projects, then prep interviews with AI scorecards.", 
      icon: <Rocket className="h-6 w-6" />,
      color: "from-orange-500 to-red-500"
    },
  ]

  return (
    <section id="how" className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 md:p-12 backdrop-blur-md shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-emerald-500/5" />
          
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12 text-center">How it works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={step.title} className="relative group">
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${step.color} shadow-lg`}>
                        <div className="text-white">{step.icon}</div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                    </div>
                    
                    <p className="text-gray-600 leading-relaxed mb-4">{step.description}</p>
                    
                    {index < steps.length - 1 && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Next:</span>
                        <span className="font-semibold">{steps[index + 1].title}</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  
                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 transform -translate-y-1/2 z-10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ShowcaseSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Adaptive practice, visualized</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                See your mastery grow by skill; quick reviews keep knowledge fresh.
              </p>
              
              <div className="relative aspect-[16/10] w-full rounded-2xl border border-white/20 bg-gradient-to-br from-indigo-100/50 via-purple-100/50 to-emerald-100/50 overflow-hidden">
                <div className="absolute inset-4">
                  <div className="grid grid-cols-4 gap-2 h-full">
                    {Array.from({ length: 16 }).map((_, i) => {
                      // Fixed heights to avoid hydration mismatch
                      const heights = [85, 92, 76, 88, 65, 95, 80, 90, 70, 85, 95, 75, 60, 80, 85, 70];
                      return (
                        <div 
                          key={i} 
                          className={`rounded-lg ${
                            i < 8 ? 'bg-gradient-to-t from-emerald-300 to-emerald-200' : 
                            i < 12 ? 'bg-gradient-to-t from-yellow-300 to-yellow-200' : 
                            'bg-gradient-to-t from-red-300 to-red-200'
                          } opacity-80`}
                          style={{ height: `${heights[i]}%`, marginTop: 'auto' }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Teacher analytics that matter</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Weekly actives, logins, hours, completion & AI adoption — at a glance.
              </p>
              
              <div className="relative aspect-[16/10] w-full rounded-2xl border border-white/20 bg-gradient-to-br from-cyan-100/50 via-blue-100/50 to-indigo-100/50 overflow-hidden">
                <div className="absolute inset-4 grid grid-cols-3 gap-4">
                  {[
                    { label: "Active Users", value: "1,247", color: "emerald" },
                    { label: "Completion", value: "87%", color: "blue" },
                    { label: "AI Usage", value: "94%", color: "purple" }
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/60 rounded-xl p-4 backdrop-blur-sm">
                      <div className="text-xs text-gray-600 mb-1">{stat.label}</div>
                      <div className={`text-2xl font-bold bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 bg-clip-text text-transparent`}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}



function TestimonialsSection() {
  const testimonials = [
    {
      quote: "The adaptive flow pushed me just enough—my SQL confidence shot up in a week.",
      author: "Maya K., Product Analyst",
      avatar: "M"
    },
    {
      quote: "Case studies felt real. I used my projects from Jarvis in interviews.",
      author: "Ravi S., Data Analyst", 
      avatar: "R"
    },
    {
      quote: "Leaderboards kept my cohort engaged; teacher KPIs made reporting painless.",
      author: "Anita D., Instructor",
      avatar: "A"
    },
  ]

  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 md:p-12 backdrop-blur-md shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-emerald-500/5" />
          
          <div className="relative text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-16">Loved by learners & instructors</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <figure key={testimonial.author} className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative">
                    <blockquote className="text-lg leading-relaxed text-gray-700 mb-6 italic">
                      "{testimonial.quote}"
                    </blockquote>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-lg">
                        {testimonial.avatar}
                      </div>
                      <figcaption className="text-sm font-medium text-gray-600">
                        {testimonial.author}
                      </figcaption>
                    </div>
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FAQSection() {
  const faqs = [
    { 
      question: "Is there a free plan?", 
      answer: "Yes! Core lessons, quizzes, daily review packs, and leaderboards are completely free. You can start learning immediately without any payment required." 
    },
    { 
      question: "How does adaptivity work?", 
      answer: "Our AI analyzes your performance in real-time and adjusts difficulty per skill. We also schedule spaced reviews to reinforce learning and fill knowledge gaps automatically." 
    },
    { 
      question: "Can I use real datasets?", 
      answer: "Absolutely! Pro users get access to our AI case-study generator that creates domain-specific projects using real, anonymized datasets from various industries." 
    },
    { 
      question: "What about teams?", 
      answer: "Teams get comprehensive features including cohort dashboards, SSO/SAML integration, admin roles, custom learning tracks, and detailed analytics for instructors." 
    },
  ]

  return (
    <section id="faq" className="py-20 md:py-24">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Frequently asked questions</h2>
          <p className="text-xl text-gray-600">Everything you need to know about Jarvis</p>
        </div>

        <div className="space-y-4 mb-12">
          {faqs.map((faq) => (
            <details key={faq.question} className="group overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-lg">
              <summary className="flex cursor-pointer list-none items-center justify-between p-6 font-semibold text-gray-900 hover:bg-white/20 transition-all duration-300">
                <span className="text-lg">{faq.question}</span>
                <span className="ml-4 flex-shrink-0 text-gray-500 transition-transform duration-300 group-open:rotate-180">
                  <ChevronRight className="h-5 w-5 rotate-90" />
                </span>
              </summary>
              <div className="border-t border-white/20 bg-white/10 p-6">
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="text-center">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-md shadow-lg">
            <p className="text-lg text-gray-600 mb-4">Still have questions?</p>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Contact us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function FooterSection() {
  return (
    <footer className="relative border-t border-white/20 bg-white/10 backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-emerald-500/5" />
      
      <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                  Jarvis
                </div>
                <div className="text-gray-600">AI Learning</div>
              </div>
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-6 max-w-sm">
              Transforming how people learn analytics through AI-powered personalization, 
              adaptive practice, and real-world applications.
            </p>
            
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="text-gray-600 font-medium">Trusted by 12,000+ learners</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Product</h3>
            <ul className="space-y-3">
              {[
                { label: "Features", href: "#features" },
                { label: "How it Works", href: "#how" },
                { label: "Get Started", href: "/login" },
              ].map((item) => (
                <li key={item.label}>
                  <a 
                    href={item.href} 
                    className="text-gray-600 hover:text-indigo-600 transition-all duration-300 hover:translate-x-1 transform inline-block"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Company</h3>
            <ul className="space-y-3">
              {[
                { label: "About Us", href: "/about" },
                { label: "Careers", href: "/careers" },
                { label: "Contact", href: "/contact" },
                { label: "Blog", href: "/blog" },
              ].map((item) => (
                <li key={item.label}>
                  <Link 
                    href={item.href} 
                    className="text-gray-600 hover:text-indigo-600 transition-all duration-300 hover:translate-x-1 transform inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Legal & Support</h3>
            <ul className="space-y-3">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Help Center", href: "/help" },
                { label: "Status", href: "/status" },
              ].map((item) => (
                <li key={item.label}>
                  <Link 
                    href={item.href} 
                    className="text-gray-600 hover:text-indigo-600 transition-all duration-300 hover:translate-x-1 transform inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-600">
              © {new Date().getFullYear()} Jarvis AI Learning Platform. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All systems operational</span>
              </div>
              <div className="text-gray-600">
                Made with ❤️ for learners worldwide
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function LearningCard({ 
  title, 
  subtitle, 
  icon, 
  progress, 
  color 
}: { 
  title: string
  subtitle: string
  icon: React.ReactNode
  progress: number
  color: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 group hover:scale-105">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-xl bg-gradient-to-r ${color} shadow-md`}>
            <div className="text-white">{icon}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{title}</div>
            <div className="text-sm text-gray-600">{subtitle}</div>
          </div>
        </div>
        
        <div className="relative h-2 bg-gray-200/60 rounded-full overflow-hidden mb-2">
          <div 
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-xs text-gray-600 text-right font-medium">{progress}% complete</div>
      </div>
    </div>
  )
}