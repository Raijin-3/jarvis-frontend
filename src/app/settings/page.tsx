import { redirect } from "next/navigation"
import { supabaseServer } from "@/lib/supabase-server"
import { SettingsContent } from "./settings-content"

export default async function SettingsPage() {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  return <SettingsContent user={user} />
}