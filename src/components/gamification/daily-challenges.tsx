"use client";

import React, { useState } from 'react';
import { Target, CheckCircle, Clock, Star, Zap, BookOpen, RefreshCw, Calendar, TrendingUp, Award } from 'lucide-react';
import { useGamification } from './gamification-provider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};

const challengeTypeIcons = {
  quiz_completion: <Target className="h-4 w-4" />,
  time_spent: <Clock className="h-4 w-4" />,
  course_progress: <BookOpen className="h-4 w-4" />,
  streak_maintain: <Zap className="h-4 w-4" />,
  perfect_score: <Award className="h-4 w-4" />,
  subject_diversity: <TrendingUp className="h-4 w-4" />,
  weekend_bonus: <Calendar className="h-4 w-4" />,
};

export function DailyChallenges() {
  const { dailyChallenges, isLoading, updateChallengeProgress, refreshChallenges } = useGamification();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const handleRefreshChallenges = async () => {
    setIsRefreshing(true);
    try {
      await refreshChallenges();
    } catch (error) {
      console.error('Failed to refresh challenges:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!dailyChallenges || dailyChallenges.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <Target className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold">No challenges today</h3>
          <p className="text-muted-foreground">
            Don't worry! New personalized challenges are generated based on your activity.
          </p>
          <Button
            onClick={handleRefreshChallenges}
            disabled={isRefreshing}
            className="mt-4"
            variant="outline"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Challenges
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  const completedCount = dailyChallenges.filter(c => c.progress?.completed_at).length;
  const totalPoints = dailyChallenges.reduce((sum, c) => sum + (c.progress?.points_earned || 0), 0);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Daily Challenges</h3>
            <Badge variant="secondary" className="text-xs">
              {completedCount} / {dailyChallenges.length} completed
            </Badge>
          </div>
          
          {dailyChallenges.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {totalPoints > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  +{totalPoints} XP earned
                </span>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefreshChallenges}
                disabled={isRefreshing}
                className="h-6 px-2"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          )}
        </div>

        {/* Dynamic Challenge Info */}
        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <Zap className="h-3 w-3 text-blue-500" />
            <span className="font-medium">Smart Challenges</span>
          </div>
          <p>These challenges are personalized based on your level, activity, and goals. They update daily to keep you engaged!</p>
        </div>

        <div className="space-y-3">
          {dailyChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onProgressUpdate={(increment) => 
                updateChallengeProgress(challenge.id, increment)
              }
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

interface ChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    challenge_type: string;
    target_value: number;
    points_reward: number;
    difficulty_level: string;
    progress?: {
      current_progress: number;
      completed_at: string | null;
      points_earned: number;
    };
  };
  onProgressUpdate: (increment: number) => void;
}

function ChallengeCard({ challenge, onProgressUpdate }: ChallengeCardProps) {
  const currentProgress = challenge.progress?.current_progress || 0;
  const isCompleted = !!challenge.progress?.completed_at;
  const progressPercent = Math.min(100, Math.max(0, (currentProgress / challenge.target_value) * 100));

  const handleQuickProgress = () => {
    if (!isCompleted && currentProgress < challenge.target_value) {
      onProgressUpdate(1);
    }
  };

  return (
    <div className={`
      rounded-lg border p-4 transition-all hover:shadow-md
      ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}
    `}>
      <div className="flex items-start gap-3">
        <div className={`
          p-2 rounded-lg flex-shrink-0
          ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}
        `}>
          {isCompleted ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            challengeTypeIcons[challenge.challenge_type as keyof typeof challengeTypeIcons] || 
            <Target className="h-4 w-4" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-sm">{challenge.title}</h4>
              <p className="text-xs text-muted-foreground">{challenge.description}</p>
            </div>
            <div className="text-right">
              <Badge 
                className={`text-xs ${difficultyColors[challenge.difficulty_level as keyof typeof difficultyColors]}`}
              >
                {challenge.difficulty_level}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Progress: {currentProgress} / {challenge.target_value}
              </span>
              <span className="font-medium flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                {challenge.points_reward} XP
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Button */}
          {!isCompleted && (
            <button
              onClick={handleQuickProgress}
              className="text-xs px-3 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            >
              {challenge.challenge_type === 'quiz_completion' && 'Mark Quiz Complete'}
              {challenge.challenge_type === 'time_spent' && 'Log Study Time'}
              {challenge.challenge_type === 'course_progress' && 'Mark Section Done'}
              {challenge.challenge_type === 'perfect_score' && 'Mark Perfect Score'}
              {challenge.challenge_type === 'subject_diversity' && 'Mark Subject Explored'}
              {challenge.challenge_type === 'weekend_bonus' && 'Log Weekend Learning'}
              {!['quiz_completion', 'time_spent', 'course_progress', 'perfect_score', 'subject_diversity', 'weekend_bonus'].includes(challenge.challenge_type) && 'Update Progress'}
            </button>
          )}

          {isCompleted && (
            <div className="flex items-center gap-2 text-xs text-green-700">
              <CheckCircle className="h-3 w-3" />
              <span>Completed! +{challenge.progress?.points_earned} XP earned</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}