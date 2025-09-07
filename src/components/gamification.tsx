"use client";

import { Flame, Star, Award } from "lucide-react";

export function GamificationStrip({
  xp = 0,
  streakWeeks = 0,
  onStart,
}: {
  xp?: number;
  streakWeeks?: number;
  onStart?: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-white/70 p-4 md:p-6 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Start a new streak</h2>
          <p className="text-sm text-muted-foreground">A little learning every day builds momentum.</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">{streakWeeks} weeks</div>
              <div className="text-xs text-muted-foreground">Current streak</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">{xp} XP</div>
              <div className="text-xs text-muted-foreground">Total points</div>
            </div>
          </div>
          {onStart && (
            <button
              onClick={onStart}
              className="rounded-md bg-[hsl(var(--brand))] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Continue learning
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AchievementsRow({ badges = [] as { label: string; hint?: string }[] }) {
  if (!badges.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {badges.map((b, i) => (
        <span
          key={i}
          title={b.hint || b.label}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-white/70 px-2 py-1 text-xs"
        >
          <Award className="h-3.5 w-3.5 text-purple-600" />
          <span className="font-medium text-foreground">{b.label}</span>
        </span>
      ))}
    </div>
  );
}

export function ProgressMini({ value = 0 }: { value?: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-black/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-accent))]"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

