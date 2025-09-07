export const metadata = { title: "Class Schedule | Jarvis" }

import { Sidebar } from "../dashboard/sidebar"
import { MobileSidebar } from "../dashboard/mobile-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Video, Users, MapPin, Play, CheckCircle, AlertCircle, Bell } from "lucide-react"

// Mock data for upcoming and previous classes
const UPCOMING_CLASSES = [
  {
    id: 1,
    title: "Advanced SQL Joins & Window Functions",
    instructor: "Dr. Sarah Chen",
    date: "2025-01-08",
    time: "10:00 AM - 12:00 PM",
    type: "Live Session",
    duration: 120,
    attendees: 24,
    status: "confirmed",
    meetingLink: "https://zoom.us/j/123456789",
    description: "Deep dive into complex SQL operations and window functions for analytics."
  },
  {
    id: 2,
    title: "Python Data Visualization Workshop",
    instructor: "Prof. Mike Johnson",
    date: "2025-01-10",
    time: "2:00 PM - 4:00 PM", 
    type: "Workshop",
    duration: 120,
    attendees: 32,
    status: "confirmed",
    meetingLink: "https://zoom.us/j/987654321",
    description: "Hands-on workshop covering matplotlib, seaborn, and plotly for data visualization."
  },
  {
    id: 3,
    title: "Business Analytics Case Study Review",
    instructor: "Anna Rodriguez",
    date: "2025-01-12",
    time: "11:00 AM - 12:30 PM",
    type: "Discussion",
    duration: 90,
    attendees: 18,
    status: "pending",
    meetingLink: "https://zoom.us/j/456789123",
    description: "Review and discuss real-world business analytics case studies and solutions."
  }
];

const PREVIOUS_CLASSES = [
  {
    id: 4,
    title: "Introduction to Statistical Analysis",
    instructor: "Dr. Emily Watson",
    date: "2025-01-02",
    time: "1:00 PM - 2:30 PM",
    type: "Lecture",
    duration: 90,
    attendees: 28,
    status: "completed",
    recordingUrl: "https://recordings.zoom.us/rec/123",
    description: "Fundamental concepts of statistics for data analysis."
  },
  {
    id: 5,
    title: "Excel for Data Analysis Kickoff",
    instructor: "Mark Thompson",
    date: "2024-12-28",
    time: "10:00 AM - 11:30 AM",
    type: "Kickoff",
    duration: 90,
    attendees: 35,
    status: "completed",
    recordingUrl: "https://recordings.zoom.us/rec/456",
    description: "Getting started with Excel formulas and data manipulation techniques."
  }
];

export default function SchedulePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/50">
      <MobileSidebar active="/schedule" />
      <div className="lg:flex lg:gap-6 max-w-screen-2xl mx-auto p-4 md:p-6">
        <Sidebar active="/schedule" />
        <section className="flex-1">
          {/* Enhanced Hero Section */}
          <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-8 backdrop-blur-xl shadow-xl mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200/50 px-4 py-2 text-sm font-medium text-purple-700">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  Live Learning Schedule
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Bell className="h-4 w-4 text-amber-500" />
                  <span>3 upcoming classes</span>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold leading-tight text-gray-900 mb-3">
                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Class Schedule</span>
              </h1>
              <p className="text-lg text-gray-600 mb-6">Join live sessions, workshops, and discussions with expert instructors and fellow learners.</p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Video className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">3</div>
                      <div className="text-sm text-gray-500">Upcoming Sessions</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">2</div>
                      <div className="text-sm text-gray-500">Classes Attended</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">95%</div>
                      <div className="text-sm text-gray-500">Attendance Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Tabs */}
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/60 border border-white/60 rounded-xl p-1">
              <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Upcoming Classes
              </TabsTrigger>
              <TabsTrigger value="previous" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Previous Classes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-6">
              <div className="space-y-6">
                {UPCOMING_CLASSES.map((class_) => (
                  <div key={class_.id} className="group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg transition-all hover:shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${
                            class_.status === 'confirmed' ? 'bg-green-100' : 'bg-yellow-100'
                          }`}>
                            {class_.status === 'confirmed' ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : (
                              <AlertCircle className="h-6 w-6 text-yellow-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">{class_.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                class_.type === 'Live Session' ? 'bg-red-100 text-red-700' :
                                class_.type === 'Workshop' ? 'bg-blue-100 text-blue-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {class_.type}
                              </span>
                            </div>
                            <div className="text-gray-600 mb-3">{class_.description}</div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(class_.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{class_.time}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{class_.attendees} enrolled</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Instructor: </span>
                          <span className="text-gray-600">{class_.instructor}</span>
                        </div>
                        
                        <a 
                          href={class_.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium transition-all hover:shadow-lg hover:from-purple-600 hover:to-pink-600"
                        >
                          <Video className="h-4 w-4" />
                          Join Class
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
                
                {UPCOMING_CLASSES.length === 0 && (
                  <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-12 backdrop-blur-xl shadow-lg text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming classes</h3>
                    <p className="text-gray-600">New classes are typically scheduled every Friday for the following week.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="previous" className="mt-6">
              <div className="space-y-4">
                {PREVIOUS_CLASSES.map((class_) => (
                  <div key={class_.id} className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-green-100">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{class_.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              class_.type === 'Lecture' ? 'bg-blue-100 text-blue-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {class_.type}
                            </span>
                          </div>
                          <div className="text-gray-600 text-sm mb-2">{class_.description}</div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{new Date(class_.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{class_.time}</span>
                            <span>•</span>
                            <span>By {class_.instructor}</span>
                            <span>•</span>
                            <span>{class_.attendees} attended</span>
                          </div>
                        </div>
                      </div>
                      
                      <a 
                        href={class_.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                      >
                        <Play className="h-4 w-4" />
                        Watch Recording
                      </a>
                    </div>
                  </div>
                ))}
                
                {PREVIOUS_CLASSES.length === 0 && (
                  <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-12 backdrop-blur-xl shadow-lg text-center">
                    <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No previous classes</h3>
                    <p className="text-gray-600">Your attended classes and recordings will appear here.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Information Card */}
          <div className="mt-8 rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-blue-100/60 p-6 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Class Schedule Information</h3>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>• Live class schedules are typically updated every Friday for the upcoming week</p>
                  <p>• All recordings are automatically uploaded within 24 hours after each session</p>
                  <p>• Join classes 5-10 minutes early for the best experience</p>
                  <p>• Classes are categorized as Lectures, Workshops, Discussions, or Kickoff sessions</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}