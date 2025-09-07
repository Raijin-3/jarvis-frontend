export const metadata = { title: "Daily Trivia & Code | Jarvis" }

import { Sidebar } from "../dashboard/sidebar"
import { MobileSidebar } from "../dashboard/mobile-sidebar"
import { TodayCountdown } from "./today-countdown"
import { CodeRunner } from "./code-runner"
import { Brain, Trophy, Target, Clock, Code2, Play, CheckCircle, Star, TrendingUp, Zap } from "lucide-react"

export default function LogicalReasoningPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/50">
      <MobileSidebar active="/logical-reasoning" />
      <div className="lg:flex lg:gap-6 max-w-screen-2xl mx-auto p-4 md:p-6">
        <Sidebar active="/logical-reasoning" />
        <section className="flex-1">
          {/* Enhanced Hero Section */}
          <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-8 backdrop-blur-xl shadow-xl mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200/50 px-4 py-2 text-sm font-medium text-amber-700">
                  <Brain className="h-4 w-4 text-amber-500" />
                  Brain Training Zone
                </div>
                <div className="flex items-center gap-2">
                  <TodayCountdown />
                </div>
              </div>
              
              <h1 className="text-4xl font-bold leading-tight text-gray-900 mb-3">
                Daily <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">Coding</span> Challenge
              </h1>
              <p className="text-lg text-gray-600 mb-6">Sharpen your problem-solving skills with bite-sized coding problems. A new challenge every day!</p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Target className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-amber-600">15</div>
                      <div className="text-sm text-gray-500">Solved Today</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">247</div>
                      <div className="text-sm text-gray-500">Total Solved</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600">7</div>
                      <div className="text-sm text-gray-500">Day Streak</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Star className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">1,250</div>
                      <div className="text-sm text-gray-500">Points Earned</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Problem Panel - Enhanced */}
            <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5"></div>
              
              <div className="relative z-10">
                {/* Problem Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <Brain className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Today's Challenge</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          Easy
                        </span>
                        <span className="text-sm text-gray-500">• Problem #247</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                      🏆 50 XP
                    </div>
                  </div>
                </div>
                
                {/* Problem Description */}
                <div className="space-y-6">
                  <div className="rounded-xl bg-white/60 border border-white/60 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-5 w-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Problem Statement</h3>
                    </div>
                    <p className="text-gray-700">
                      Write a program that prints <code className="rounded bg-amber-100 px-2 py-1 text-sm font-mono text-amber-800">Hello, World!</code> to standard output.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-white/60 border border-white/60 p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Input Format</h4>
                      <p className="text-sm text-gray-600">No input is required for this problem.</p>
                    </div>
                    
                    <div className="rounded-xl bg-white/60 border border-white/60 p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Output Format</h4>
                      <p className="text-sm text-gray-600">Print exactly: <code className="rounded bg-gray-100 px-1 text-xs">Hello, World!</code></p>
                    </div>
                  </div>
                  
                  <div className="rounded-xl bg-white/60 border border-white/60 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Play className="h-5 w-5 text-gray-600" />
                      <h4 className="font-semibold text-gray-900">Sample Output</h4>
                    </div>
                    <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono">Hello, World!</pre>
                  </div>
                  
                  {/* Hints Section */}
                  <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">💡 Hint</h4>
                    </div>
                    <p className="text-sm text-blue-800">This is a classic introductory problem. Use your language's print/output function!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Code Editor Panel - Enhanced */}
            <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
              
              <div className="relative z-10">
                {/* Editor Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Code2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Code Editor</h2>
                      <p className="text-sm text-gray-600">Write your solution and test it instantly</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Auto-save enabled</span>
                  </div>
                </div>
                
                {/* Code Runner Component */}
                <div className="rounded-xl bg-white/80 border border-white/60 p-1">
                  <CodeRunner />
                </div>
                
                {/* Quick Actions */}
                <div className="mt-4 flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-lg transition-all">
                    <Play className="h-4 w-4" />
                    Run Code
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
                    <CheckCircle className="h-4 w-4" />
                    Submit Solution
                  </button>
                </div>
                
                {/* Progress Indicator */}
                <div className="mt-6 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-800">Challenge Progress</span>
                    <span className="text-sm text-amber-600">0/1 Test Cases Passed</span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full" style={{width: '0%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Achievement Banner */}
          <div className="mt-8 rounded-2xl border border-gradient-to-r from-purple-200/60 to-pink-200/60 bg-gradient-to-br from-purple-50/80 to-pink-50/80 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-200 rounded-xl">
                  <Trophy className="h-6 w-6 text-purple-700" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900">🎯 Daily Challenge Streak!</h3>
                  <p className="text-sm text-purple-700">Keep up the momentum! Solve today's challenge to maintain your 7-day streak.</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">7 🔥</div>
                <div className="text-sm text-purple-600">Current Streak</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}