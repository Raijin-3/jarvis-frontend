"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { supabaseBrowser } from "@/lib/supabase-browser"
import { toast } from "@/lib/toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Github, Mail, User, GraduationCap, Shield, Loader2, KeyRound, ArrowRight } from "lucide-react"

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type RoleType = "student" | "teacher" | "admin"

const roleConfig = {
  student: {
    icon: <User className="h-4 w-4" />,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50/80",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    description: "Access courses, projects, and AI-powered learning"
  },
  teacher: {
    icon: <GraduationCap className="h-4 w-4" />,
    color: "from-emerald-500 to-teal-500", 
    bgColor: "bg-emerald-50/80",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
    description: "Manage courses, track progress, and view analytics"
  },
  admin: {
    icon: <Shield className="h-4 w-4" />,
    color: "from-purple-500 to-indigo-500",
    bgColor: "bg-purple-50/80",
    borderColor: "border-purple-200", 
    textColor: "text-purple-700",
    description: "Full system access and administration tools"
  }
}

export function LoginForm() {
  const sb = supabaseBrowser()
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [roleTab, setRoleTab] = useState<RoleType>("student")
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  const submit = async (v: z.infer<typeof schema>) => {
    setIsLoading(true)
    try {
      await toast.promise(
        (async () => {
          const res = await sb.auth.signInWithPassword(v)
          if (res.error) throw res.error
          return res
        })(),
        {
          loading: "Signing you in…",
          success: "Welcome back! Redirecting…",
          error: (e: any) => e?.message || "Sign-in failed",
        }
      )

      // Try direct backend profile check using fresh JWT to avoid SSR cookie timing issues
      try {
        const { data: { session } } = await sb.auth.getSession()
        const token = session?.access_token
        if (token && process.env.NEXT_PUBLIC_API_URL) {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1/profile`
          // If Admin selected, attempt to set role before fetching
          if (roleTab === 'admin') {
            try {
              await fetch(apiUrl, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'admin' })
              })
            } catch {}
          }
          const r = await fetch(apiUrl, { headers: { Authorization: `Bearer ${token}` } })
          if (r.ok) {
            const profile = await r.json()
            const role = String(profile?.role || '').toLowerCase()
            
            // Admin goes directly to admin page
            if (role === 'admin') { router.push('/admin'); return }
            
            // Teacher goes to teacher page  
            if (role === 'teacher') { router.push('/teacher'); return }
            
            // Student flow: if onboarding completed, go to dashboard
            const onboardingCompleted = Boolean(profile?.onboarding_completed)
            
            if (!onboardingCompleted) { router.push('/profile'); return }
            
            // Onboarding completed - go to dashboard
            router.push('/dashboard'); return
          }
        }
      } catch (e) {
        // ignore; fallback below
      }

      // After successful login, check user profile and redirect accordingly
      try {
        // Include fresh JWT in case server cookies are not yet synced
        const { data: { session } } = await sb.auth.getSession()
        const token = session?.access_token
        const response = await fetch('/api/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (response.ok) {
          let profile = await response.json()
          // If Admin selected but profile isn't admin yet, try to elevate role via proxy
          if (roleTab === 'admin' && String(profile?.role || '').toLowerCase() !== 'admin') {
            try {
              await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ role: 'admin' })
              })
              const refetch = await fetch('/api/profile', { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
              if (refetch.ok) profile = await refetch.json()
            } catch {}
          }
          const role = String(profile?.role || '').toLowerCase()
          
          // Admin goes directly to admin page
          if (role === 'admin') {
            router.push('/admin')
            return
          }
          
          // Teacher goes to teacher page
          if (role === 'teacher') {
            router.push('/teacher')
            return
          }
          
          // Student flow: if onboarding completed, go to dashboard
          const onboardingCompleted = Boolean(profile?.onboarding_completed)
          
          if (!onboardingCompleted) {
            router.push('/profile')
            return
          }
          
          // Onboarding completed - go to dashboard
          router.push('/dashboard')
        } else {
          // If profile fetch fails, redirect to dashboard - dashboard will handle further redirects
          router.push('/dashboard')
        }
      } catch (profileError) {
        console.error('Error checking profile:', profileError)
        // Fallback to dashboard if profile check fails
        router.push('/dashboard')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const oauth = async (provider: "github" | "google") => {
    setIsLoading(true)
    try {
      const { error } = await sb.auth.signInWithOAuth({ 
        provider, 
        options: { 
          // Use a callback URL that will handle proper redirects
          redirectTo: `${location.origin}/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        } 
      })
      if (error) {
        toast.error(error.message)
        setIsLoading(false)
      }
    } catch (err) {
      toast.error("OAuth sign-in failed")
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="relative">
      {/* Animated Card Background */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl shadow-2xl"></div>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-emerald-500/5"></div>
      
      {/* Main Content */}
      <div className="relative rounded-2xl border border-white/60 bg-white/80 p-6 backdrop-blur-xl shadow-xl md:p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 shadow-lg">
            <KeyRound className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">Choose your role and sign in to continue</p>
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <Label className="mb-4 block text-sm font-medium text-gray-700">Select your role</Label>
          <Tabs value={roleTab} onValueChange={(v) => setRoleTab(v as RoleType)} className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-2 bg-gray-100/50 p-1">
              {(Object.keys(roleConfig) as RoleType[]).map((role) => {
                const config = roleConfig[role]
                return (
                  <TabsTrigger 
                    key={role} 
                    value={role}
                    className="flex flex-col gap-2 p-3 data-[state=active]:bg-white data-[state=active]:shadow-sm capitalize"
                  >
                    <div className={`rounded-lg p-2 bg-gradient-to-r ${config.color}`}>
                      {config.icon}
                    </div>
                    <span className="text-xs font-medium">{role}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
            
            {/* Role Description */}
            <div className={`mt-4 rounded-lg border p-3 ${roleConfig[roleTab].bgColor} ${roleConfig[roleTab].borderColor}`}>
              <p className={`text-sm ${roleConfig[roleTab].textColor}`}>
                {roleConfig[roleTab].description}
              </p>
            </div>

            <TabsContent value={roleTab} className="mt-6">
              <form className="space-y-6" onSubmit={form.handleSubmit(submit)}>
                <div className="space-y-2">
                  <Label htmlFor="lemail" className="text-sm font-medium text-gray-700">
                    Email address
                  </Label>
                  <Input 
                    id="lemail" 
                    type="email" 
                    placeholder="Enter your email"
                    inputMode="email" 
                    autoComplete="email"
                    className="h-12 rounded-xl border-gray-200 bg-white/80 px-4 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                    {...form.register("email")} 
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lpass" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input 
                      id="lpass" 
                      type={showPass ? "text" : "password"} 
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="h-12 rounded-xl border-gray-200 bg-white/80 px-4 pr-12 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                      {...form.register("password")} 
                    />
                    <button 
                      type="button" 
                      aria-label={showPass ? "Hide password" : "Show password"} 
                      className="absolute inset-y-0 right-4 inline-flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPass(!showPass)}
                    >
                      {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <a 
                    href="/forgot-password" 
                    className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
                  >
                    Forgot your password?
                  </a>
                </div>

                <Button 
                  className={`group h-12 w-full rounded-xl bg-gradient-to-r ${roleConfig[roleTab].color} text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] disabled:scale-100 disabled:opacity-70`}
                  type="submit" 
                  disabled={isLoading || form.formState.isSubmitting}
                >
                  {isLoading || form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in as {roleTab}
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">or continue with</span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => oauth("github")} 
                  disabled={isLoading}
                  className="group h-12 rounded-xl border-gray-200 bg-white/80 hover:bg-gray-50 transition-all hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Github className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                      GitHub
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => oauth("google")} 
                  disabled={isLoading}
                  className="group h-12 rounded-xl border-gray-200 bg-white/80 hover:bg-gray-50 transition-all hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                      Google
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
