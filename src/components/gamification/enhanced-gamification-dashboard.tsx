"use client";

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  TrendingUp, 
  Calendar,
  Award,
  Users,
  Brain,
  Sparkles,
  BarChart3,
  Clock,
  Flame,
  Gift,
  Medal,
  Crown,
  Lightbulb,
  Timer
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGamification } from './gamification-provider';
import { DynamicChallengeWidget } from './dynamic-challenge-widget';

interface DynamicInsight {
  type: 'achievement' | 'streak' | 'improvement' | 'social' | 'motivation';
  title: string;
  message: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EnhancedGamificationDashboard() {
  const { stats, achievements, badges, insights, isLoading } = useGamification();
  const [dynamicInsights, setDynamicInsights] = useState<DynamicInsight[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);

  useEffect(() => {
    if (stats && achievements) {
      generateDynamicInsights();
      calculateCurrentMultiplier();
    }
  }, [stats, achievements]);

  const generateDynamicInsights = () => {
    const insights: DynamicInsight[] = [];
    
    if (!stats) return;

    // Streak-based insights
    if (stats.current_streak > 7) {
      insights.push({
        type: 'streak',
        title: 'Streak Master! 🔥',
        message: `You're on a ${stats.current_streak}-day streak! Your dedication is paying off with bonus rewards.`,
        icon: Flame,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        action: {
          label: 'Keep the streak alive!',
          onClick: () => console.log('Navigate to today\'s activities')
        }
      });
    }

    // Level progression insight
    const nextLevelPoints = calculateNextLevelPoints(stats.current_level);
    const pointsToNext = nextLevelPoints - stats.total_points;
    if (pointsToNext > 0 && pointsToNext <= 100) {
      insights.push({
        type: 'achievement',
        title: 'Level Up Soon! ⭐',
        message: `Only ${pointsToNext} XP until Level ${stats.current_level + 1}! You're almost there!`,
        icon: Crown,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      });
    }

    // Recent achievement insight
    if (achievements && achievements.length > 0) {
      const recentAchievement = achievements[0];
      insights.push({
        type: 'achievement',
        title: 'Recent Achievement Unlocked! 🏆',
        message: `"${recentAchievement.achievement.display_name}" - ${recentAchievement.achievement.description}`,
        icon: Trophy,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      });
    }

    // Performance insight
    if (stats.total_points > stats.current_level * 300) {
      insights.push({
        type: 'improvement',
        title: 'Outstanding Performance! 📈',
        message: 'You\'re earning points faster than average! Your learning efficiency is improving.',
        icon: TrendingUp,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      });
    }

    // Social motivation
    insights.push({
      type: 'social',
      title: 'Community Challenge 👥',
      message: 'Join your peers in this week\'s learning challenge. Compete and learn together!',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: {
        label: 'View Leaderboard',
        onClick: () => console.log('Navigate to leaderboard')
      }
    });

    setDynamicInsights(insights);
  };

  const calculateCurrentMultiplier = () => {
    if (!stats) return;
    
    let multiplier = 1.0;
    const currentHour = new Date().getHours();
    
    // Time-based multiplier
    if (currentHour >= 6 && currentHour <= 9) multiplier += 0.1; // Morning bonus
    if (currentHour >= 22 || currentHour <= 5) multiplier += 0.2; // Late night dedication
    
    // Streak multiplier
    if (stats.current_streak > 7) multiplier += 0.3;
    if (stats.current_streak > 30) multiplier += 0.5;
    
    // Weekend multiplier
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) multiplier += 0.15;
    
    setCurrentMultiplier(Math.round(multiplier * 100) / 100);
  };

  const calculateNextLevelPoints = (currentLevel: number): number => {
    // Exponential scaling for levels
    const levels = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 16000];
    return levels[currentLevel] || currentLevel * 2000;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="p-6 text-center">
        <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Gamification Loading...</h3>
        <p className="text-muted-foreground">Setting up your personalized learning experience...</p>
      </Card>
    );
  }

  const levelProgress = ((stats.total_points % 1000) / 1000) * 100; // Simplified calculation
  const nextLevelPoints = calculateNextLevelPoints(stats.current_level);
  const pointsToNext = nextLevelPoints - stats.total_points;

  return (
    <div className="space-y-6">
      {/* Stats Overview with Dynamic Elements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Total XP</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-blue-700">{stats.total_points}</p>
                {currentMultiplier > 1.0 && (
                  <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                    {currentMultiplier}x bonus active!
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-600 font-medium">Level</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-purple-700">{stats.current_level}</p>
                <div className="text-xs text-purple-600">
                  {pointsToNext > 0 ? `${pointsToNext} to next` : 'Max level!'}
                </div>
              </div>
              <Progress value={levelProgress} className="h-1 mt-1" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-600 font-medium">Current Streak</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-orange-700">{stats.current_streak}</p>
                <div className="text-xs text-orange-600">days</div>
              </div>
              <p className="text-xs text-orange-500 mt-1">
                Best: {stats.longest_streak} days
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Achievements</p>
              <p className="text-2xl font-bold text-green-700">{stats.achievements_count}</p>
              <p className="text-xs text-green-500 mt-1">
                {stats.badges_count} badges earned
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Current Multiplier Display */}
      {currentMultiplier > 1.0 && (
        <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-800">Bonus Multiplier Active!</h4>
              <p className="text-sm text-yellow-700">
                You're earning {currentMultiplier}x XP right now due to your great timing and consistency!
              </p>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {currentMultiplier}x
            </div>
          </div>
        </Card>
      )}

      {/* Dynamic Insights */}
      {dynamicInsights.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Personalized Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dynamicInsights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <div key={index} className={`p-4 rounded-lg border ${insight.bgColor} border-opacity-50`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 ${insight.color} mt-0.5`} />
                    <div className="flex-1">
                      <h4 className={`font-semibold text-sm ${insight.color} mb-1`}>
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        {insight.message}
                      </p>
                      {insight.action && (
                        <button 
                          onClick={insight.action.onClick}
                          className={`text-xs px-3 py-1 rounded-md ${insight.bgColor} ${insight.color} font-medium hover:opacity-80 transition-opacity`}
                        >
                          {insight.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="challenges" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Smart Challenges
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="challenges">
          <DynamicChallengeWidget />
        </TabsContent>

        <TabsContent value="achievements">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements?.slice(0, 6).map((achievement) => (
              <Card key={achievement.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{achievement.achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{achievement.achievement.display_name}</h4>
                    <p className="text-xs text-muted-foreground">{achievement.achievement.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {achievement.achievement.category}
                      </Badge>
                      <div className="text-xs text-yellow-600 flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {achievement.points_earned} XP
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card className="p-6">
            <div className="text-center space-y-4">
              <Users className="h-12 w-12 text-blue-500 mx-auto" />
              <h3 className="text-lg font-semibold">Dynamic Leaderboard</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Compare your progress with peers at similar levels. Rankings update in real-time based on recent activity!
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Learning Patterns
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Peak Activity Time</span>
                  <Badge variant="secondary">Morning (6-9 AM)</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Favorite Challenge Type</span>
                  <Badge variant="secondary">Quiz Completion</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Learning Velocity</span>
                  <Badge className="bg-green-100 text-green-800">Improving</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Progress Analytics
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Week over Week</span>
                  <span className="text-sm font-medium text-green-600">+23% XP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Challenge Success Rate</span>
                  <span className="text-sm font-medium text-blue-600">78%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Engagement Trend</span>
                  <Badge className="bg-blue-100 text-blue-800">Stable</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}