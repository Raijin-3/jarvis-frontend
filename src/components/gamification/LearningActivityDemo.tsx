'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  HelpCircle, 
  Play, 
  CheckCircle, 
  Trophy, 
  Target,
  Clock,
  Star
} from 'lucide-react';
import { recordActivity, recordAssessmentCompletion, recordCourseProgress, recordContentViewing, getCurrentUserId } from '@/lib/gamification';
import { toast } from 'sonner';

interface Activity {
  id: string;
  type: 'lecture' | 'quiz' | 'course' | 'section';
  title: string;
  description: string;
  duration?: number;
  points: number;
  completed: boolean;
}

const sampleActivities: Activity[] = [
  {
    id: 'lecture-1',
    type: 'lecture',
    title: 'Introduction to React Hooks',
    description: 'Learn the basics of useState and useEffect',
    duration: 15,
    points: 5,
    completed: false,
  },
  {
    id: 'quiz-1',
    type: 'quiz',
    title: 'React Hooks Quiz',
    description: 'Test your knowledge of React Hooks',
    points: 25,
    completed: false,
  },
  {
    id: 'section-1',
    type: 'section',
    title: 'Complete React Fundamentals Section',
    description: 'Finish all lessons in the React fundamentals section',
    points: 20,
    completed: false,
  },
  {
    id: 'course-1',
    type: 'course',
    title: 'Complete React Course',
    description: 'Finish the entire React mastery course',
    points: 100,
    completed: false,
  }
];

export function LearningActivityDemo() {
  const [activities, setActivities] = useState<Activity[]>(sampleActivities);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPoints: 0,
    activitiesCompleted: 0,
    currentStreak: 0,
  });

  const userId = getCurrentUserId() || 'test-user-123';

  const completeActivity = useCallback(async (activity: Activity) => {
    if (activity.completed || isLoading) return;
    
    setIsLoading(activity.id);
    
    try {
      // Record different types of activities
      switch (activity.type) {
        case 'lecture':
          await recordContentViewing(userId, activity.id, 'lecture', activity.duration || 10);
          toast.success(`📚 Watched "${activity.title}" - earned ${activity.points} points!`);
          break;
          
        case 'quiz':
          const quizResult = {
            score: Math.floor(Math.random() * 20) + 80, // 80-100%
            maxScore: 100,
            timeSpent: Math.floor(Math.random() * 300) + 120, // 2-7 minutes
            completed: true
          };
          await recordAssessmentCompletion(userId, activity.id, quizResult);
          
          if (quizResult.score === 100) {
            toast.success(`🎯 Perfect score on "${activity.title}"! Earned ${activity.points + 50} points!`, {
              description: 'Bonus points for perfect score!'
            });
          } else {
            toast.success(`✅ Completed "${activity.title}" - earned ${activity.points} points!`);
          }
          break;
          
        case 'section':
          await recordCourseProgress(userId, 'react-course', activity.id, 'section_completed', 45);
          toast.success(`📖 Completed section "${activity.title}" - earned ${activity.points} points!`);
          break;
          
        case 'course':
          await recordCourseProgress(userId, activity.id, activity.id, 'completed');
          toast.success(`🏆 Course completed! "${activity.title}" - earned ${activity.points} points!`, {
            description: 'Achievement unlocked: Course Conqueror!'
          });
          break;
      }
      
      // Update local state
      setActivities(prev => 
        prev.map(a => 
          a.id === activity.id 
            ? { ...a, completed: true }
            : a
        )
      );
      
      // Update stats
      setStats(prev => ({
        totalPoints: prev.totalPoints + activity.points,
        activitiesCompleted: prev.activitiesCompleted + 1,
        currentStreak: prev.currentStreak + (Math.random() > 0.7 ? 1 : 0), // Sometimes increase streak
      }));
      
    } catch (error) {
      console.error('Failed to complete activity:', error);
      toast.error('Failed to record activity completion');
    } finally {
      setIsLoading(null);
    }
  }, [userId, isLoading]);

  const resetDemo = useCallback(() => {
    setActivities(sampleActivities.map(a => ({ ...a, completed: false })));
    setStats({
      totalPoints: 0,
      activitiesCompleted: 0,
      currentStreak: 0,
    });
    toast.info('Demo reset - try completing activities again!');
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lecture': return <BookOpen className="w-5 h-5" />;
      case 'quiz': return <HelpCircle className="w-5 h-5" />;
      case 'section': return <Target className="w-5 h-5" />;
      case 'course': return <Trophy className="w-5 h-5" />;
      default: return <Play className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-500';
      case 'quiz': return 'bg-purple-500';
      case 'section': return 'bg-green-500';
      case 'course': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Learning Progress
          </CardTitle>
          <CardDescription>
            Complete activities to earn points and test the gamification system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalPoints}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activitiesCompleted}</div>
              <div className="text-sm text-gray-600">Activities Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.currentStreak}</div>
              <div className="text-sm text-gray-600">Streak Days</div>
            </div>
          </div>
          <Progress 
            value={(stats.activitiesCompleted / activities.length) * 100} 
            className="mb-2"
          />
          <div className="text-center text-sm text-gray-600">
            {stats.activitiesCompleted} of {activities.length} activities completed
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Learning Activities</h3>
          <Button 
            onClick={resetDemo} 
            variant="outline" 
            size="sm"
            className="text-gray-600"
          >
            Reset Demo
          </Button>
        </div>
        
        {activities.map((activity) => (
          <Card 
            key={activity.id} 
            className={`transition-all duration-300 ${
              activity.completed 
                ? 'bg-green-50 border-green-200 shadow-md' 
                : 'hover:shadow-md'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${getActivityColor(activity.type)} text-white`}>
                    {activity.completed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      getActivityIcon(activity.type)
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${activity.completed ? 'line-through text-gray-600' : ''}`}>
                      {activity.title}
                    </h4>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {activity.duration && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {activity.duration}min
                        </div>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {activity.points} points
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {activity.type}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => completeActivity(activity)}
                  disabled={activity.completed || isLoading === activity.id}
                  className={`min-w-[100px] ${
                    activity.completed 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : ''
                  }`}
                  variant={activity.completed ? 'default' : 'outline'}
                >
                  {isLoading === activity.id ? (
                    'Recording...'
                  ) : activity.completed ? (
                    'Completed'
                  ) : (
                    'Complete'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to Test</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click "Complete" on any activity to simulate learning progress</li>
            <li>• Different activity types award different points and trigger different achievements</li>
            <li>• Perfect quiz scores (random chance) award bonus points</li>
            <li>• Check the gamification components above to see real-time updates</li>
            <li>• Use "Reset Demo" to test multiple times</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}