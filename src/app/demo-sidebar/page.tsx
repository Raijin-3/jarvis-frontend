import { Sidebar } from "@/app/dashboard/sidebar"
import { MobileSidebar } from "@/app/dashboard/mobile-sidebar"
import { UserNav } from "@/components/nav/user-nav"
import { BookOpen, Trophy, Target, TrendingUp, Star, Calendar, Brain, Sparkles, Award, Zap, Clock, ChevronRight, Play, Users, BarChart3, Flame, User, Bell } from "lucide-react"

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic'

export default function SidebarDemoPage() {
  // Demo user data
  const demoUser = {
    name: "Alex Johnson",
    email: "alex.johnson@example.com", 
    tier: "Silver",
    xp: 1540,
    level: 2
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Demo Header */}
      <div className="sticky top-0 z-30 border-b border-white/20 bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 md:p-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Jarvis</span>
            <span className="text-xs text-muted-foreground">AI Learning</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-green-100 border border-green-200 text-green-700 text-xs font-medium">
              Enhanced Sidebar Demo
            </div>
            {/* Avatar with Profile, Settings, Logout dropdown */}
            <UserNav name={demoUser.name} email={demoUser.email} imageUrl={null} minimal />
          </div>
        </div>
      </div>

      <MobileSidebar active="/demo-sidebar" user={demoUser} />
      <div className="lg:flex lg:gap-6 max-w-screen-2xl mx-auto p-4 md:p-6">
        <Sidebar active="/demo-sidebar" user={demoUser} />

        <section className="flex-1">
          {/* Enhanced Hero Section */}
          <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-8 backdrop-blur-xl shadow-xl mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-200/20 to-cyan-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 px-4 py-2 text-sm font-medium text-indigo-700">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  Enhanced Sidebar Design Demo
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full border text-sm font-medium text-gray-600 bg-gray-100 border-gray-200">
                    Silver Tier
                  </div>
                  <div className="px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium">
                    Level 2
                  </div>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold leading-tight text-gray-900 mb-3">
                Enhanced Left Sidebar <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Design</span>! ✨
              </h1>
              <p className="text-lg text-gray-600 mb-6">Experience the new modern, feature-rich sidebar with user profile, progress tracking, notifications, and beautiful glassmorphism design.</p>
              
              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: <User className="h-6 w-6" />,
                    title: "User Profile Section",
                    description: "Dynamic user info with tier, XP, and level progress tracking.",
                    color: "from-indigo-500 to-purple-500"
                  },
                  {
                    icon: <Target className="h-6 w-6" />,
                    title: "Progress Indicators", 
                    description: "Visual progress bars for courses and daily goals completion.",
                    color: "from-emerald-500 to-teal-500"
                  },
                  {
                    icon: <Bell className="h-6 w-6" />,
                    title: "Smart Notifications",
                    description: "Badge notifications, streak indicators, and beta feature badges.",
                    color: "from-amber-500 to-orange-500"
                  },
                  {
                    icon: <Sparkles className="h-6 w-6" />,
                    title: "Modern Glassmorphism",
                    description: "Beautiful backdrop blur effects with gradient backgrounds.",
                    color: "from-blue-500 to-cyan-500"
                  },
                  {
                    icon: <Zap className="h-6 w-6" />,
                    title: "Smooth Animations",
                    description: "Fluid transitions, hover effects, and collapsible design.",
                    color: "from-purple-500 to-pink-500"
                  },
                  {
                    icon: <Users className="h-6 w-6" />,
                    title: "Enhanced Mobile",
                    description: "Responsive mobile sidebar with improved touch interactions.",
                    color: "from-green-500 to-emerald-500"
                  }
                ].map((feature, i) => (
                  <div key={i} className="group rounded-xl border border-white/60 bg-white/60 p-6 backdrop-blur transition-all hover:bg-white/80 hover:shadow-lg">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${feature.color} text-white shadow-lg mb-4`}>
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Desktop Sidebar Features */}
            <div className="rounded-2xl border border-white/60 bg-white/60 p-6 backdrop-blur">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Desktop Sidebar Features</h2>
              <div className="space-y-4">
                {[
                  "👤 User profile with avatar, tier, and XP display",
                  "📊 Real-time progress tracking with animated bars",
                  "🔔 Smart notification badges and streak indicators", 
                  "📁 Organized navigation with Main, Explore, and Account sections",
                  "🎯 Daily goals widget with completion status",
                  "✨ Collapsible design with smooth width transitions",
                  "🎨 Modern glassmorphism with gradient backgrounds",
                  "🔧 Account management with profile and settings access"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <p className="text-sm text-gray-700">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Sidebar Features */}
            <div className="rounded-2xl border border-white/60 bg-white/60 p-6 backdrop-blur">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Mobile Sidebar Features</h2>
              <div className="space-y-4">
                {[
                  "📱 Full-screen overlay with backdrop blur",
                  "🎨 Enhanced visual design matching desktop",
                  "👆 Improved touch interactions and gestures",
                  "📊 Complete feature parity with desktop version",
                  "🚀 Smooth slide-in animations",
                  "📍 Visual active state indicators",
                  "🎯 Quick goals access on mobile devices",
                  "⚡ Fast navigation with instant close on selection"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                    <p className="text-sm text-gray-700">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Design System Info */}
          <div className="mt-8 rounded-2xl border border-white/60 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 p-8 backdrop-blur">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Design System Integration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Visual Design</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Consistent with existing Jarvis design language</li>
                  <li>• Tailwind CSS for maintainable styling</li>
                  <li>• Responsive breakpoints and mobile-first approach</li>
                  <li>• Accessible color contrasts and focus states</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Technical Implementation</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• TypeScript interfaces for type safety</li>
                  <li>• Reusable component architecture</li>
                  <li>• Performance-optimized animations</li>
                  <li>• Proper ARIA labels and accessibility</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
