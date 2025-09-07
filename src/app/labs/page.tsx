import { BookOpen, Code, Database, FileSpreadsheet, Brain, ChevronRight, Play, Users, Clock, Star, TrendingUp, FlaskConical } from "lucide-react"
import Link from "next/link"
import { Sidebar } from "@/app/dashboard/sidebar"
import { MobileSidebar } from "@/app/dashboard/mobile-sidebar"

export const metadata = { title: "Labs | Jarvis" }

export default function LabsPage() {
  const labs = [
    {
      id: "sql",
      title: "SQL Lab",
      description: "Interactive database queries and data manipulation exercises",
      icon: <Database className="h-8 w-8" />,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-500/10 to-blue-600/5",
      href: "/labs/sql",
      difficulty: "Beginner to Advanced",
      exercises: 45,
      timeEstimate: "2-4 hours",
      tags: ["Databases", "Queries", "Data Analysis"],
      status: "Coming Soon",
      progress: 0
    },
    {
      id: "python",
      title: "Python Lab",
      description: "Jupyter-style notebooks for data science and analysis practice",
      icon: <Code className="h-8 w-8" />,
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-500/10 to-emerald-600/5",
      href: "/labs/python",
      difficulty: "Beginner to Expert",
      exercises: 60,
      timeEstimate: "3-5 hours",
      tags: ["Data Science", "Analytics", "Machine Learning"],
      status: "Coming Soon",
      progress: 0
    },
    {
      id: "excel",
      title: "Excel Lab",
      description: "Advanced spreadsheet techniques and business intelligence tools",
      icon: <FileSpreadsheet className="h-8 w-8" />,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-500/10 to-purple-600/5",
      href: "/labs/excel",
      difficulty: "Intermediate",
      exercises: 35,
      timeEstimate: "1-3 hours",
      tags: ["Business Analytics", "Pivot Tables", "Formulas"],
      status: "Coming Soon",
      progress: 0
    }
  ]

  const upcomingLabs = [
    {
      title: "R Studio Lab",
      description: "Statistical computing and data visualization",
      icon: <TrendingUp className="h-6 w-6" />,
      eta: "Q2 2025"
    },
    {
      title: "Tableau Lab",
      description: "Interactive dashboard creation and design",
      icon: <Brain className="h-6 w-6" />,
      eta: "Q2 2025"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <MobileSidebar active="/labs" />
      <div className="lg:flex lg:gap-6 max-w-screen-2xl mx-auto p-4 md:p-6">
        <Sidebar active="/labs" />
        <section className="flex-1">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-8 md:p-12 backdrop-blur-xl shadow-xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-200/20 to-cyan-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <FlaskConical className="h-6 w-6" />
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-100/80 to-indigo-100/80 border border-purple-200/50 px-3 py-1 text-sm font-medium text-purple-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                Beta Feature
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900 mb-4">
              Practice <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Labs</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-2xl">
              Hands-on environments to practice SQL, Python, Excel, and more. Build real-world analytics skills with interactive exercises and projects.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="text-center p-4 rounded-xl bg-white/60 border border-white/60">
                <div className="text-2xl font-bold text-indigo-600">140+</div>
                <div className="text-sm text-gray-600">Total Exercises</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/60 border border-white/60">
                <div className="text-2xl font-bold text-emerald-600">3</div>
                <div className="text-sm text-gray-600">Lab Environments</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/60 border border-white/60">
                <div className="text-2xl font-bold text-purple-600">6-12h</div>
                <div className="text-sm text-gray-600">Practice Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Labs Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Play className="h-6 w-6 text-indigo-500" />
            Available Labs
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {labs.map((lab) => (
              <Link key={lab.id} href={lab.href}>
                <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                  <div className={`absolute inset-0 bg-gradient-to-br ${lab.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  <div className="relative z-10">
                    {/* Lab Icon & Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${lab.gradient} text-white shadow-lg`}>
                        {lab.icon}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2 py-1 text-xs font-medium text-amber-700">
                          <Clock className="h-3 w-3" />
                          {lab.status}
                        </span>
                        {lab.progress > 0 && (
                          <div className="mt-1 text-xs text-gray-500">{lab.progress}% Complete</div>
                        )}
                      </div>
                    </div>

                    {/* Lab Info */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors">
                      {lab.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      {lab.description}
                    </p>

                    {/* Lab Metadata */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Difficulty:</span>
                        <span className="font-medium text-gray-700">{lab.difficulty}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Exercises:</span>
                        <span className="font-medium text-gray-700">{lab.exercises}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Time:</span>
                        <span className="font-medium text-gray-700">{lab.timeEstimate}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {lab.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-full bg-gray-100/80 px-2 py-1 text-xs font-medium text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200/60">
                      <span className="text-sm font-medium text-gray-600">
                        Start Practicing
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Labs */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-indigo-500" />
            Coming Soon
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingLabs.map((lab, idx) => (
              <div key={idx} className="rounded-xl border border-white/60 bg-white/40 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100/80 text-gray-600">
                    {lab.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{lab.title}</h3>
                    <p className="text-sm text-gray-600">{lab.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-gray-500">ETA</span>
                    <div className="text-sm font-semibold text-gray-700">{lab.eta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help & Tips Section */}
        <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white flex-shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started with Labs</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Each lab provides hands-on practice with real-world datasets and scenarios</p>
                <p>• Follow the curriculum modules first to understand the concepts</p>
                <p>• Save your work locally and take notes for future reference</p>
                <p>• Join our community discussions to share solutions and get help</p>
              </div>
              <div className="mt-4">
                <Link href="/curriculum" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                  View Curriculum
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
        </section>
      </div>
    </div>
  )
}
