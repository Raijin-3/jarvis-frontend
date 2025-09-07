import { supabaseServer } from "@/lib/supabase-server"
import { UserNavShell } from "@/components/nav/user-nav-shell"
import Link from "next/link"

export async function AppHeader() {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Learner"
  const avatarUrl = user.user_metadata?.avatar_url || null

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-white/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80" aria-label="Go to dashboard">
          <span className="font-semibold">Jarvis</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">AI Learning</span>
        </Link>
        <UserNavShell name={displayName} email={user.email} imageUrl={avatarUrl} />
      </div>
    </header>
  )
}
