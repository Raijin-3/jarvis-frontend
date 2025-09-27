import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { SubjectsForm } from "./subjects-form";

export const metadata = { title: "Choose Your Subjects - Jarvis" };

export default async function SubjectsPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/50">
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-8 backdrop-blur-xl shadow-xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1 text-xs">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Select your subjects
            </div>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-gray-900 mb-3">
              Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Subjects</span>
            </h1>
            <p className="text-lg text-gray-600">Select the subjects you want to focus on for your personalized learning journey.</p>
          </div>
        </div>

        <SubjectsForm />
      </div>
    </div>
  );
}