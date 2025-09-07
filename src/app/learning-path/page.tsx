import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { apiGet } from "@/lib/api";
import { LearningPathContent } from "./learning-path-content";
import { Sidebar } from "../dashboard/sidebar";
import { MobileSidebar } from "../dashboard/mobile-sidebar";

export const metadata = { title: "Learning Path - Jarvis" };

export default async function LearningPathPage({ 
  searchParams 
}: { 
  searchParams?: { [key: string]: string | string[] | undefined } 
}) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  // Check if this is first time (from assessment)
  const isFirstTime = (() => {
    const v = searchParams?.first;
    const s = Array.isArray(v) ? v[0] : v;
    return s === "1" || (s ?? "").toLowerCase() === "true";
  })();

  let profile: any = null;
  try {
    profile = await apiGet<any>("/v1/profile");
  } catch {}

  if (isFirstTime) {
    // Full-focus experience for first-time users (no sidebar)
    return <LearningPathContent isFirstTime={true} profile={profile} />;
  }

  // Regular experience with sidebar for returning users
  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6">
      <MobileSidebar active="/learning-path" />
      <div className="lg:flex lg:gap-4">
        <Sidebar active="/learning-path" />
        <section className="flex-1">
          <LearningPathContent isFirstTime={false} profile={profile} />
        </section>
      </div>
    </div>
  );
}