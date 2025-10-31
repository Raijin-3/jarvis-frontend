import { redirect } from "next/navigation"
import { supabaseServer } from "@/lib/supabase-server"
import { apiGet } from "@/lib/api"
import { EnhancedAssessmentManagement } from "./assessment-management-enhanced"

export const metadata = { title: "Assessment Management | Admin Dashboard" }

export default async function AssessmentManagementPage() {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect("/login")

  const profile = await apiGet<any>("/api/v1/profile").catch(() => null)
  if ((profile?.role ?? "").toLowerCase() !== "admin") redirect("/dashboard")

  return <EnhancedAssessmentManagement />
}
