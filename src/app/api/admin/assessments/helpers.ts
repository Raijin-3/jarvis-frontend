import { supabaseServer } from '@/lib/supabase-server'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function buildAuthHeaders(extra: Record<string, string> = {}) {
  const supabase = supabaseServer()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('Not authenticated')
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    ...extra,
  }
}
