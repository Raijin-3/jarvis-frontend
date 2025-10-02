"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  Users, 
  Search, 
  Filter,
  Grid,
  List,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  Circle,
  Star,
  Award,
  Target,
  TrendingUp,
  FileText,
  Video,
  Code,
  BookMarked
} from "lucide-react";

type Subject = {
  id: string;
  title: string;
  moduleCount?: number;
  sectionCount?: number;
  modules?: any[];
  description?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours?: number;
  type?: 'theory' | 'practical' | 'project';
};

type Track = {
  title?: string;
  description?: string;
  difficulty?: string;
  category?: string;
  instructor?: string;
};

type EnrollmentData = {
  enrolledDate: string;
  estimatedCompletion: string;
  totalHours: number;
  completedHours: number;
};

export function ProfessionalCourseOverview({
  courseId,
  track,
  subjects,
  modules,
  enrollmentData
}: {
  courseId: string;
  track: Track | null;
  subjects: Subject[];
  modules: any[];
  enrollmentData: EnrollmentData;
}) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'progress' | 'difficulty'>('recent');
  const [filterBy, setFilterBy] = useState<'all' | 'theory' | 'practical' | 'project'>('all');

  // Enhanced subjects with mock data
  const enhancedSubjects = useMemo(() => {
    return subjects.map((subject, index) => ({
      ...subject,
      description: subject.description || 
        `Master the fundamentals of ${subject.title.toLowerCase()} through hands-on exercises and real-world applications.`,
      difficulty: (['Beginner', 'Intermediate', 'Advanced'] as const)[index % 3],
      estimatedHours: Math.max(4, (subject.sectionCount || 5) * 0.75),
      type: (['theory', 'practical', 'project'] as const)[index % 3],
      completionRate: Math.floor(Math.random() * 100),
      isStarted: index < 3,
      isCompleted: index < 1
    }));
  }, [subjects]);

  // Filter and sort subjects
  const filteredSubjects = useMemo(() => {
    let filtered = enhancedSubjects;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(subject => 
        subject.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(subject => subject.type === filterBy);
    }

    // Sort
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'progress':
        filtered.sort((a, b) => b.completionRate - a.completionRate);
        break;
      case 'difficulty':
        const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
        filtered.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
        break;
      default: // recent
        // Keep original order for "recent"
        break;
    }

    return filtered;
  }, [enhancedSubjects, searchTerm, sortBy, filterBy]);

  const progressPercentage = Math.round((enrollmentData.completedHours / enrollmentData.totalHours) * 100);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-50 border-green-200';
      case 'Intermediate': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Advanced': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'theory': return BookOpen;
      case 'practical': return Code;
      case 'project': return Target;
      default: return BookOpen;
    }
  };

  return (
    <div className="space-y-8">
      {/* Course Header */}
      <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-8 backdrop-blur-xl shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Course Info */}
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {track?.title || 'Course Overview'}
                </h1>
                <p className="text-gray-600 leading-relaxed max-w-2xl">
                  {track?.description || 
                    'Comprehensive learning path designed to take you from fundamentals to advanced concepts through structured modules and hands-on practice.'}
                </p>
              </div>
            </div>

            {/* Course Meta */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{subjects.length} subjects</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>≈ {enrollmentData.totalHours} hours total</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>12,000+ enrolled</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>Certificate included</span>
              </div>
            </div>

            {/* Skills You'll Learn */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Skills You'll Learn
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Data Analysis', 'SQL Querying', 'Statistical Methods', 'Data Visualization', 'Python/R Programming', 'Business Intelligence'].map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Progress and Stats */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Your Progress
              </h3>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-1">
                    {progressPercentage}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {enrollmentData.completedHours} of {enrollmentData.totalHours} hours
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{width: `${progressPercentage}%`}}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Started</div>
                    <div className="font-semibold">{enrollmentData.enrolledDate}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Est. completion</div>
                    <div className="font-semibold">{enrollmentData.estimatedCompletion}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link 
                  href={`/curriculum/${courseId}/${subjects[0]?.id || ''}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <PlayCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Continue Learning</div>
                    <div className="text-xs text-gray-600">Resume where you left off</div>
                  </div>
                </Link>
                <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Download Materials</div>
                    <div className="text-xs text-gray-600">Study guides and resources</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Path Schedule */}
      <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-amber-50/80 to-orange-50/80 p-6 backdrop-blur-xl border-amber-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Create Learning Schedule</h3>
              <p className="text-sm text-amber-700">
                Set aside dedicated time for learning. Consistent practice leads to better outcomes.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
              Set Schedule
            </button>
            <button className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors text-sm">
              Later
            </button>
          </div>
        </div>
      </div>

      {/* Controls and Filters */}
      <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="recent">Recently Accessed</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="progress">Progress</option>
                <option value="difficulty">Difficulty</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Filter by:</label>
              <select 
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="all">All Types</option>
                <option value="theory">Theory</option>
                <option value="practical">Practical</option>
                <option value="project">Projects</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subjects Grid/List */}
      <div className={viewMode === 'grid' ? 
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : 
        "space-y-4"
      }>
        {filteredSubjects.map((subject) => {
          const TypeIcon = getTypeIcon(subject.type);
          
          // Helper function to slugify titles for URL-friendly names
          const slugify = (text: string): string => {
            return text
              .toLowerCase()
              .trim()
              .replace(/[^\w\s-]/g, '') // Remove non-word chars
              .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with single dash
              .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
          };

          if (viewMode === 'list') {
            return (
              <Link
                key={subject.id}
                href={`/curriculum/${courseId}/${encodeURIComponent(slugify(subject.title))}`}
                className="group block"
              >
                <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-6 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-start gap-6">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {subject.isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : subject.isStarted ? (
                        <PlayCircle className="h-6 w-6 text-blue-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {subject.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(subject.difficulty)}`}>
                          {subject.difficulty}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {subject.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <TypeIcon className="h-3 w-3" />
                            <span>{subject.moduleCount || 0} modules</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>≈ {subject.estimatedHours}h</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {subject.completionRate > 0 && (
                            <div className="text-xs text-gray-600">
                              {subject.completionRate}% complete
                            </div>
                          )}
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          }

          // Grid view
          return (
            <Link
              key={subject.id}
              href={`/curriculum/${courseId}/${encodeURIComponent(slugify(subject.title))}`}
              className="group block"
            >
              <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all overflow-hidden">
                {/* Image/Icon Area */}
                <div className="aspect-[16/9] bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <TypeIcon className="h-12 w-12 text-indigo-600" />
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {subject.title}
                    </h3>
                    {subject.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                    ) : subject.isStarted ? (
                      <PlayCircle className="h-5 w-5 text-blue-500 flex-shrink-0 ml-2" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {subject.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{subject.moduleCount || 0} modules</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>≈ {subject.estimatedHours}h</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(subject.difficulty)}`}>
                        {subject.difficulty}
                      </span>
                    </div>

                    {subject.completionRate > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{subject.completionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all"
                            style={{width: `${subject.completionRate}%`}}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {filteredSubjects.length === 0 && (
          <div className="col-span-full">
            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 p-12 backdrop-blur-xl text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No subjects found</h3>
              <p className="text-gray-600">
                {searchTerm ? 
                  "Try adjusting your search terms or filters." : 
                  "This course doesn't have any subjects yet."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
