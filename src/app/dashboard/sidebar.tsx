"use client"

import { useEffect, useState } from "react"
import { 
  LayoutDashboard, 
  BookOpen, 
  FileCheck2, 
  Calendar, 
  Brain, 
  BriefcaseBusiness, 
  Eye, 
  EyeOff,
  User,
  Settings,
  Bell,
  Award,
  TrendingUp,
  Zap,
  Star,
  LogOut,
  ChevronRight,
  Sparkles,
  Target,
  FlaskConical
} from "lucide-react"

interface SidebarProps {
  active?: string
  user?: {
    name: string
    email: string
    avatar?: string
    tier?: string
    xp?: number
    level?: number
    role?: string
  }
}

export function Sidebar({ active = "/dashboard", user }: SidebarProps) {
  const [open, setOpen] = useState(true)
  
  const mainItems = [
    { 
      href: "/dashboard", 
      label: "Dashboard", 
      icon: <LayoutDashboard className="h-4 w-4" />,
      description: "Overview & stats",
      progress: 100
    },
    { 
      href: "/curriculum", 
      label: "My Courses", 
      icon: <BookOpen className="h-4 w-4" />,
      description: "Learning paths",
      progress: 78,
      badge: "3 Active"
    },
    { 
      href: "/assessment", 
      label: "Assessments", 
      icon: <FileCheck2 className="h-4 w-4" />,
      description: "Tests & quizzes",
      progress: 65,
      notification: 2
    },
    { 
      href: "/schedule", 
      label: "Schedule", 
      icon: <Calendar className="h-4 w-4" />,
      description: "Classes & events",
      progress: 90
    },
    { 
      href: "/logical-reasoning", 
      label: "Daily Challenge", 
      icon: <Brain className="h-4 w-4" />,
      description: "Brain teasers",
      progress: 42,
      streak: true
    },
  ]

  const secondaryItems = [
    { 
      href: "/labs", 
      label: "Labs", 
      icon: <FlaskConical className="h-4 w-4" />,
      description: "Practice environments",
      beta: true
    },
    { 
      href: "/jobs", 
      label: "AI Jobs", 
      icon: <BriefcaseBusiness className="h-4 w-4" />,
      description: "Career opportunities",
      beta: true,
      notification: 12
    },
  ]

  // Create userMenuItems based on role
  const getUserMenuItems = (userRole?: string) => {
    const items = [
      { href: "/profile", label: "Profile", icon: <User className="h-4 w-4" /> },
    ];
    
    // Only show Learning Path for non-admin users (students and teachers)
    if (userRole !== "admin") {
      items.push({ href: "/learning-path", label: "Learning Path", icon: <Target className="h-4 w-4" /> });
    }
    
    items.push({ href: "/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> });
    
    return items;
  };

  const defaultUser = {
    name: "Learner",
    email: "learner@example.com",
    tier: "Silver",
    xp: 1540,
    level: 2,
    role: "student",
    ...(user || {})
  }

  const [summary, setSummary] = useState(defaultUser)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/user/summary', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (!data) return
        const xp = typeof data.xp === 'number' ? data.xp : summary.xp
        const level = typeof data.level === 'number' ? data.level : Math.floor(xp / 1000) + 1
        const tier = typeof data.tier === 'string' ? data.tier : summary.tier
        const name = typeof data.name === 'string' && data.name.trim() ? data.name : summary.name
        const role = typeof data.role === 'string' ? data.role : summary.role
        const next = { ...summary, xp, level, tier, name, role }
        if (!cancelled) setSummary(next)
      } catch {}
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <aside className={`hidden lg:block transition-[width] duration-300 ease-in-out ${open ? 'w-72' : 'w-28'}`}>
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className={`relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-b from-white/80 to-white/60 ${open ? 'p-4' : 'p-2'} backdrop-blur-xl shadow-2xl`}>
          {/* Background gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-emerald-50/30"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            {/* Toggle Button */}
            <div className={`flex items-center ${open ? 'justify-between mb-6' : 'justify-center mb-2'}`}>
              <div className={`${open ? 'opacity-100' : 'hidden'} transition-opacity duration-300`}>
                <h2 className="text-sm font-semibold text-gray-900">Navigation</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                className="group relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/40 bg-white/60 text-gray-600 backdrop-blur-sm transition-all hover:bg-white/80 hover:shadow-lg"
                aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {open ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* User Profile Section */}
            <div className={`mb-6 transition-all duration-300`}>
              <div className={`relative overflow-hidden rounded-xl border border-white/40 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 ${open ? 'p-4' : 'p-2'} backdrop-blur`}>
                <div className={`flex items-center ${open ? 'gap-3' : 'justify-center'}`}>
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm">
                      {summary.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 border-2 border-white flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                    </div>
                  </div>
                  <div className={`${open ? 'flex-1 min-w-0' : 'hidden'}`}>
                    <p className="font-semibold text-gray-900 text-sm truncate">{summary.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        <span className="text-xs font-medium text-amber-600">{summary.tier}</span>
                      </div>
                      <span className="text-xs text-gray-500">•</span>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-indigo-500" />
                        <span className="text-xs font-medium text-indigo-600">{summary.xp} XP</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Level Progress */}
                <div className={`${open ? 'mt-3' : 'hidden'}`}>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Level {summary.level}</span>
                    <span>{Math.round(((summary.xp % 1000) / 1000) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200/60 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${((summary.xp % 1000) / 1000) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Navigation */}
            <nav className="space-y-1 mb-6">
              <div className={`${open ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 mb-3`}>
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Main</h3>
              </div>
              {mainItems.map((item) => {
                const isActive = active === item.href
                return (
                  <div key={item.href} className="relative">
                    <a
                      href={item.href}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/15 text-indigo-700 shadow-lg' 
                          : 'text-gray-700 hover:bg-white/60 hover:shadow-md'
                      }`}
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                          : 'bg-gray-100/80 text-gray-600 group-hover:bg-white group-hover:shadow-md'
                      }`}>
                        {item.icon}
                        {item.streak && (
                          <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
                        )}
                      </div>
                      
                      <div className={`flex-1 min-w-0 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-all duration-300`}>
                        <div className="flex items-center justify-between">
                          <span className="truncate">{item.label}</span>
                          <div className="flex items-center gap-1">
                            {item.notification && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {item.notification}
                              </span>
                            )}
                            {item.badge && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                {item.badge}
                              </span>
                            )}
                            {isActive && <ChevronRight className="h-3 w-3" />}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
                        
                        {/* Progress bar for courses */}
                        {item.progress !== undefined && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{item.progress}%</span>
                            </div>
                            <div className="h-1 rounded-full bg-gray-200/60 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </a>
                  </div>
                )
              })}
            </nav>

            {/* Secondary Navigation */}
            <nav className="space-y-1 mb-6">
              <div className={`${open ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 mb-3`}>
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Explore</h3>
              </div>
              {secondaryItems.map((item) => {
                const isActive = active === item.href
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/15 text-indigo-700 shadow-lg' 
                        : 'text-gray-700 hover:bg-white/60 hover:shadow-md'
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                        : 'bg-gray-100/80 text-gray-600 group-hover:bg-white group-hover:shadow-md'
                    }`}>
                      {item.icon}
                    </div>
                    
                    <div className={`flex-1 min-w-0 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-all duration-300`}>
                      <div className="flex items-center justify-between">
                        <span className="truncate">{item.label}</span>
                        <div className="flex items-center gap-1">
                          {item.beta && (
                            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                              <Sparkles className="h-2.5 w-2.5" />
                              Beta
                            </span>
                          )}
                          {item.notification && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                              {item.notification > 9 ? '9+' : item.notification}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{item.description}</p>
                    </div>
                  </a>
                )
              })}
            </nav>

            {/* Quick Stats */}
            <div className={`${open ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-all duration-300 mb-6`}>
              <div className="rounded-xl border border-white/40 bg-gradient-to-r from-emerald-50/50 to-green-50/50 p-3 backdrop-blur">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-semibold text-emerald-900">Today's Goals</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-emerald-700">2/3</div>
                    <div className="text-xs text-emerald-600">Lessons</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-700">45m</div>
                    <div className="text-xs text-emerald-600">Time</div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Menu */}
            <nav className="space-y-1">
              <div className={`${open ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 mb-3`}>
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Account</h3>
              </div>
              {getUserMenuItems(summary.role).map((item) => {
                const isActive = active === item.href
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/15 text-indigo-700' 
                        : 'text-gray-700 hover:bg-white/60'
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                        : 'bg-gray-100/80 text-gray-600 group-hover:bg-white'
                    }`}>
                      {item.icon}
                    </div>
                    <span className={`${open ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-all duration-300`}>
                      {item.label}
                    </span>
                  </a>
                )
              })}
              
              {/* Logout Button */}
              <button
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-red-50/60 hover:text-red-700"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100/80 text-gray-600 transition-all duration-200 group-hover:bg-red-100 group-hover:text-red-600">
                  <LogOut className="h-4 w-4" />
                </div>
                <span className={`${open ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-all duration-300`}>
                  Sign Out
                </span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </aside>
  )
}
