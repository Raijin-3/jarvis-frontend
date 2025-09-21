"use client";

import React, { useState, useEffect } from 'react';
import { 
  Target, 
  CheckCircle, 
  Clock, 
  Star, 
  Zap, 
  BookOpen, 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  Award,
  Sparkles,
  Brain,
  Flame,
  Trophy,
  Users,
  Lightbulb,
  Timer,
  BarChart3
} from 'lucide-react';
import { useGamification } from './gamification-provider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const difficultyColors = {
  easy: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  hard: 'bg-red-100 text-red-800 border-red-200',
};

const challengeTypeConfig = {
  quiz_completion: { 
    icon: Target, 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-50',
    label: 'Quiz Challenge'
  },
  time_spent: { 
    icon: Clock, 
    color: 'text-green-500', 
    bgColor: 'bg-green-50',
    label: 'Focus Time'
  },
  course_progress: { 
    icon: BookOpen, 
    color: 'text-purple-500', 
    bgColor: 'bg-purple-50',
    label: 'Learning Progress'
  },
  streak_maintain: { 
    icon: Flame, 
    color: 'text-orange-500', 
    bgColor: 'bg-orange-50',
    label: 'Streak Power'
  },
  perfect_score: { 
    icon: Award, 
    color: 'text-yellow-500', 
    bgColor: 'bg-yellow-50',
    label: 'Perfectionist'
  },
  subject_diversity: { 
    icon: TrendingUp, 
    color: 'text-indigo-500', 
    bgColor: 'bg-indigo-50',
    label: 'Explorer'
  },
  weekend_bonus: { 
    icon: Calendar, 
    color: 'text-pink-500', 
    bgColor: 'bg-pink-50',
    label: 'Weekend Warrior'
  },
  peer_competition: { 
    icon: Users, 
    color: 'text-cyan-500', 
    bgColor: 'bg-cyan-50',
    label: 'Social Challenge'
  },
  recovery_gentle: { 
    icon: Sparkles, 
    color: 'text-emerald-500', 
    bgColor: 'bg-emerald-50',
    label: 'Welcome Back'
  },
  achievement_hunter: { 
    icon: Trophy, 
    color: 'text-amber-500', 
    bgColor: 'bg-amber-50',
    label: 'Achievement Hunt'
  },
  skill_optimization: { 
    icon: Brain, 
    color: 'text-violet-500', 
    bgColor: 'bg-violet-50',
    label: 'Skill Builder'
  },
  morning_boost: { 
    icon: Timer, 
    color: 'text-rose-500', 
    bgColor: 'bg-rose-50',
    label: 'Morning Energy'
  }
};

