"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";

type Question =
  | { id: string; type: "mcq"; prompt: string; options: string[] }
  | { id: string; type: "text"; prompt: string };

type StartPayload = { assessment_id: string; questions: Question[] };

export function AssessmentRunner() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StartPayload | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [submitting, setSubmitting] = useState(false);

  // If this page was opened with ?first=1, clear the one-time redirect cookie
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search.includes('first=1')) {
        document.cookie = "first_assessment_redirect=; path=/; max-age=0";
      }
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/assessment/start", { method: "POST" });
        const text = await res.text();
        const json: StartPayload | null = text ? JSON.parse(text) : null;
        if (!res.ok || !json) throw new Error(text || "No data");
        setData(json);
      } catch (e: any) {
        toast.error(e?.message || "Failed to start assessment");
        router.replace("/dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // timer per question
  useEffect(() => {
    if (loading || !data) return;
    setSecondsLeft(60);
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          handleNext();
          return 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, loading, data?.assessment_id]);

  const current = useMemo(() => data?.questions[idx], [data, idx]);
  const progressPct = useMemo(() => {
    if (!data) return 0;
    return Math.round((idx / data.questions.length) * 100);
  }, [data, idx]);

  const setAnswer = (qid: string, val: string | null) => {
    setAnswers((a) => ({ ...a, [qid]: val }));
  };

  const handleNext = () => {
    if (!data) return;
    if (idx + 1 < data.questions.length) setIdx(idx + 1);
    else void finish();
  };

  const handleSkip = () => {
    if (!data) return;
    const q = data.questions[idx];
    setAnswer(q.id, null);
    handleNext();
  };

  // keyboard shortcuts: Right/Enter -> next, Esc -> skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (submitting) return;
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submitting]);

  const finish = async () => {
    if (!data) return;
    setSubmitting(true);
    try {
      const responses = data.questions.map((q, i) => ({ q_index: i, question_id: q.id, answer: answers[q.id] ?? null }));
      const res = await fetch("/api/assessment/finish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assessment_id: data.assessment_id, responses }) });
      const text = await res.text();
      const summary = text ? JSON.parse(text) : null;
      if (!res.ok || !summary) throw new Error(text || "No response");
      toast.success(`Completed: ${summary.correct}/${summary.total} (${summary.score}%)`);
      
      // Check if this is first assessment by looking for ?first=1 in URL
      const isFirstAssessment = window.location.search.includes('first=1');
      if (isFirstAssessment) {
        router.replace("/learning-path?first=1");
      } else {
        router.replace("/dashboard");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data || !current) {
    return (
      <div className="mx-auto max-w-xl p-4 md:p-6">
        <div className="rounded-xl border border-border bg-white/70 p-6 backdrop-blur">Loading assessment...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-[radial-gradient(900px_450px_at_120%_-10%,rgba(99,102,241,.18),transparent),radial-gradient(700px_350px_at_-20%_120%,rgba(16,185,129,.14),transparent)]">
      <div className="mx-auto max-w-3xl p-4 md:max-w-5xl md:p-6">
        <div className="rounded-xl border border-border bg-white/75 p-4 shadow-sm backdrop-blur md:p-6">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between text-sm">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 items-center rounded-full border border-border bg-white/70 px-2 font-medium">Q{idx + 1} / {data.questions.length}</span>
              <div className="hidden items-center gap-2 sm:inline-flex">
                <span className="text-muted-foreground">Progress</span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-[hsl(var(--brand))]" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2">
              <div aria-label="time left" className="rounded-md border border-border px-2 py-0.5 text-xs font-medium">{secondsLeft}s</div>
              <Button variant="ghost" size="sm" onClick={handleSkip} disabled={submitting}>Skip</Button>
            </div>
          </div>

          {/* Time progress */}
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))]" style={{ width: `${((60 - secondsLeft) / 60) * 100}%` }} />
          </div>

          {/* Prompt */}
          <h2 className="text-base font-semibold sm:text-lg">{current.prompt}</h2>
          <p className="mt-1 text-xs text-muted-foreground">Answer within 60 seconds. Skip if unsure — no guessing.</p>

          {/* Body */}
          <div className="mt-4">
            {current.type === "mcq" ? (
              <div className="grid gap-2">
                {[...((current as any).options as string[]), "Don't Know"].map((opt: string, i: number) => {
                  const selected = (answers[current.id] ?? null) === String(i);
                  return (
                    <label
                      key={i}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-black/5 ${selected ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand))]/10" : "border-border"}`}
                    >
                      <input
                        type="radio"
                        name={current.id}
                        value={String(i)}
                        checked={selected}
                        onChange={(e) => setAnswer(current.id, e.target.value)}
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-2">
                <input
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2"
                  placeholder="Type your answer"
                  value={(answers[current.id] as string) ?? ""}
                  onChange={(e) => setAnswer(current.id, e.target.value)}
                />
                <div>
                  <Button variant="outline" size="sm" onClick={() => setAnswer(current.id, "")}>Don't Know</Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions (desktop/tablet) */}
          <div className="mt-5 hidden items-center justify-between md:flex">
            <div className="text-xs text-muted-foreground">Press Right Arrow for Next, Esc to Skip</div>
            {idx + 1 < data.questions.length ? (
              <Button onClick={handleNext} disabled={submitting}>Next</Button>
            ) : (
              <Button onClick={finish} disabled={submitting}>Finish</Button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/90 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2">
          <Button variant="ghost" onClick={handleSkip} disabled={submitting}>Skip</Button>
          {idx + 1 < data.questions.length ? (
            <Button className="min-w-28" onClick={handleNext} disabled={submitting}>Next</Button>
          ) : (
            <Button className="min-w-28" onClick={finish} disabled={submitting}>Finish</Button>
          )}
        </div>
      </div>
    </div>
  );
}
