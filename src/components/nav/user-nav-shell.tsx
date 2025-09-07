"use client"

import { useEffect, useState } from "react"
import type { ComponentProps } from "react"
import { UserNav } from "./user-nav"

export function UserNavShell(props: ComponentProps<typeof UserNav>) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <UserNav {...props} />
}

