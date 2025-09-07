import { DashboardShell } from '@/components/layout/dashboard-shell'
import { BookOpen, LayoutDashboard, FileCheck2, Calendar, Brain } from 'lucide-react'

export default function DemoPage() {
  const demoItems = [
    { 
      href: "/dashboard", 
      label: "Dashboard", 
      icon: <LayoutDashboard className="h-4 w-4" />,
      active: true
    },
    { 
      href: "/curriculum", 
      label: "My Courses", 
      icon: <BookOpen className="h-4 w-4" />
    },
    { 
      href: "/assessment", 
      label: "Assessments", 
      icon: <FileCheck2 className="h-4 w-4" />
    },
    { 
      href: "/schedule", 
      label: "Schedule", 
      icon: <Calendar className="h-4 w-4" />
    },
    { 
      href: "/logical-reasoning", 
      label: "Daily Challenge", 
      icon: <Brain className="h-4 w-4" />,
      beta: true
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Demo Header */}
      <div className="sticky top-0 z-30 border-b border-white/20 bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 md:p-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Jarvis</span>
            <span className="text-xs text-muted-foreground">AI Learning</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-xs font-medium">
              DashboardShell Demo
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm">
              D
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto p-4 md:p-6">
        <DashboardShell items={demoItems}>
          <div className="rounded-2xl border border-white/60 bg-white/60 p-8 backdrop-blur">
            <h1 className="text-3xl font-bold mb-4">DashboardShell Component Demo</h1>
            <p className="text-lg text-gray-600 mb-6">
              This demonstrates the DashboardShell component with the fixed hide button behavior.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">✅ Issue Fixed:</h3>
              <p className="text-green-700">
                The hide button now correctly shows "View" when the sidebar is collapsed, 
                instead of showing nothing.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Test Instructions:</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Click the hide/show button in the sidebar (eye icon)</li>
                <li>When expanded: Button shows "Hide" text</li>
                <li>When collapsed: Button shows "View" text (this was the bug)</li>
                <li>The button should toggle correctly between states</li>
              </ol>
            </div>
          </div>
        </DashboardShell>
      </div>
    </div>
  )
}