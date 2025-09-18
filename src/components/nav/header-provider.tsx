import { supabaseServer } from "@/lib/supabase-server"
import { apiGet } from "@/lib/api"
import { UnifiedHeader } from "./unified-header"

export async function HeaderProvider() {
  let user = null
  let userProfile = null

  try {
    const sb = supabaseServer()
    const { data: { user: supabaseUser } } = await sb.auth.getUser()
    user = supabaseUser

    if (user) {
      try {
        userProfile = await apiGet<any>("/v1/profile")
      } catch {
        // Profile fetch failed, continue without profile data
      }
    }
  } catch (error) {
    console.error("Error in HeaderProvider:", error)
    // During static generation or when Supabase is unavailable, 
    // continue with null user
  }

  return <UnifiedHeader user={user} userProfile={userProfile} />
}