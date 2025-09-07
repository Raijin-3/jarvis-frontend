"use client"

import Link from "next/link"
import { ReactNode } from "react"
import { Trophy, Medal, Star, Coins as CoinsIcon, Clock } from "lucide-react"

export function Card({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={["rounded-xl border border-border bg-white/70 p-4 backdrop-blur", className].filter(Boolean).join(" ")}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-medium">{title}</h3>
      </div>
      {children}
    </section>
  )
}

export function KPI({ label, value, badge = false }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-white/70 p-4 backdrop-blur">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2 text-2xl font-semibold">
        {value}
        {badge && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--brand))]/15 px-2 py-0.5 text-xs text-[hsl(var(--brand))]">
            <Trophy className="h-3.5 w-3.5" /> Tier
          </span>
        )}
      </div>
    </div>
  )
}

export function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-border px-3 py-2 text-sm hover:bg-black/5 focus:outline-none focus:ring-2"
    >
      {label}
    </Link>
  )
}

export function RecoCard({ title, tag }: { title: string; tag: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{tag}</div>
    </div>
  )
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={["h-2 w-full overflow-hidden rounded-full bg-muted", className].filter(Boolean).join(" ")}> 
      <div
        className="h-full rounded-full bg-[hsl(var(--brand))] transition-all"
        style={{ width: `${v}%` }}
      />
    </div>
  )
}

// Charts removed

export function BadgeChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white/70 px-2 py-0.5 text-xs">
      <Medal className="h-3.5 w-3.5 text-amber-600" />
      {label}
    </span>
  )
}

export function BadgesGrid({ badges }: { badges: { name: string }[] }) {
  if (!Array.isArray(badges) || badges.length === 0) {
    return <div className="text-sm text-muted-foreground">No badges yet. Keep learning to unlock achievements!</div>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b, i) => (
        <BadgeChip key={`${b.name}-${i}`} label={b.name} />
      ))}
    </div>
  )
}

export function HistoryList({ items }: { items: { date: string; action: string; xp?: number; coins?: number }[] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <div className="text-sm text-muted-foreground">Your activity will appear here.</div>
  }
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-center justify-between rounded-md border border-border bg-white/60 p-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{it.action}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(it.date).toLocaleDateString()} • +{it.xp ?? 0} XP • +{it.coins ?? 0} coins
          </div>
        </li>
      ))}
    </ul>
  )
}

export function LevelProgress({ level, progressPercent, nextXp }: { level: number; progressPercent: number; nextXp: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Star className="h-4 w-4 text-yellow-500" /> Level {level}
        </div>
        <div className="text-xs text-muted-foreground">{Math.round(progressPercent)}% to next level</div>
      </div>
      <ProgressBar value={progressPercent} />
      <div className="mt-1 text-xs text-muted-foreground">{nextXp} XP to level up</div>
    </div>
  )
}

export function CoinsKPI({ coins }: { coins: number }) {
  return (
    <div className="rounded-xl border border-border bg-white/70 p-4 backdrop-blur">
      <div className="text-xs text-muted-foreground">Coins</div>
      <div className="mt-1 flex items-center gap-2 text-2xl font-semibold">
        <CoinsIcon className="h-5 w-5 text-amber-500" /> {coins.toLocaleString()}
      </div>
    </div>
  )
}

export function LeaderboardKPI({ position }: { position: number }) {
  return (
    <div className="rounded-xl border border-border bg-white/70 p-4 backdrop-blur">
      <div className="text-xs text-muted-foreground">Leaderboard</div>
      <div className="mt-1 flex items-center gap-2 text-2xl font-semibold">
        #{position}
      </div>
    </div>
  )
}
