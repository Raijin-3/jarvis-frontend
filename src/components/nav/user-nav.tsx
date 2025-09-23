"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, User, Settings, LogOut, Home, BookOpen, Target } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabaseBrowser } from "@/lib/supabase-browser"

import Link from "next/link"

type Props = {
  name?: string | null
  email?: string | null
  imageUrl?: string | null
  minimal?: boolean // when true, show only Profile, Settings, and Logout in dropdown
}

export function UserNav({ name, email, imageUrl, minimal = false }: Props) {
  const router = useRouter()
  const sb = supabaseBrowser()
  const [userRole, setUserRole] = useState<string>("student") // default to student

  const initial = useMemo(() => {
    const n = (name || email || "?").trim()
    return n.charAt(0).toUpperCase()
  }, [name, email])

  // Fetch user role from API
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/user/summary', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (!data || cancelled) return
        if (typeof data.role === 'string') {
          setUserRole(data.role)
        }
      } catch (error) {
        console.warn("Could not fetch user role:", error)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const sampleNotifs = useMemo(
    () => [
      { id: "n1", title: "Daily review is ready", desc: "10 flashcards due", href: "/reviews/today" },
      { id: "n2", title: "New recommendation", desc: "Try SQL Joins module", href: "/modules/sql-joins" },
      { id: "n3", title: "Streak milestone", desc: "12 days and counting", href: "/dashboard" },
    ],
    []
  )

  const handleLogout = async () => {
    try {
      await sb.auth.signOut()
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    }
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      {/* Notifications dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild id="notif-menu-trigger">
          <Button id="notif-menu-trigger" variant="outline" size="icon" className="h-9 w-9 rounded-md">
            <Bell className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="border-b border-border p-3 text-sm font-medium">Notifications</div>
          <div className="max-h-72 overflow-auto p-2">
            {sampleNotifs.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">You're all caught up!</div>
            ) : (
              <div className="grid gap-1">
                {sampleNotifs.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    className="rounded-md px-3 py-2 text-left hover:bg-black/5"
                  >
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.desc}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border p-2">
            <Button variant="ghost" className="h-8 px-2 text-xs">Mark all as read</Button>
            <Link href="/notifications" className="text-xs text-[hsl(var(--brand))] hover:underline">View all</Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Profile Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 gap-2 rounded-full pl-1 pr-3 hover:bg-accent/50">
            <Avatar className="h-7 w-7">
              {imageUrl ? (
                <AvatarImage src={imageUrl} alt={name ?? email ?? "User"} />
              ) : (
                <AvatarFallback className="bg-[hsl(var(--brand))]/15 text-[hsl(var(--brand))]">
                  {initial}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">{name || email || "Account"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{name || "User"}</p>
              <p className="text-xs leading-none text-muted-foreground">{email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {!minimal && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center cursor-pointer">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                {/* Only show Learning Path for non-admin users */}
                {userRole !== "admin" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/learning-path" className="flex items-center cursor-pointer">
                        <BookOpen className="mr-2 h-4 w-4" />
                        <span>Learning Path</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/learning-path-orchestrator" className="flex items-center cursor-pointer">
                        <Target className="mr-2 h-4 w-4" />
                        <span>Path Orchestrator</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
