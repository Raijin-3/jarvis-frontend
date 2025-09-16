"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Brain, Bell, User, Menu, X, Home, BookOpen, Trophy,
  Settings, LogOut, LayoutDashboard, Target, Sparkles,
  Search, Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { supabaseBrowser } from "@/lib/supabase-browser"

type User = {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

type Props = {
  user?: User | null
  userProfile?: {
    role?: string
    xp?: number
    tier?: string
    streak?: number
  } | null
}

const publicNavItems = [
  // Navigation items removed as requested
]

const userNavItems = [
  // Navigation items removed as requested
]

export function UnifiedHeader({ user, userProfile }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const sb = supabaseBrowser()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      await sb.auth.signOut()
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch {}
    router.replace('/login')
    router.refresh()
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Learner"
  const avatarUrl = user?.user_metadata?.avatar_url || null
  const initial = displayName.charAt(0).toUpperCase()
  const isAuthenticated = Boolean(user)

  const navItems = isAuthenticated ? userNavItems : publicNavItems

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/10 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                  Jarvis
                </div>
                <div className="text-xs text-gray-600 hidden sm:block">AI Learning Platform</div>
              </div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-white/10 backdrop-blur-xl supports-[backdrop-filter]:bg-white/10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href={isAuthenticated ? "/dashboard" : "/"} 
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 shadow-lg hover:shadow-xl transition-shadow">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                Jarvis
              </div>
              <div className="text-xs text-gray-600 hidden sm:block">AI Learning Platform</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {!isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium"
                >
                  {item.icon}
                  {item.label}
                </a>
              ))}
            </nav>
          )}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <AuthenticatedNav 
                user={user}
                userProfile={userProfile}
                displayName={displayName}
                avatarUrl={avatarUrl}
                initial={initial}
                onLogout={handleLogout}
              />
            ) : (
              <PublicNav />
            )}

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-white/20 bg-white/20 backdrop-blur-sm hover:bg-white/30">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-white/95 backdrop-blur-xl border-white/20">
                  <SheetHeader className="text-left">
                    <SheetTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                        Jarvis Menu
                      </span>
                    </SheetTitle>
                    <SheetDescription>
                      Navigate through the platform
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="mt-8 space-y-4">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-colors"
                      >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                    
                    {isAuthenticated ? (
                      <div className="pt-4 border-t border-gray-200 space-y-4">
                        <Link
                          href="/profile"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          <span className="font-medium">Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout()
                            setIsOpen(false)
                          }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors text-red-600 w-full text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          <span className="font-medium">Log out</span>
                        </button>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-gray-200 space-y-3">
                        <Link 
                          href="/login"
                          onClick={() => setIsOpen(false)}
                          className="block w-full"
                        >
                          <Button variant="outline" className="w-full justify-center rounded-xl">
                            Sign in
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function AuthenticatedNav({ 
  user, 
  userProfile, 
  displayName, 
  avatarUrl, 
  initial, 
  onLogout 
}: {
  user: User
  userProfile?: any
  displayName: string
  avatarUrl: string | null
  initial: string
  onLogout: () => void
}) {
  const sampleNotifs = [
    { id: "n1", title: "Daily review is ready", desc: "10 flashcards due", href: "/reviews/today" },
    { id: "n2", title: "New recommendation", desc: "Try SQL Joins module", href: "/modules/sql-joins" },
    { id: "n3", title: "Streak milestone", desc: "12 days and counting", href: "/dashboard" },
  ]

  return (
    <>
      {/* User Stats - Hidden on mobile */}
      <div className="hidden xl:flex items-center gap-4">
        {userProfile?.xp && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200">
            <Sparkles className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-700">{userProfile.xp.toLocaleString()} XP</span>
          </div>
        )}
        {userProfile?.tier && (
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200">
            {userProfile.tier}
          </Badge>
        )}
      </div>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="relative h-10 w-10 rounded-xl border-white/20 bg-white/20 backdrop-blur-sm hover:bg-white/30"
          >
            <Bell className="h-5 w-5" />
            {sampleNotifs.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-xs text-white border-2 border-white">
                {sampleNotifs.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0 bg-white/95 backdrop-blur-xl border-white/20">
          <div className="border-b border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <p className="text-sm text-gray-600">Stay updated with your learning progress</p>
          </div>
          <div className="max-h-96 overflow-auto">
            {sampleNotifs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sampleNotifs.map((notif) => (
                  <Link
                    key={notif.id}
                    href={notif.href}
                    className="block p-4 hover:bg-white/60 transition-colors"
                  >
                    <div className="font-medium text-gray-900 text-sm">{notif.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{notif.desc}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 p-3">
            <Link 
              href="/notifications"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all notifications →
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Profile Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="h-10 gap-3 rounded-xl pl-2 pr-4 border-white/20 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            <Avatar className="h-7 w-7">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-emerald-500 text-white font-semibold">
                  {initial}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="hidden md:inline text-sm font-medium text-gray-900">
              {displayName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="flex items-center cursor-pointer">
                <Home className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/learning-path" className="flex items-center cursor-pointer">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Learning Path</span>
              </Link>
            </DropdownMenuItem>
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
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

function PublicNav() {
  return (
    <>
      <div className="hidden lg:flex items-center gap-3">
        <Link href="/login">
          <Button 
            variant="outline" 
            className="rounded-xl border-white/20 bg-white/20 backdrop-blur-sm hover:bg-white/30"
          >
            Sign in
          </Button>
        </Link>
        {/* Signup removed */}
      </div>
    </>
  )
}
