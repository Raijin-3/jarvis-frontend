import { redirect } from "next/navigation"
import { supabaseServer } from "@/lib/supabase-server"
import { apiGet } from "@/lib/api"
import { CourseAssignmentManagementClient } from "./course-assignment-client"

export const metadata = { title: "Course Assignments | Admin Dashboard" }

export default async function CourseAssignmentPage() {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect("/login")

  // Get profile and ensure admin role
  const profile = await apiGet<any>("/v1/profile").catch(() => null)
  if ((profile?.role ?? "").toLowerCase() !== "admin") redirect("/dashboard")

  return <CourseAssignmentManagementClient />
}