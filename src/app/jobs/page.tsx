export const metadata = { title: "AI Jobs | Jarvis" }

import { Sidebar } from "../dashboard/sidebar"
import { MobileSidebar } from "../dashboard/mobile-sidebar"
import { Briefcase, MapPin, Clock, DollarSign, Users, TrendingUp, Star, ExternalLink, Filter, Search, Building, Calendar } from "lucide-react"

// Mock job data
const FEATURED_JOBS = [
  {
    id: 1,
    title: "Senior Data Analyst",
    company: "TechCorp Inc",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$95,000 - $130,000",
    posted: "2 days ago",
    description: "Join our analytics team to drive data-driven decisions across the organization. Experience with SQL, Python, and Tableau required.",
    tags: ["SQL", "Python", "Tableau", "Analytics"],
    logo: "https://via.placeholder.com/60x60?text=TC",
    remote: false,
    featured: true
  },
  {
    id: 2,
    title: "Machine Learning Engineer",
    company: "AI Innovations",
    location: "Remote",
    type: "Full-time",
    salary: "$120,000 - $160,000",
    posted: "1 day ago",
    description: "Build and deploy ML models at scale. Strong background in deep learning and MLOps required.",
    tags: ["Python", "TensorFlow", "MLOps", "AWS"],
    logo: "https://via.placeholder.com/60x60?text=AI",
    remote: true,
    featured: true
  },
  {
    id: 3,
    title: "Business Intelligence Analyst",
    company: "DataDriven Corp",
    location: "New York, NY",
    type: "Full-time",
    salary: "$75,000 - $95,000",
    posted: "3 days ago",
    description: "Transform raw data into actionable business insights. Power BI and Excel expertise required.",
    tags: ["Power BI", "Excel", "SQL", "Business Intelligence"],
    logo: "https://via.placeholder.com/60x60?text=DD",
    remote: false,
    featured: false
  },
  {
    id: 4,
    title: "Data Scientist - Junior",
    company: "StartupXYZ",
    location: "Austin, TX",
    type: "Full-time",
    salary: "$70,000 - $90,000",
    posted: "4 days ago",
    description: "Entry-level position for recent graduates. Strong foundation in statistics and Python required.",
    tags: ["Python", "R", "Statistics", "Machine Learning"],
    logo: "https://via.placeholder.com/60x60?text=SX",
    remote: true,
    featured: false
  },
  {
    id: 5,
    title: "Analytics Consultant",
    company: "Consulting Pro",
    location: "Chicago, IL",
    type: "Contract",
    salary: "$65 - $85 / hour",
    posted: "1 week ago",
    description: "Work with Fortune 500 clients on strategic analytics initiatives. Travel required.",
    tags: ["Consulting", "Analytics", "Presentation", "Strategy"],
    logo: "https://via.placeholder.com/60x60?text=CP",
    remote: false,
    featured: false
  }
];

const JOB_STATS = {
  totalJobs: 1247,
  newThisWeek: 89,
  averageSalary: "$105,000",
  topLocation: "San Francisco"
};

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/50">
      <MobileSidebar active="/jobs" />
      <div className="lg:flex lg:gap-6 max-w-screen-2xl mx-auto p-4 md:p-6">
        <Sidebar active="/jobs" />
        <section className="flex-1">
          {/* Enhanced Hero Section */}
          <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-8 backdrop-blur-xl shadow-xl mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 px-4 py-2 text-sm font-medium text-indigo-700">
                  <Briefcase className="h-4 w-4 text-indigo-500" />
                  AI Career Center
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-bold">BETA</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>{JOB_STATS.newThisWeek} new jobs this week</span>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold leading-tight text-gray-900 mb-3">
                Find Your Dream <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AI Job</span>
              </h1>
              <p className="text-lg text-gray-600 mb-6">Discover exciting opportunities in data science, analytics, and artificial intelligence from top companies.</p>
              
              {/* Search Bar */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or skills..."
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-white/60 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium transition-all hover:shadow-lg">
                    <Search className="h-4 w-4" />
                    Search Jobs
                  </button>
                  <button className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/80 border border-white/60 text-gray-700 font-medium hover:bg-white transition-colors">
                    <Filter className="h-4 w-4" />
                    Filters
                  </button>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Briefcase className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-indigo-600">{JOB_STATS.totalJobs.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Total Jobs</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">{JOB_STATS.newThisWeek}</div>
                      <div className="text-sm text-gray-500">This Week</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-amber-600">{JOB_STATS.averageSalary}</div>
                      <div className="text-sm text-gray-500">Avg. Salary</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 rounded-xl p-4 border border-white/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">{JOB_STATS.topLocation}</div>
                      <div className="text-sm text-gray-500">Top Location</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Jobs Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Featured Opportunities</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Star className="h-4 w-4 text-amber-500" />
                <span>Hand-picked for you</span>
              </div>
            </div>

            <div className="space-y-6">
              {FEATURED_JOBS.filter(job => job.featured).map((job) => (
                <div key={job.id} className="group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg transition-all hover:shadow-2xl hover:scale-[1.01]">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  {job.featured && (
                    <div className="absolute top-4 right-4">
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-medium">
                        <Star className="h-3 w-3" />
                        Featured
                      </div>
                    </div>
                  )}
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <img 
                          src={job.logo} 
                          alt={`${job.company} logo`}
                          className="w-12 h-12 rounded-xl border border-gray-200 bg-white"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                            {job.remote && (
                              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                Remote
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              <span>{job.company}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{job.type}</span>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-4">{job.description}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.tags.map((tag) => (
                              <span key={tag} className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          <DollarSign className="h-4 w-4" />
                          <span>{job.salary}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>Posted {job.posted}</span>
                        </div>
                      </div>
                      
                      <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium transition-all hover:shadow-lg">
                        <ExternalLink className="h-4 w-4" />
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Jobs Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Opportunities</h2>
            
            <div className="space-y-4">
              {FEATURED_JOBS.filter(job => !job.featured).map((job) => (
                <div key={job.id} className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg transition-all hover:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img 
                        src={job.logo} 
                        alt={`${job.company} logo`}
                        className="w-10 h-10 rounded-lg border border-gray-200 bg-white"
                      />
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                          {job.remote && (
                            <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                              Remote
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{job.company}</span>
                          <span>•</span>
                          <span>{job.location}</span>
                          <span>•</span>
                          <span>{job.type}</span>
                          <span>•</span>
                          <span className="text-green-600 font-medium">{job.salary}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex flex-wrap gap-1">
                        {job.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                            {tag}
                          </span>
                        ))}
                        {job.tags.length > 3 && (
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                            +{job.tags.length - 3} more
                          </span>
                        )}
                      </div>
                      <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium transition-colors">
                        <ExternalLink className="h-4 w-4" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Job Alerts CTA */}
          <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-200 rounded-xl">
                  <Users className="h-6 w-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">📧 Get Job Alerts</h3>
                  <p className="text-sm text-blue-700">Be the first to know about new opportunities matching your skills and preferences.</p>
                </div>
              </div>
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
                Set Up Alerts
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}