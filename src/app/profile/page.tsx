import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { apiGet } from "@/lib/api";
import { ProfileForm } from "./profile-form";

type Profile = {
  id: string;
  full_name: string | null;
  year_of_study: number | null;
  qualification: string | null;
  location: string | null;
  current_institute: string | null;
  previous_learning_experiences: string | null;
  reason_for_learning: string | null;
  best_study_time: string | null;
  past_challenges: string | null;
  hobbies_extracurricular: string | null;
  favorites: string | null;
  sports_arts: string | null;
  languages: string | null;
  motivations: string | null;
  role?: string | null;
  education?: string | null;
  graduation_year?: number | null;
  domain?: string | null;
  profession?: string | null;
};

export const metadata = { title: "Edit Profile | Jarvis" };

export default async function ProfilePage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  let initial: Partial<Profile> | null = null;
  try {
    initial = await apiGet<Profile>("/v1/profile");
    console.log(initial);
  } catch {
    // Fallback: try the Next API route which proxies to the backend
    try {
      const res = await fetch(`/api/profile`, { cache: 'no-store' });
      console.log(res);
      if (res.ok) {
        initial = await res.json().catch(() => null);
      }
    } catch {}
  }

  // If user is an admin, route them to the admin dashboard instead of profile setup
  const role = String((initial as any)?.role || '').toLowerCase();
  if (role === 'admin') redirect('/admin');

  console.log(initial);

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="relative overflow-hidden rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_100%_-10%,rgba(99,102,241,.12),transparent),radial-gradient(400px_200px_at_-10%_120%,rgba(16,185,129,.1),transparent)]" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1 text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--brand))]" />
            Complete your profile
          </div>
          <h1 className="mt-3 text-2xl font-semibold">Tell us about you</h1>
          <p className="mt-1 text-sm text-muted-foreground">This helps the AI coach personalize modules, projects, and recommendations.</p>
        </div>
      </div>

      <ProfileForm initial={initial ? {
        ...initial,
        domain: initial.domain ?? undefined,
        education: initial.education ?? undefined,
        profession: initial.profession ?? undefined,
        graduation_year: initial.graduation_year ?? undefined
      } : {}} />
    </div>
  );
}
