import { redirect } from "next/navigation"
import { supabaseServer } from "@/lib/supabase-server"
import { apiGet } from "@/lib/api"

export const metadata = { title: "Teacher | Jarvis" }

export default async function TeacherPage() {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect("/login")

  // Ensure onboarding complete and correct role
  const profile = await apiGet<any>("/v1/profile").catch(() => null)
  if (!profile?.onboarding_completed) redirect("/profile")
  if ((profile?.role ?? "").toLowerCase() !== "teacher") redirect("/dashboard")

  const data = await apiGet<any>("/v1/dashboard").catch(() => ({ panels: ["Cohorts", "Assignments", "Progress"], user: { id: user.id, displayName: user.email?.split("@")[0] ?? "Teacher" } }))
  const panels: string[] = Array.isArray(data?.panels) ? data.panels : ["Cohorts", "Assignments", "Progress"]
  const displayName: string = data?.user?.displayName || (user.email?.split("@")[0] ?? "Teacher")

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6">
      <div className="relative overflow-hidden rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_100%_-10%,rgba(99,102,241,.15),transparent),radial-gradient(400px_200px_at_-10%_120%,rgba(16,185,129,.12),transparent)]" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--brand))]" />
            Teacher Dashboard
          </div>
          <h1 className="mt-3 text-2xl font-semibold">Welcome, <span className="bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))] bg-clip-text text-transparent">{displayName}</span></h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage cohorts and assignments</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {panels.map((p) => (
          <div key={p} className="rounded-lg border border-border bg-white/70 p-4">
            <div className="text-sm font-medium">{p}</div>
            <p className="mt-1 text-xs text-muted-foreground">Quick access</p>
          </div>
        ))}
      </div>
    </div>
  )
}