export function DynamicChallengeWidget() {
  const { dailyChallenges, isLoading, updateChallengeProgress, refreshChallenges } = useGamification();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [personalizedInsights, setPersonalizedInsights] = useState<any[]>([]);

  useEffect(() => {
    // Generate personalized insights based on challenges
    if (dailyChallenges && dailyChallenges.length > 0) {
      const insights = generateChallengeInsights(dailyChallenges);
      setPersonalizedInsights(insights);
    }
  }, [dailyChallenges]);

  const generateChallengeInsights = (challenges: any[]) => {
    const insights = [];
    const completedCount = challenges.filter(c => c.progress?.completed_at).length;
    const totalChallenges = challenges.length;
    
    if (completedCount === totalChallenges && totalChallenges > 0) {
      insights.push({
        type: 'celebration',
        icon: Trophy,
        message: 'Challenge Champion! All daily challenges completed! 🎉',
        color: 'text-yellow-600'
      });
    } else if (completedCount >= totalChallenges * 0.75) {
      insights.push({
        type: 'encouragement',
        icon: Flame,
        message: `You're on fire! ${completedCount}/${totalChallenges} challenges done!`,
        color: 'text-orange-600'
      });
    }

    // Check for personalized challenge types
    const hasPersonalizedChallenges = challenges.some(c => 
      c.metadata?.personalization_level === 'high' || 
      c.personalizationFactors?.length > 0
    );
    
    if (hasPersonalizedChallenges) {
      insights.push({
        type: 'personalization',
        icon: Sparkles,
        message: 'These challenges are tailored just for you based on your learning patterns!',
        color: 'text-purple-600'
      });
    }

    return insights;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded animate-pulse"></div>
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
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <Lightbulb className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold">Smart Challenges Loading...</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Our AI is analyzing your learning patterns to create personalized challenges that match your goals and preferences.
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
                Generating Smart Challenges...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate My Challenges
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  const completedCount = dailyChallenges.filter(c => c.progress?.completed_at).length;
  const totalPoints = dailyChallenges.reduce((sum, c) => sum + (c.progress?.points_earned || 0), 0);
  const completionRate = (completedCount / dailyChallenges.length) * 100;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header with dynamic insights */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Smart Daily Challenges</h3>
              <p className="text-sm text-muted-foreground">AI-powered personal challenges</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              {completedCount} / {dailyChallenges.length} completed
            </Badge>
            {totalPoints > 0 && (
              <div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                <Star className="h-4 w-4" />
                +{totalPoints} XP
              </div>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefreshChallenges}
              disabled={isRefreshing}
              className="h-8 px-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Daily Progress</span>
            <span className="font-medium">{Math.round(completionRate)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Personalized Insights */}
        {personalizedInsights.length > 0 && (
          <div className="space-y-2">
            {personalizedInsights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <div key={index} className={`flex items-center gap-2 text-sm p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200`}>
                  <Icon className={`h-4 w-4 ${insight.color}`} />
                  <span className="text-gray-700">{insight.message}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Challenge Info */}
        <div className="text-xs text-muted-foreground bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-blue-700">Adaptive Intelligence</span>
          </div>
          <p className="text-blue-600">
            These challenges adapt to your learning style, performance patterns, and goals. 
            They become more personalized as you engage more with the platform!
          </p>
        </div>

        {/* Challenge Cards */}
        <div className="space-y-3">
          {dailyChallenges.map((challenge) => (
            <EnhancedChallengeCard
              key={challenge.id}
              challenge={challenge}
              onProgressUpdate={(increment) => 
                updateChallengeProgress(challenge.id, increment)
              }
            />
          ))}
        </div>

        {/* Motivational Footer */}
        {completedCount === dailyChallenges.length && (
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex justify-center mb-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            <h4 className="font-semibold text-green-800 mb-1">All Challenges Complete!</h4>
            <p className="text-sm text-green-600">
              Outstanding work! Come back tomorrow for fresh personalized challenges.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

interface EnhancedChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    challenge_type: string;
    target_value: number;
    points_reward: number;
    difficulty_level: string;
    metadata?: any;
    personalizationFactors?: string[];
    expectedEngagement?: number;
    progress?: {
      current_progress: number;
      completed_at: string | null;
      points_earned: number;
    };
  };
  onProgressUpdate: (increment: number) => void;
}

function EnhancedChallengeCard({ challenge, onProgressUpdate }: EnhancedChallengeCardProps) {
  const currentProgress = challenge.progress?.current_progress || 0;
  const isCompleted = !!challenge.progress?.completed_at;
  const progressPercent = Math.min(100, Math.max(0, (currentProgress / challenge.target_value) * 100));
  
  const config = challengeTypeConfig[challenge.challenge_type as keyof typeof challengeTypeConfig] || {
    icon: Target,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    label: 'Challenge'
  };

  const Icon = config.icon;
  const isPersonalized = challenge.personalizationFactors && challenge.personalizationFactors.length > 0;
  const isHighEngagement = (challenge.expectedEngagement || 0) > 0.7;

  const handleQuickProgress = () => {
    if (!isCompleted && currentProgress < challenge.target_value) {
      onProgressUpdate(1);
    }
  };

  return (
    <div className={`
      rounded-lg border transition-all hover:shadow-lg group
      ${isCompleted 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
        : 'bg-white border-gray-200 hover:border-gray-300'
      }
    `}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Challenge Icon */}
          <div className={`
            p-3 rounded-xl flex-shrink-0 transition-all
            ${isCompleted 
              ? 'bg-green-500 text-white shadow-lg' 
              : `${config.bgColor} ${config.color} group-hover:shadow-md`
            }
          `}>
            {isCompleted ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <Icon className="h-5 w-5" />
            )}
          </div>

          {/* Challenge Content */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{challenge.title}</h4>
                  {isPersonalized && (
                    <Sparkles className="h-3 w-3 text-purple-500" title="Personalized for you!" />
                  )}
                  {isHighEngagement && (
                    <Flame className="h-3 w-3 text-orange-500" title="High engagement challenge!" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{challenge.description}</p>
                <Badge variant="secondary" className="text-xs">
                  {config.label}
                </Badge>
              </div>
              <div className="text-right space-y-1">
                <Badge 
                  className={`text-xs border ${difficultyColors[challenge.difficulty_level as keyof typeof difficultyColors]}`}
                >
                  {challenge.difficulty_level}
                </Badge>
                <div className="text-xs font-medium flex items-center gap-1 justify-end">
                  <Star className="h-3 w-3 text-yellow-500" />
                  {challenge.points_reward} XP
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Progress: {currentProgress} / {challenge.target_value}
                </span>
                <span className="text-muted-foreground">
                  {Math.round(progressPercent)}% complete
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Action Section */}
            <div className="flex items-center justify-between pt-1">
              {!isCompleted ? (
                <button
                  onClick={handleQuickProgress}
                  className={`
                    text-xs px-4 py-2 rounded-lg transition-all font-medium
                    ${config.bgColor} ${config.color} hover:shadow-md
                  `}
                >
                  {getActionText(challenge.challenge_type)}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  <span>Completed! +{challenge.progress?.points_earned} XP earned</span>
                </div>
              )}

              {/* Personalization Indicators */}
              {isPersonalized && (
                <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  Tailored for you
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getActionText(challengeType: string): string {
  const actionTexts = {
    quiz_completion: 'Complete Quiz',
    time_spent: 'Log Study Time',
    course_progress: 'Mark Section Done',
    perfect_score: 'Achieve Perfect Score',
    subject_diversity: 'Explore New Subject',
    weekend_bonus: 'Weekend Learning',
    streak_maintain: 'Continue Streak',
    peer_competition: 'Beat Peer Average',
    recovery_gentle: 'Gentle Progress',
    achievement_hunter: 'Hunt Achievement',
    skill_optimization: 'Build Skill',
    morning_boost: 'Morning Progress'
  };

  return actionTexts[challengeType as keyof typeof actionTexts] || 'Update Progress';
}