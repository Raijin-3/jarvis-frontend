"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Comment = {
  id: string;
  author: string;
  text: string;
  replies?: Comment[];
};

export function CourseTabs({
  courseHrefBase,
  sectionId,
  sectionTitle,
  section,
}: {
  courseHrefBase: string;
  sectionId?: string;
  sectionTitle?: string;
  section?: any;
}) {
  const [active, setActive] = useState<"lecture" | "exercise" | "quiz" | "qa">("lecture");

  // Demo in-memory comments
  const [threads, setThreads] = useState<Comment[]>([
    {
      id: "c1",
      author: "Learner A",
      text: "I didn't fully understand the difference between DDL and DML — any tips?",
      replies: [
        { id: "r1", author: "Mentor", text: "Think of DDL as structure (CREATE/ALTER), DML as data (INSERT/UPDATE)." },
      ],
    },
    {
      id: "c2",
      author: "Learner B",
      text: "Is there a shortcut to run all queries at once in the editor?",
      replies: [],
    },
  ]);

  const base = courseHrefBase.replace(/\/$/, "");
  const lectureHref = sectionId ? `${base}/${sectionId}/lecture` : undefined;
  const exerciseHref = sectionId ? `${base}/${sectionId}/exercise` : undefined;
  const quizHref = sectionId ? `${base}/${sectionId}/quiz` : undefined;

  function addComment(text: string) {
    const t = text.trim();
    if (!t) return;
    setThreads((prev) => [{ id: crypto.randomUUID(), author: "You", text: t, replies: [] }, ...prev]);
  }

  function addReply(commentId: string, text: string) {
    const t = text.trim();
    if (!t) return;
    setThreads((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, replies: [...(c.replies || []), { id: crypto.randomUUID(), author: "You", text: t }] }
          : c
      )
    );
  }

  return (
    <div className="mt-3">
      {/* Tabs header */}
      <div className="flex flex-wrap gap-2 text-sm">
        {[
          { key: "lecture", label: "Lecture" },
          { key: "exercise", label: "Practice Exercise" },
          { key: "quiz", label: "Quiz" },
          { key: "qa", label: "Question & Answers" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key as any)}
            className={`rounded-md border px-3 py-2 transition ${
              active === t.key ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tabs content */}
      <div className="mt-3 rounded-md border border-white/10 bg-white/5 p-3 text-xs text-white/80">
        {active === "lecture" && (
          <div>
            <div className="text-white text-sm font-medium">Lecture</div>
            <p className="mt-1">The main video above corresponds to{sectionTitle ? ` “${sectionTitle}”` : ' the current section'}.</p>
            {/* Optional text/document content inline */}
            {typeof section?.lecture?.content === 'string' && section.lecture.content.trim() && (
              <div className="mt-3 rounded bg-white/10 p-3 text-xs whitespace-pre-wrap">
                {section.lecture.content.length > 500
                  ? section.lecture.content.slice(0, 500) + '...'
                  : section.lecture.content}
              </div>
            )}
          </div>
        )}

        {active === "exercise" && (
          <div>
            <div className="text-white text-sm font-medium">Practice Exercise</div>
            <p className="mt-1">Solve the prompt and run your solution.</p>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded border border-white/10 bg-white/10 p-3">
                <div className="text-white/90 text-xs font-semibold">Prompt</div>
                <div className="mt-1">
                  {Array.isArray(section?.exercises) && section.exercises.length
                    ? section.exercises[0].title
                    : 'No exercise configured for this section.'}
                </div>
              </div>
              <div className="rounded border border-white/10 bg-white/10 p-0 overflow-hidden">
                <div className="px-3 py-2 border-b border-white/10 text-white/80 text-xs">Editor</div>
                <textarea className="w-full h-40 p-3 font-mono text-xs bg-transparent outline-none" defaultValue={`-- Write your solution here\n`} />
                <div className="px-2 py-2 border-t border-white/10 flex justify-end gap-2">
                  <button className="rounded border border-white/10 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20">Run</button>
                  <button className="rounded border border-white/10 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20">Submit</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {active === "quiz" && (
          <div>
            <div className="text-white text-sm font-medium">Quiz</div>
            <p className="mt-1">Assess your understanding with a quick check.</p>
            <div className="mt-2 space-y-2">
              {Array.isArray(section?.quizzes) && section.quizzes.length ? (
                <div className="rounded border border-white/10 bg-white/10 p-3">
                  <div className="text-white/90 text-xs font-semibold">{section.quizzes[0].title || 'Quiz'}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <button className="rounded border border-white/10 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20">Start</button>
                    <span className="opacity-70 text-xs">{section.quizzes[0].questions ? `${section.quizzes[0].questions} questions` : ''}</span>
                  </div>
                </div>
              ) : (
                <div className="opacity-70">No quiz configured for this section.</div>
              )}
            </div>
          </div>
        )}

        {active === "qa" && (
          <div>
            <div className="text-white text-sm font-medium">Question & Answers</div>
            <QnA threads={threads} onAdd={addComment} onReply={addReply} />
          </div>
        )}
      </div>
    </div>
  );
}

function QnA({
  threads,
  onAdd,
  onReply,
}: {
  threads: Comment[];
  onAdd: (text: string) => void;
  onReply: (id: string, text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div>
      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask a question or share a tip"
          className="flex-1 rounded border border-white/10 bg-white/10 px-3 py-2 text-white placeholder-white/60 outline-none"
        />
        <button
          onClick={() => {
            onAdd(text);
            setText("");
          }}
          className="rounded border border-white/10 bg-white/10 px-3 py-2 text-white hover:bg-white/20"
        >
          Post
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {threads.map((c) => (
          <Thread key={c.id} c={c} onReply={(t) => onReply(c.id, t)} />
        ))}
        {threads.length === 0 && <div className="opacity-70">Be the first to start a discussion.</div>}
      </div>
    </div>
  );
}

function Thread({ c, onReply }: { c: Comment; onReply: (text: string) => void }) {
  const [reply, setReply] = useState("");
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-2">
      <div className="text-white/90 text-xs font-medium">{c.author}</div>
      <div className="mt-1 whitespace-pre-wrap">{c.text}</div>
      <div className="mt-2 flex gap-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write a reply"
          className="flex-1 rounded border border-white/10 bg-white/10 px-2 py-1 text-white placeholder-white/60 outline-none text-xs"
        />
        <button
          onClick={() => {
            onReply(reply);
            setReply("");
          }}
          className="rounded border border-white/10 bg-white/10 px-2 py-1 text-white hover:bg-white/20 text-xs"
        >
          Reply
        </button>
      </div>
      {(c.replies || []).length > 0 && (
        <div className="mt-2 pl-3 border-l border-white/10 space-y-2">
          {(c.replies || []).map((r) => (
            <div key={r.id} className="text-xs">
              <div className="text-white/80 font-medium">{r.author}</div>
              <div className="opacity-90 whitespace-pre-wrap">{r.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
