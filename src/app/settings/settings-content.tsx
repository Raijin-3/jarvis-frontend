"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// Header is handled by the root layout via HeaderProvider
import { supabaseBrowser } from "@/lib/supabase-browser"
import { toast } from "sonner"
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Trash2, 
  LogOut,
  ChevronRight,
  Save
} from "lucide-react"

type User = {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export function SettingsContent({ user }: { user: User }) {
  const router = useRouter()
  const sb = supabaseBrowser()
  
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false
  })
  
  const [profile, setProfile] = useState({
    fullName: user.user_metadata?.full_name || "",
    email: user.email || ""
  })

  const handleLogout = async () => {
    try {
      await sb.auth.signOut()
      await fetch('/api/auth/signout', { method: 'POST' })
      toast.success("Logged out successfully")
    } catch (error) {
      console.error('Logout error:', error)
      toast.error("Failed to logout")
    }
    router.replace('/login')
    router.refresh()
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const { error } = await sb.auth.updateUser({
        data: { full_name: profile.fullName }
      })
      
      if (error) throw error
      toast.success("Profile updated successfully")
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return
    }
    
    toast.error("Account deletion is not available yet. Please contact support.")
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
  const avatarUrl = user.user_metadata?.avatar_url

  return (
    <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account preferences and settings</p>
          </div>

          <div className="grid gap-6 md:grid-cols-12">
            {/* Sidebar Navigation */}
            <div className="md:col-span-4 lg:col-span-3">
              <Card>
                <CardContent className="p-4">
                  <nav className="space-y-2">
                    <div className="flex items-center gap-3 p-2 bg-blue-50 text-blue-700 rounded-lg">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">Account</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Bell className="h-4 w-4" />
                      <span className="text-sm">Notifications</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">Privacy</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Palette className="h-4 w-4" />
                      <span className="text-sm">Appearance</span>
                    </div>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="md:col-span-8 lg:col-span-9 space-y-6">
              {/* Profile Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and profile settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={displayName} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-semibold">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{displayName}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Change Avatar
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profile.fullName}
                        onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about updates and progress
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-gray-500">Receive learning progress updates via email</div>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, email: checked }))
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Push Notifications</div>
                      <div className="text-sm text-gray-500">Get real-time notifications in your browser</div>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, push: checked }))
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Marketing Communications</div>
                      <div className="text-sm text-gray-500">Receive tips, updates, and special offers</div>
                    </div>
                    <Switch
                      checked={notifications.marketing}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, marketing: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Account Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Account Actions
                  </CardTitle>
                  <CardDescription>
                    Manage your account security and data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">Sign Out</div>
                      <div className="text-sm text-gray-500">Sign out of your account on this device</div>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="space-y-1">
                      <div className="font-medium text-red-900">Delete Account</div>
                      <div className="text-sm text-red-700">Permanently delete your account and all data</div>
                    </div>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
  )
}