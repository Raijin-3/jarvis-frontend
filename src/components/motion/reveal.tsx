"use client"

import { useEffect, useRef, type ReactNode } from "react"

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: 0 | 1 | 2 | 3; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          el.classList.add("reveal-visible")
          obs.disconnect()
        }
      })
    }, { rootMargin: "-10% 0px -10% 0px", threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className={["reveal", delay ? `reveal-delay-${delay}` : "", className].filter(Boolean).join(" ")}>{children}</div>
  )
}

