import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { apiGet } from "@/lib/api";
import { AssessmentRunner } from "../runner";
import { Sidebar } from "../../dashboard/sidebar";
import { MobileSidebar } from "../../dashboard/mobile-sidebar";

export const metadata = { title: "Assessment - Jarvis" };


type StartSearchParams = Record<string, string | string[] | undefined>;
type SearchParamsInput = StartSearchParams | Promise<StartSearchParams> | undefined;

export default async function AssessmentStartPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  // Next.js 15 delivers searchParams as a Promise; support both sync/async forms.
  const resolvedSearchParams: StartSearchParams =
    (searchParams ? await Promise.resolve(searchParams) : undefined) ?? {};
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  let selectedSubjectIds: string[] = [];
  try {
    const selection = await apiGet<{ selected_subjects?: string[] | null }>("/v1/subject-selection/selected");
    selectedSubjectIds = Array.isArray(selection?.selected_subjects)
      ? selection.selected_subjects.filter((value) => typeof value === "string" && value.trim().length > 0)
      : [];
  } catch {
    selectedSubjectIds = [];
  }

  if (selectedSubjectIds.length === 0) {
    try {
      const available = await apiGet<{ subjects?: unknown[] }>("/v1/subject-selection/available");
      const subjectsList = Array.isArray(available?.subjects) ? available.subjects : [];
      if (subjectsList.length > 0) {
        redirect("/subjects");
      }
    } catch {
      // Ignore errors and allow assessment to continue
    }
  }

  // Determine if we should hide navigation for first-time assessment
  let hideNav = false;
  const firstParam = (() => {
    const v = resolvedSearchParams.first;
    const s = Array.isArray(v) ? v[0] : v;
    return s === "1" || (s ?? "").toLowerCase() === "true";
  })();
  if (firstParam) hideNav = true;
  else {
    try {
      const res = await apiGet<any>("/v1/assessments/latest");
      const latest = res?.latest ?? null;
      // Hide nav if no completed assessment yet
      hideNav = !latest || !latest.completed_at;
    } catch {
      // If API fails, default to showing nav to avoid trapping users
      hideNav = false;
    }
  }

  if (hideNav) {
    // Full-focus assessment experience (no sidebar) for first-time users
    return <AssessmentRunner />;
  }

  // Regular experience with sidebar for returning users
  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6">
      <MobileSidebar active="/assessment" />
      <div className="lg:flex lg:gap-4">
        <Sidebar active="/assessment" />
        <section className="flex-1">
          <AssessmentRunner />
        </section>
      </div>
    </div>
  );
}
