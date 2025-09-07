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
}: {
  courseHrefBase: string;
  sectionId?: string;
  sectionTitle?: string;
  section?: any;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "exercise" | "quiz" | "discussion">("overview");

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
      id: "exercise", 
      label: "Practice", 
      icon: Code,
      description: "Hands-on exercises"
    },
    { 
      id: "quiz", 
      label: "Assessment", 
      icon: CheckSquare,
      description: "Test your knowledge"
    },
    { 
      id: "discussion", 
      label: "Discussion", 
      icon: MessageCircle,
      description: "Q&A and peer interaction"
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

        {activeTab === "exercise" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Code className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Practice Exercise</h3>
                <p className="text-sm text-gray-600">Apply what you've learned</p>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h4 className="font-medium text-green-900 mb-3">Exercise Instructions</h4>
              <p className="text-sm text-green-800 mb-4">
                {Array.isArray(section?.exercises) && section.exercises.length
                  ? section.exercises[0].title || "Complete the coding exercise below using the concepts learned in this lesson."
                  : "Complete the coding exercise below using the concepts learned in this lesson."}
              </p>
              
              <div className="bg-white rounded-lg border border-green-200 overflow-hidden">
                <div className="bg-green-100 px-4 py-2 border-b border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">SQL Editor</span>
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <span>Press Ctrl+Enter to run</span>
                    </div>
                  </div>
                </div>
                
                <textarea 
                  className="w-full h-48 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset" 
                  placeholder="-- Write your SQL query here
SELECT * FROM table_name
WHERE condition = 'value';"
                />
                
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center">
                  <div className="text-xs text-gray-600">
                    Tip: Use proper indentation and semicolons
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                      Run Query
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                      Submit Answer
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Query Results</h4>
              <div className="text-sm text-gray-600 italic">
                Run your query to see results here...
              </div>
            </div>
          </div>
        )}

        {activeTab === "quiz" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Knowledge Assessment</h3>
                <p className="text-sm text-gray-600">Test your understanding</p>
              </div>
            </div>

            {Array.isArray(section?.quizzes) && section.quizzes.length ? (
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-4">
                  {section.quizzes[0].title || 'Knowledge Check'}
                </h4>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-gray-800 mb-3">
                      Which SQL clause is used to filter records in a query?
                    </p>
                    <div className="space-y-2">
                      {['SELECT', 'WHERE', 'FROM', 'ORDER BY'].map((option, idx) => (
                        <label key={idx} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="quiz1" value={option} className="text-purple-600" />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-purple-700">
                      Question 1 of {section.quizzes[0].questions || 5}
                    </div>
                    <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      Submit Answer
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">Assessment Coming Soon</h4>
                <p className="text-sm text-gray-600">
                  Complete the lesson content to unlock the knowledge assessment.
                </p>
              </div>
            )}
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