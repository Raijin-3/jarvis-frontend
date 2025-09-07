import { supabaseServer } from "@/lib/supabase-server"
import { apiGet } from "@/lib/api"
import { UnifiedHeader } from "./unified-header"

export async function HeaderProvider() {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()

  let userProfile = null
  if (user) {
    try {
      userProfile = await apiGet<any>("/v1/profile")
    } catch {
      // Profile fetch failed, continue without profile data
    }
  }

  return <UnifiedHeader user={user} userProfile={userProfile} />
}