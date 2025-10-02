import { redirect } from "next/navigation"
import { supabaseServer } from "@/lib/supabase-server"
import { apiGet } from "@/lib/api"
import { Sidebar } from "../dashboard/sidebar"
import { MobileSidebar } from "../dashboard/mobile-sidebar"
import Link from "next/link"
import { BookOpen, Clock, Users, Star, Trophy, Play, BarChart3, ChevronRight } from "lucide-react"

type Curriculum = {
  tracks: {
    slug: string
    title: string
    level: string
    description: string
    modules: { slug: string; title: string; items: string[] }[]
  }[]
}

type CourseBasic = {
  id: string
  title: string
  description?: string | null
  status?: string | null
  difficulty?: string | null
  category?: string | null
  enrolled_count?: number | null
  created_at?: string | null
}

export const metadata = { title: "Curriculum | Jarvis" }

export default async function CurriculumPage() {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const data = await apiGet<Curriculum>('/v1/curriculum').catch(() => ({ tracks: [] }))
  const tracks = Array.isArray(data?.tracks) ? data!.tracks : []

  // Load published courses for students
  const { data: coursesRaw } = await sb
    .from('courses')
    .select('id,title,description,status,difficulty,category,enrolled_count,created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  const courses: CourseBasic[] = Array.isArray(coursesRaw) ? coursesRaw : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <MobileSidebar active="/curriculum" />
      <div className="lg:flex lg:gap-6 max-w-screen-2xl mx-auto p-4 md:p-6">
        <Sidebar active="/curriculum" />
        <section className="flex-1">
          {/* Enhanced Hero Section */}
          <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-8 backdrop-blur-xl shadow-xl mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-200/50 px-4 py-2 text-sm font-medium text-blue-700">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  My Learning Path
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span>4 courses in progress</span>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold leading-tight text-gray-900 mb-3">
                Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">Analytics</span> & Data Science
              </h1>
              <p className="text-lg text-gray-600 mb-6">Structured learning paths designed by industry experts to take you from beginner to professional.</p>
              
              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">67%</div>
                      <div className="text-sm text-gray-500">Overall Progress</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Clock className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">42h</div>
                      <div className="text-sm text-gray-500">Time Invested</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Star className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">12</div>
                      <div className="text-sm text-gray-500">Completed Modules</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Tracks */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Tracks</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {tracks.map((t, index) => (
                <div key={t.slug} className="group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg transition-all hover:shadow-2xl hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${index % 2 === 0 ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                          <BookOpen className={`h-6 w-6 ${index % 2 === 0 ? 'text-blue-600' : 'text-emerald-600'}`} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{t.title}</h3>
                          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                            t.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                            t.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {t.level}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                    
                    <p className="text-gray-600 mb-4">{t.description}</p>
                    
                    {/* Modules Preview */}
                    <div className="space-y-3 mb-6">
                      {t.modules.slice(0, 2).map((m, moduleIndex) => (
                        <div key={m.slug} className="rounded-lg bg-white/60 border border-white/60 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs flex items-center justify-center font-medium">
                              {moduleIndex + 1}
                            </div>
                            <span className="font-medium text-gray-900">{m.title}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {m.items.slice(0, 2).join(', ')}{m.items.length > 2 ? ` +${m.items.length - 2} more` : ''}
                          </div>
                        </div>
                      ))}
                      {t.modules.length > 2 && (
                        <div className="text-center py-2">
                          <span className="text-sm text-gray-500">+{t.modules.length - 2} more modules</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    <Link
                      href={`/curriculum/${encodeURIComponent(t.slug)}`}
                      className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all hover:shadow-lg ${
                        index % 2 === 0 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                      }`}
                    >
                      <Play className="h-4 w-4" />
                      Start Learning
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

      {/* Available Courses fallback (if tracks are empty) */}
      {tracks.length === 0 && (
        <>
          <div className="mt-8 relative overflow-hidden rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_100%_-10%,rgba(59,130,246,.12),transparent),radial-gradient(400px_200px_at_-10%_120%,rgba(124,58,237,.10),transparent)]" />
            <div className="relative z-10">
              <h2 className="text-lg font-semibold">Available Courses</h2>
              <p className="mt-1 text-sm text-muted-foreground">Courses published by admins and available to students.</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {courses.map((c) => (
              <article key={c.id} className="rounded-xl border border-border bg-white/70 p-4 backdrop-blur">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{c.title}</h3>
                  <span className="rounded-full border border-border bg-white/70 px-2 py-0.5 text-xs">
                    {c.difficulty || 'beginner'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md border border-border bg-white/70 px-2 py-0.5">{c.category || 'General'}</span>
                    <span>Enrolled: {c.enrolled_count || 0}</span>
                  </div>
                  <span>{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</span>
                </div>
                <div className="mt-3 text-right">
                  <Link href={`/curriculum/${c.id}`} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-black/5">Open course</Link>
                </div>
              </article>
            ))}

            {courses.length === 0 && (
              <div className="rounded-xl border border-border bg-white/70 p-6 text-sm text-muted-foreground">
                No published courses yet.
              </div>
            )}
          </div>
        </>
      )}
        </section>
      </div>
    </div>
  )
}
