"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { FormattedText } from "@/components/ui/rich-text-editor";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SUPABASE_ASSESSMENT_BUCKET =
  (process.env.NEXT_PUBLIC_SUPABASE_ASSESSMENT_BUCKET ?? "plc").trim() || "plc";

const normalizeQuestionImageUrl = (raw?: string | null): string | null => {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    // Fix malformed signed URLs missing storage/v1 prefix
    if (trimmed.includes('/object/sign/') && !trimmed.includes('/storage/v1/object/')) {
      return trimmed.replace('/object/sign/', '/storage/v1/object/sign/');
    }
    return trimmed;
  }
  if (!SUPABASE_URL) return trimmed;
  if (trimmed.startsWith("/")) return `${SUPABASE_URL}${trimmed}`;
  const sanitized = trimmed.replace(/^\/+/, "");
  if (sanitized.startsWith("storage/v1/object/")) {
    return `${SUPABASE_URL}/${sanitized}`;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_ASSESSMENT_BUCKET}/${sanitized}`;
};

type BaseQuestion = {
  id: string;
  prompt: string;
  imageUrl: string | null;
  rawType?: string | null;
  timeLimit: number | null;
  moduleId: string | null;
  subjectId: string | null;
};
type Question =
  | (BaseQuestion & { type: "mcq"; options: string[] })
  | (BaseQuestion & { type: "text" });
type StartPayload = { assessment_id: string; questions: Question[]; lockedModules?: string[]; lockedSubjects?: string[] };
export function AssessmentRunner() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StartPayload | null>(null);
  const [queue, setQueue] = useState<number[]>([]);
  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [skippedQuestions, setSkippedQuestions] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const subjectMistakesRef = useRef<Record<string, number>>({});
  const lockedSubjectsRef = useRef<Record<string, boolean>>({});
  // If this page was opened with ?first=1, clear the one-time redirect cookie
  useEffect(() => {
    try {
      if (
        typeof window !== "undefined" &&
        window.location.search.includes("first=1")
      ) {
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
  useEffect(() => {
    if (!data) return;
    const questionOrder = data.questions.map((_, index) => index);
    setQueue(questionOrder);
    setPosition(0);
    setSkippedQuestions({});
    setAnswers({});
    subjectMistakesRef.current = {};
    
    // Initialize locked subjects from backend
    const initialLockedSubjects: Record<string, boolean> = {};
    if (data.lockedSubjects) {
      data.lockedSubjects.forEach(subjectId => {
        initialLockedSubjects[subjectId] = true;
      });
    }
    lockedSubjectsRef.current = initialLockedSubjects;
  }, [data?.assessment_id]);
  const currentQuestionIndex = useMemo(() => (queue.length > 0 ? queue[position] ?? null : null), [queue, position]);
  const current = useMemo(() => {
    if (!data || currentQuestionIndex === null || currentQuestionIndex === undefined) return undefined;
    return data.questions[currentQuestionIndex];
  }, [data, currentQuestionIndex]);
  const imageSrc = useMemo(() => normalizeQuestionImageUrl(current?.imageUrl), [current?.imageUrl]);
  useEffect(() => {
    setImageError(false);
  }, [current?.id, imageSrc]);

  const currentTimeLimit = useMemo(() => {
    if (!current) return 60;
    const limit = current.timeLimit ?? 0;
    return limit > 0 ? limit : 60;
  }, [current]);
  const progressPct = useMemo(() => {
    if (!queue.length) return 0;
    return Math.round((position / queue.length) * 100);
  }, [queue.length, position]);
  const timeProgressPct = useMemo(() => {
    if (currentTimeLimit <= 0) return 0;
    const pct = ((currentTimeLimit - secondsLeft) / currentTimeLimit) * 100;
    if (Number.isNaN(pct)) return 0;
    return Math.min(100, Math.max(0, pct));
  }, [currentTimeLimit, secondsLeft]);
  const totalActiveQuestions = queue.length;
  const currentQuestionNumber = totalActiveQuestions > 0 ? Math.min(position + 1, totalActiveQuestions) : 0;
  
  const finish = useCallback(async () => {
    if (!data) return;
    setSubmitting(true);
    try {
      const responses = data.questions.map((q, i) => ({
        q_index: i,
        question_id: q.id,
        answer: answers[q.id] ?? null,
        skipped: skippedQuestions[q.id] ?? false,
      }));

      const res = await fetch("/api/assessment/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment_id: data.assessment_id, responses }),
      });
      const text = await res.text();
      const summary = text ? JSON.parse(text) : null;
      if (!res.ok || !summary) throw new Error(text || "No response");
      const skippedCount = summary.skipped ?? 0;
      const skippedNote = skippedCount > 0 ? ` | ${skippedCount} skipped` : "";
      toast.success(
        `Completed: ${summary.correct}/${summary.total} (${summary.score}%)${skippedNote}`,
      );

      try {
        await fetch("/api/learning-paths/user/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        console.log("Learning paths refreshed with new assessment data");
      } catch (refreshError) {
        console.warn("Failed to refresh learning paths:", refreshError);
      }

      const isFirstAssessment = typeof window !== "undefined" && window.location.search.includes("first=1");
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
  }, [answers, data, router, skippedQuestions]);

  const handleNext = useCallback(
    async (options?: { skipCurrent?: boolean }) => {
      if (!data || submitting) return;
      const currentIndex = queue[position];
      if (currentIndex === undefined) {
        await finish();
        return;
      }
      const question = data.questions[currentIndex];
      if (!question) {
        await finish();
        return;
      }

      const skipCurrent = options?.skipCurrent ?? Boolean(skippedQuestions[question.id]);
      if (skipCurrent) {
        setSkippedQuestions((prev) => (prev[question.id] ? prev : { ...prev, [question.id]: true }));
        setAnswers((prev) => ({ ...prev, [question.id]: null }));
      }

      let evaluation: { correct: boolean; moduleId: string | null; subjectId: string | null } | null = null;

      if (!skipCurrent) {
        try {
          const res = await fetch('/api/assessment/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question_id: question.id,
              answer: answers[question.id] ?? null,
              skipped: false,
            }),
          });
          const text = await res.text();
          const json = text ? JSON.parse(text) : null;
          if (!res.ok) {
            throw new Error(json?.error || text || 'Failed to evaluate answer');
          }
          evaluation = json;
        } catch (error) {
          console.error('Failed to evaluate assessment response', error);
          evaluation = null;
        }
      }

      let updatedQueue = queue;

      if (evaluation && evaluation.subjectId) {
        const subjectId = evaluation.subjectId;
        const currentMistakes = subjectMistakesRef.current[subjectId] ?? 0;
        const nextMistakes = evaluation.correct ? currentMistakes : currentMistakes + 1;
        subjectMistakesRef.current[subjectId] = nextMistakes;

        if (!evaluation.correct && nextMistakes >= 2 && !lockedSubjectsRef.current[subjectId]) {
          lockedSubjectsRef.current[subjectId] = true;
          const toSkipIndices: number[] = [];
          data.questions.forEach((q, idx) => {
            if (idx > currentIndex && q.subjectId === subjectId) {
              toSkipIndices.push(idx);
            }
          });

          if (toSkipIndices.length) {
            const toSkipSet = new Set(toSkipIndices);
            setSkippedQuestions((prev) => {
              const next = { ...prev };
              toSkipIndices.forEach((idx) => {
                const qId = data.questions[idx].id;
                next[qId] = true;
              });
              return next;
            });
            setAnswers((prev) => {
              const next = { ...prev };
              toSkipIndices.forEach((idx) => {
                const qId = data.questions[idx].id;
                next[qId] = null;
              });
              return next;
            });
            const filteredQueue = queue.filter((idx) => idx <= currentIndex || !toSkipSet.has(idx));
            if (filteredQueue.length !== queue.length) {
              updatedQueue = filteredQueue;
              setQueue(filteredQueue);
            }
          }
        }
      }

      const nextPosition = position + 1;
      if (nextPosition < updatedQueue.length) {
        setPosition(nextPosition);
      } else {
        await finish();
      }
    },
    [answers, data, finish, position, queue, skippedQuestions, submitting],
  );

  // timer per question
  useEffect(() => {
    if (loading || !data) return;
    setSecondsLeft(currentTimeLimit);
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          void handleNext();
          return currentTimeLimit;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, queue, loading, data?.assessment_id, currentTimeLimit, handleNext]);
  
  const setAnswer = (qid: string, val: string | null) => {
    setAnswers((a) => ({ ...a, [qid]: val }));
  };
  // console.log(setAnswer);
  const handleSkip = useCallback(() => {
    if (!data) return;
    const currentIndex = queue[position];
    if (currentIndex === undefined) return;
    const q = data.questions[currentIndex];
    if (!q) return;
    setSkippedQuestions((prev) => (prev[q.id] ? prev : { ...prev, [q.id]: true }));
    setAnswers((prev) => ({ ...prev, [q.id]: null }));
    void handleNext({ skipCurrent: true });
  }, [data, handleNext, position, queue]);
  // keyboard shortcuts: Right/Enter -> next, Esc -> skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (submitting) return;
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        void handleNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNext, handleSkip, submitting]);
  if (!loading && data && data.questions.length === 0) {
    return (
      <div className="mx-auto max-w-xl p-4 md:p-6">
        <div className="rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
          No assessment questions are available at the moment. Please check back
          soon.
        </div>
      </div>
    );
  }
  if (loading || !data || !current) {
    return (
      <div className="mx-auto max-w-xl p-4 md:p-6">
        <div className="rounded-xl border border-border bg-white/70 p-6 backdrop-blur">
          Loading assessment...
        </div>
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
              <span className="inline-flex h-6 items-center rounded-full border border-border bg-white/70 px-2 font-medium">
                Q{currentQuestionNumber} / {totalActiveQuestions || 0}
              </span>
              <div className="hidden items-center gap-2 sm:inline-flex">
                <span className="text-muted-foreground">Progress</span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[hsl(var(--brand))]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-2">
              <div
                aria-label="time left"
                className="rounded-md border border-border px-2 py-0.5 text-xs font-medium"
              >
                {secondsLeft}s
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                disabled={submitting}
              >
                Skip
              </Button>
            </div>
          </div>
          {/* Time progress */}
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))]"
              style={{ width: `${timeProgressPct}%` }}
            />
          </div>
          {/* Prompt */}
          <div className="text-base font-semibold sm:text-lg">
            {current.prompt && current.prompt !== '<p></p>' ? (
              <FormattedText content={current.prompt} />
            ) : (
              current.prompt
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Answer within {currentTimeLimit} seconds. Skip if unsure - no
            guessing.
          </p>
          {/* Question Image */}
          {imageSrc && (
            <figure className="mt-5 rounded-xl border border-dashed border-emerald-200/70 bg-emerald-50/40 p-4">
              <figcaption className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <ImageIcon className="h-4 w-4" />
                Visual Reference
              </figcaption>
              {!imageError ? (
                <>
                  <div className="mt-3 overflow-hidden rounded-lg border border-white/70 bg-white shadow-sm">
                    <img
                      key={imageSrc || current?.id || "question-visual"}
                      src={imageSrc}
                      alt="Question visual"
                      loading="lazy"
                      className="max-h-64 w-full object-contain sm:max-h-72"
                      onLoad={() => setImageError(false)}
                      onError={() => {
                        console.warn("Failed to load question image:", imageSrc);
                        setImageError(true);
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Use this image alongside the prompt to choose the best
                    answer.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  The image could not be loaded. Continue using the prompt
                  information.
                </p>
              )}
            </figure>
          )}
          {/* Body */}
          <div className="mt-4">
            {current.type === "mcq" ? (
              <div className="grid gap-2">
                {[...((current as any).options as string[]), "Don't Know"].map(
                  (opt: string, i: number) => {
                    const selected =
                      (answers[current.id] ?? null) === String(i);
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
                          onChange={(e) =>
                            setAnswer(current.id, e.target.value)
                          }
                        />
                        <span className="text-sm">
                          {opt && opt !== '<p></p>' && typeof opt === 'string' && opt.includes('<') ? (
                            <FormattedText content={opt} className="inline" />
                          ) : (
                            opt
                          )}
                        </span>
                      </label>
                    );
                  },
                )}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAnswer(current.id, "");
                      handleSkip();
                    }}
                  >
                    Don't Know
                  </Button>
                </div>
              </div>
            )}
          </div>
          {/* Footer actions (desktop/tablet) */}
          <div className="mt-5 hidden items-center justify-between md:flex">
            <div className="text-xs text-muted-foreground">
              Press Right Arrow for Next, Esc to Skip
            </div>
            {position + 1 < totalActiveQuestions ? (
              <Button onClick={() => void handleNext()} disabled={submitting}>
                Next
              </Button>
            ) : (
              <Button onClick={finish} disabled={submitting}>
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Sticky mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/90 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2">
          <Button variant="ghost" onClick={handleSkip} disabled={submitting}>
            Skip
          </Button>
          {position + 1 < totalActiveQuestions ? (
            <Button
              className="min-w-28"
              onClick={() => void handleNext()}
              disabled={submitting}
            >
              Next
            </Button>
          ) : (
            <Button className="min-w-28" onClick={finish} disabled={submitting}>
              Finish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
