"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { supabaseBrowser } from "@/lib/supabase-browser"
import { toast } from "@/lib/toast"
import { Github, Mail, Eye, EyeOff, ShieldCheck } from "lucide-react"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const schema = z.object({
  email: z.string().email("Use a valid email"),
  password: z.string().min(6, "Min 6 characters"),
})

export function AuthForm() {
  const sb = supabaseBrowser()
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)

  // sign in
  const loginForm = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  // sign up
  const signupForm = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  const onSignIn = async (v: z.infer<typeof schema>) => {
    await toast.promise(
      sb.auth.signInWithPassword(v),
      {
        loading: "Signing you in…",
        success: "Welcome back! Redirecting…",
        error: (e) => e?.error?.message || "Sign-in failed",
      }
    )
    // Let middleware/pages redirect after session changes
  }

  const onSignUp = async (v: z.infer<typeof schema>) => {
    await toast.promise(
      sb.auth.signUp(v),
      {
        loading: "Creating your account…",
        success: "Check your inbox to confirm your email.",
        error: (e) => e?.error?.message || "Sign-up failed",
      }
    )
  }

  const oauth = async (provider: "github" | "google") => {
    const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/dashboard` } })
    if (error) toast.error(error.message)
  }

  return (
    <div className="relative rounded-xl border border-border bg-white/70 p-4 shadow-sm backdrop-blur md:p-6">
      {/* badge */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-3 py-1 text-xs font-medium">
        <ShieldCheck className="h-4 w-4" />
        Secure sign-in
      </div>

      <h2 className="mb-1 text-xl font-semibold">Sign in to Jarvis</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        AI-powered learning for Analysts. Continue with email or OAuth.
      </p>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="login">Sign in</TabsTrigger>
        </TabsList>

        {/* Sign in */}
        <TabsContent value="login" className="mt-4">
          <form
            className="space-y-3"
            onSubmit={loginForm.handleSubmit(async (v) => {
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
              // Force full navigation so middleware can sync Supabase cookies
              if (typeof window !== 'undefined') window.location.assign('/dashboard')
            })}
          >
            <div className="space-y-1.5">
              <Label htmlFor="lemail">Email</Label>
              <Input
                id="lemail"
                type="email"
                placeholder="you@company.com"
                inputMode="email"
                autoComplete="email"
                {...loginForm.register("email")}
              />
              {loginForm.formState.errors.email && (
                <p className="text-xs text-red-600">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lpass">Password</Label>
              <div className="relative">
                <Input
                  id="lpass"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  {...loginForm.register("password")}
                />
                <button
                  type="button"
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPass((s) => !s)}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-xs text-red-600">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button className="w-full" type="submit" disabled={loginForm.formState.isSubmitting}>
              {loginForm.formState.isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <OAuthBlock onGithub={() => oauth("github")} onGoogle={() => oauth("google")} />
        </TabsContent>

        {/* Sign up */}
        <TabsContent value="signup" className="mt-4">
          <form
            className="space-y-3"
            onSubmit={signupForm.handleSubmit(async (v) => {
              await toast.promise(
                (async () => {
                  const res = await sb.auth.signUp({ email: v.email, password: v.password })
                  if (res.error) throw res.error
                  return res
                })(),
                {
                  loading: "Creating your account…",
                  success: "Account created!",
                  error: (e: any) => e?.message || "Sign-up failed",
                }
              )
              try {
                await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
              } catch {}
            })}
          >
            <div className="space-y-1.5">
              <Label htmlFor="semail">Email</Label>
              <Input id="semail" type="email" placeholder="you@company.com" inputMode="email" autoComplete="email" {...signupForm.register("email")} />
              {signupForm.formState.errors.email && (
                <p className="text-xs text-red-600">{signupForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="spass">Password</Label>
              <Input id="spass" type="password" autoComplete="new-password" {...signupForm.register("password")} />
              {signupForm.formState.errors.password && (
                <p className="text-xs text-red-600">{signupForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button className="w-full" type="submit" disabled={signupForm.formState.isSubmitting}>
              {signupForm.formState.isSubmitting ? "Creating…" : "Create account"}
            </Button>
          </form>

          <OAuthBlock onGithub={() => oauth("github")} onGoogle={() => oauth("google")} />
        </TabsContent>
      </Tabs>

      <Separator className="my-4" />
      <p className="text-center text-xs text-muted-foreground">
        By continuing you agree to our{" "}
        <Link className="underline hover:opacity-80" href="/terms">Terms</Link> and{" "}
        <Link className="underline hover:opacity-80" href="/privacy">Privacy Policy</Link>.
      </p>
    </div>
  )
}

/** Reusable OAuth buttons block */
function OAuthBlock({ onGithub, onGoogle }: { onGithub: () => void; onGoogle: () => void }) {
  return (
    <>
      <div className="my-4 text-center text-xs text-muted-foreground">or continue with</div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={onGithub} className="w-full">
          <Github className="mr-2 h-4 w-4" /> GitHub
        </Button>
        <Button type="button" variant="outline" onClick={onGoogle} className="w-full">
          <Mail className="mr-2 h-4 w-4" /> Google
        </Button>
      </div>
    </>
  )
}


