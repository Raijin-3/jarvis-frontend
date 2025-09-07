"use client"

import { useState, type ReactNode } from "react"
import { Eye, EyeOff } from "lucide-react"

type NavItem = { href: string; label: string; icon: ReactNode; beta?: boolean; active?: boolean }

export function DashboardShell({ items, children }: { items: NavItem[]; children: ReactNode }) {
  const [open, setOpen] = useState(true)

  return (
    <div
      className="grid gap-4 lg:gap-6"
      style={{ gridTemplateColumns: typeof window === 'undefined' ? undefined : (open ? '230px 1fr' : '64px 1fr') }}
    >
      {/* Sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-16 rounded-xl border border-border bg-white/70 p-3 backdrop-blur">
          <button
            type="button"
            onClick={() => setOpen((s) => !s)}
            className="mb-2 inline-flex items-center gap-2 rounded-md border border-border bg-white/70 px-2 py-1 text-xs hover:bg-black/5"
            aria-label={open ? 'Hide sidebar' : 'View sidebar'}
            title={open ? 'Hide sidebar' : 'View sidebar'}
          >
            {open ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className={open ? '' : 'hidden'}>{open ? 'Hide' : 'View'}</span>
          </button>

          <nav className="grid gap-2 text-sm">
            {items.map((it) => (
              <a
                key={it.href}
                href={it.href}
                className={`flex items-center gap-3 rounded-md px-2 py-2 hover:bg-black/5 ${it.active ? 'text-[hsl(var(--brand))] font-medium' : ''}`}
              >
                <span className={`grid h-8 w-8 place-items-center rounded-md ${it.active ? 'bg-[hsl(var(--brand))]/15 text-[hsl(var(--brand))]' : 'bg-black/5 text-foreground/70'}`}>
                  {it.icon}
                </span>
                <span className={open ? '' : 'hidden'}>
                  {it.label}
                  {it.beta && <sup className="ml-1 text-[10px] text-[hsl(var(--brand))]">Beta</sup>}
                </span>
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main */}
      <section>{children}</section>
    </div>
  )
}

