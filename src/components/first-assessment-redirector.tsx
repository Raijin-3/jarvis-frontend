"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function FirstAssessmentRedirector({ shouldCheck }: { shouldCheck: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!shouldCheck) return;
    try {
      const suppress = typeof window !== 'undefined' ? sessionStorage.getItem('justCompletedProfile') : null;
      // Clear the one-time suppressor if set, so it only affects immediate redirect after profile save
      if (suppress) sessionStorage.removeItem('justCompletedProfile');

      const hasCookie = typeof document !== 'undefined' && document.cookie.split('; ').some(c => c.startsWith('first_assessment_redirect=1'));
      if (hasCookie && !suppress) {
        router.replace('/assessment/start?first=1');
      }
    } catch {}
  }, [router, shouldCheck]);

  return null;
}

