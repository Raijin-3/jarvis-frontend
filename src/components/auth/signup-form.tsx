"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { supabaseBrowser } from "@/lib/supabase-browser"
import { toast } from "@/lib/toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const schema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Use a valid email"),
    password: z.string().min(6, "Min 6 characters"),
    confirmPassword: z.string().min(6, "Min 6 characters"),
    role: z.enum(["student", "teacher", "admin"]),
    admin_code: z.string().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

export function SignupForm() {
  const sb = supabaseBrowser()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", role: "student", admin_code: "" },
  })

  const onSubmit = async (v: z.infer<typeof schema>) => {
    // Build the sign-up promise so we can show a toast and also await the actual result
    const signPromise = (async () => {
      const r = await sb.auth.signUp({
        email: v.email,
        password: v.password,
        options: { data: { full_name: v.name } },
      })
      if (r.error) throw r.error
      return r
    })()

    toast.promise(signPromise, {
      loading: "Creating your account…",
      success: "Account created!",
      error: (e: any) => e?.message || "Sign-up failed",
    })

    const res = await signPromise

    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: form.getValues("role"),
          admin_code: form.getValues("admin_code") || undefined,
          full_name: form.getValues("name"),
        }),
      })
    } catch {}
    // If session is present (email confirmations disabled), send to profile; otherwise take them to login
    if (typeof window !== 'undefined') {
      if (res?.data?.session) window.location.assign('/profile')
      else window.location.assign('/login?checkEmail=1')
    }
  }

  const role = form.watch("role")

  return (
    <div className="space-y-4">
      {/* Form Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="text-sm text-gray-600">Get started with your personalized learning journey</p>
      </div>

      <form className="relative rounded-2xl border border-white/60 bg-white/60 p-6 shadow-2xl backdrop-blur-md" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 rounded-2xl"></div>
        
        <div className="relative grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full name</Label>
            <Input 
              id="name" 
              placeholder="Enter your full name" 
              className="h-11 rounded-lg border-gray-200 bg-white/80 backdrop-blur focus:border-emerald-500 focus:ring-emerald-500/20" 
              {...form.register("name")} 
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@company.com" 
              inputMode="email" 
              autoComplete="email" 
              className="h-11 rounded-lg border-gray-200 bg-white/80 backdrop-blur focus:border-emerald-500 focus:ring-emerald-500/20" 
              {...form.register("email")} 
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Create a strong password"
              autoComplete="new-password" 
              className="h-11 rounded-lg border-gray-200 bg-white/80 backdrop-blur focus:border-emerald-500 focus:ring-emerald-500/20" 
              {...form.register("password")} 
            />
            {form.formState.errors.password && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm password</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              placeholder="Confirm your password"
              autoComplete="new-password" 
              className="h-11 rounded-lg border-gray-200 bg-white/80 backdrop-blur focus:border-emerald-500 focus:ring-emerald-500/20" 
              {...form.register("confirmPassword")} 
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="grid gap-3">
            <Label className="text-sm font-medium text-gray-700">I am a...</Label>
            <div className="grid grid-cols-3 gap-2">
              <label className="relative">
                <input type="radio" value="student" {...form.register("role")} className="peer sr-only" />
                <div className="cursor-pointer rounded-lg border border-gray-200 bg-white/80 p-3 text-center transition-all hover:bg-white peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700">
                  <div className="text-sm font-medium">Student</div>
                </div>
              </label>
              <label className="relative">
                <input type="radio" value="teacher" {...form.register("role")} className="peer sr-only" />
                <div className="cursor-pointer rounded-lg border border-gray-200 bg-white/80 p-3 text-center transition-all hover:bg-white peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700">
                  <div className="text-sm font-medium">Teacher</div>
                </div>
              </label>
              <label className="relative">
                <input type="radio" value="admin" {...form.register("role")} className="peer sr-only" />
                <div className="cursor-pointer rounded-lg border border-gray-200 bg-white/80 p-3 text-center transition-all hover:bg-white peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700">
                  <div className="text-sm font-medium">Admin</div>
                </div>
              </label>
            </div>
          </div>

          {role === "admin" && (
            <div className="grid gap-2">
              <Label htmlFor="admin_code" className="text-sm font-medium text-gray-700">Admin access code</Label>
              <Input 
                id="admin_code" 
                placeholder="Enter admin code" 
                className="h-11 rounded-lg border-gray-200 bg-white/80 backdrop-blur focus:border-emerald-500 focus:ring-emerald-500/20" 
                {...form.register("admin_code")} 
              />
            </div>
          )}

          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting}
            className="w-full h-12 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {form.formState.isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Creating account...
              </div>
            ) : (
              "Create account"
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center leading-relaxed">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-emerald-600 hover:text-emerald-700 underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-emerald-600 hover:text-emerald-700 underline">Privacy Policy</a>
          </p>
        </div>
      </form>
    </div>
  )
}

