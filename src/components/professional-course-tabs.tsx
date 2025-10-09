"use client";

import { useMemo, useState } from "react";
import { BookOpen, Code, HelpCircle, MessageCircle, User, Send, CheckSquare, FileText, Play } from "lucide-react";

type Comment = {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  replies?: Comment[];
};

export function ProfessionalCourseTabs({
  courseHrefBase,
  sectionId,
  sectionTitle,
  section,
  courseId,
  subjectId,
  trackTitle,
  subjectTitle: subjectTitleProp,
}: {
  courseHrefBase: string;
  sectionId?: string;
  sectionTitle?: string;
  section?: any;
  courseId?: string;
  subjectId?: string;
  trackTitle?: string;
  subjectTitle?: string;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "exercise" | "quiz" | "discussion">("overview");
  const [practiceExercises, setPracticeExercises] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // API functions
  const generatePracticeExercises = async () => {
    if (!sectionId || !courseId || !subjectId) return;
    
    setLoadingExercises(true);
    try {
      const response = await fetch(`/api/v1/sections/${sectionId}/generate-exercises`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          subjectId,
          sectionTitle,
          difficulty: 'Intermediate',
          exerciseCount: 3,
          exerciseTypes: ['sql', 'python']
        }),
      });
      
      if (response.ok) {
        const exercises = await response.json();
        setPracticeExercises(exercises);
      }
    } catch (error) {
      console.error('Error generating exercises:', error);
    } finally {
      setLoadingExercises(false);
    }
  };

  const generateQuiz = async () => {
    if (!sectionId || !courseId || !subjectId) return;
    
    setLoadingQuizzes(true);
    try {
      // console.log('Generating quiz for section:', sectionId);
      const response = await fetch(`/api/v1/sections/${sectionId}/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          subjectId,
          sectionTitle,
          difficulty: 'Intermediate',
          questionCount: 5,
          questionTypes: ['multiple_choice', 'true_false']
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Quiz generation failed:', response.status, errorText);
        throw new Error(`Failed to generate quiz: ${response.status}`);
      }
      
      const result = await response.json();
      // console.log('Quiz generation response:', result);
      
      // The response should contain quiz data
      const quiz = result.quiz || result;
      
      if (quiz && quiz.id) {
        // Fetch the full quiz with questions and options
        // console.log('Fetching full quiz data for quiz ID:', quiz.id);
        const quizResponse = await fetch(`/api/v1/quizzes/${quiz.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (quizResponse.ok) {
          const fullQuiz = await quizResponse.json();
          // console.log('Full quiz data loaded:', fullQuiz);
          setQuizzes([fullQuiz]);
        } else {
          // If fetching full quiz fails, use the generated quiz data
          console.warn('Could not fetch full quiz, using generated data');
          setQuizzes([quiz]);
        }
      } else {
        console.error('Invalid quiz response:', result);
        throw new Error('Quiz generated but no ID returned');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Failed to generate quiz. Please check the console for details.');
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const loadExistingExercises = async () => {
    if (!sectionId) return;
    
    try {
      const response = await fetch(`/api/v1/sections/${sectionId}/exercises`);
      if (response.ok) {
        const exercises = await response.json();
        setPracticeExercises(exercises);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const loadExistingQuizzes = async () => {
    if (!sectionId) return;
    
    try {
      const response = await fetch(`/api/v1/sections/${sectionId}/quizzes`);
      if (response.ok) {
        const quizzes = await response.json();
        setQuizzes(quizzes);
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
    }
  };

  // Load existing content when section changes
  useMemo(() => {
    if (sectionId) {
      loadExistingExercises();
      loadExistingQuizzes();
    }
  }, [sectionId]);

  // Enhanced discussion threads
  const [threads, setThreads] = useState<Comment[]>([
    {
      id: "t1",
      author: "Sarah Chen",
      timestamp: "2 hours ago",
      text: "Could someone help me understand the difference between INNER JOIN and LEFT JOIN? The examples in the lesson were helpful, but I'd like to see a few more real-world scenarios.",
      replies: [
        { 
          id: "r1", 
          author: "Dr. Martinez (Instructor)", 
          timestamp: "1 hour ago",
          text: "Great question! INNER JOIN returns only matching records from both tables, while LEFT JOIN returns all records from the left table plus matching records from the right table. I'll add some additional examples to the next lesson."
        },
        {
          id: "r2",
          author: "Mike Johnson",
          timestamp: "45 minutes ago", 
          text: "I found it helpful to think of LEFT JOIN as keeping everything from the 'main' table and adding information from the second table when available."
        }
      ],
    },
    {
      id: "t2",
      author: "Alex Rodriguez",
      timestamp: "5 hours ago",
      text: "The practice exercise was challenging! Does anyone have tips for optimizing complex queries with multiple joins?",
      replies: [
        {
          id: "r3",
          author: "Emma Thompson",
          timestamp: "3 hours ago",
          text: "Start with the smallest table as your base and make sure you have proper indexes on the join columns. Also, try to filter data early in your WHERE clause."
        }
      ],
    },
  ]);

  const tabs = [
    { 
      id: "overview", 
      label: "Overview", 
      icon: BookOpen,
      description: "Lesson content and materials"
    },
    { 
      id: "discussion", 
      label: "Discussion", 
      icon: MessageCircle,
      description: "Q&A and peer interaction"
    },
    { 
      id: "feedback", 
      label: "Feedback", 
      icon: MessageCircle,
      description: "Feedback"
    },
  ];

  function addComment(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    
    const newComment: Comment = {
      id: crypto.randomUUID(),
      author: "You",
      timestamp: "just now",
      text: trimmed,
      replies: []
    };
    
    setThreads(prev => [newComment, ...prev]);
  }

  function addReply(commentId: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    
    const newReply = {
      id: crypto.randomUUID(),
      author: "You",
      timestamp: "just now",
      text: trimmed
    };
    
    setThreads(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? { ...comment, replies: [...(comment.replies || []), newReply] }
          : comment
      )
    );
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl shadow-lg overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200/50 p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-sm text-gray-600">
          {tabs.find(t => t.id === activeTab)?.description}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Lesson Overview</h3>
                <p className="text-sm text-gray-600">{sectionTitle || "Current lesson content"}</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3">Learning Objectives</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <span>Understand the core concepts and principles covered in this lesson</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <span>Apply the learned techniques to practical scenarios</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <span>Complete practice exercises to reinforce understanding</span>
                </li>
              </ul>
            </div>

            {/* Additional Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Study Notes</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Downloadable summary of key concepts</p>
                <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Download PDF</button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Video Transcript</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Full text transcript of the video lesson</p>
                <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View Transcript</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "discussion" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Discussion Forum</h3>
                <p className="text-sm text-gray-600">Ask questions and share insights</p>
              </div>
            </div>

            {/* Add New Discussion */}
            <DiscussionForm onSubmit={addComment} />

            {/* Discussion Threads */}
            <div className="space-y-4">
              {threads.map((thread) => (
                <DiscussionThread 
                  key={thread.id} 
                  thread={thread} 
                  onReply={(text) => addReply(thread.id, text)} 
                />
              ))}
              
              {threads.length === 0 && (
                <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 mb-2">Start the Discussion</h4>
                  <p className="text-sm text-gray-600">
                    Be the first to ask a question or share your thoughts about this lesson.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DiscussionForm({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");
  
  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text);
      setText("");
    }
  };

  return (
    <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-orange-600" />
        </div>
        <div className="flex-1 space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask a question, share an insight, or help a fellow student..."
            className="w-full h-20 p-3 border border-orange-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              Post Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscussionThread({ 
  thread, 
  onReply 
}: { 
  thread: Comment; 
  onReply: (text: string) => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  
  const handleReply = () => {
    if (replyText.trim()) {
      onReply(replyText);
      setReplyText("");
      setShowReplyForm(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-gray-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900">{thread.author}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">{thread.timestamp}</span>
          </div>
          <p className="text-gray-800 mb-3 leading-relaxed">{thread.text}</p>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Reply
            </button>
            <span className="text-xs text-gray-500">
              {(thread.replies || []).length} {(thread.replies || []).length === 1 ? 'reply' : 'replies'}
            </span>
          </div>
        </div>
      </div>

      {/* Replies */}
      {(thread.replies || []).length > 0 && (
        <div className="mt-4 ml-11 space-y-3">
          {(thread.replies || []).map((reply) => (
            <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-gray-900">{reply.author}</span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">{reply.timestamp}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{reply.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply Form */}
      {showReplyForm && (
        <div className="mt-4 ml-11">
          <div className="bg-gray-50 rounded-lg p-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              className="w-full h-16 p-2 border border-gray-200 rounded resize-none text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyText("");
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={!replyText.trim()}
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}