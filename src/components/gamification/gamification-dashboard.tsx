"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGamification } from './gamification-provider';
import { GamificationStrip } from './gamification-strip';
import { DailyChallenges } from './daily-challenges';
import { AchievementGrid } from './achievement-card';
import { BadgeCollection } from './badge-collection';
import { NotificationCenter } from './notification-center';
import { LeaderboardWidget } from './leaderboard-widget';
import { StreakTracker } from './streak-tracker';
import { PointsDisplay } from './points-display';
import { InsightsWidget } from './insights-widget';
import { Trophy, Target, Award, Bell, TrendingUp, Flame, BarChart3 } from 'lucide-react';

interface GamificationDashboardProps {
  onContinueLearning?: () => void;
}

export function GamificationDashboard({ onContinueLearning }: GamificationDashboardProps) {
  const { 
    stats, 
    achievements, 
    dailyChallenges, 
    badges, 
    notifications, 
    insights,
    isLoading,
    error 
  } = useGamification();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-2">
          <div className="text-red-500 text-lg font-semibold">Unable to load gamification data</div>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </Card>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const completedChallenges = dailyChallenges.filter(c => c.progress?.completed_at).length;

  return (
    <div className="space-y-6">
      {/* Main Gamification Strip */}
      <GamificationStrip onContinueLearning={onContinueLearning} />

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PointsDisplay 
          points={stats?.total_points || 0} 
          title="Total XP" 
          icon={<Trophy className="h-5 w-5" />}
          color="text-yellow-500"
        />
        <StreakTracker 
          currentStreak={stats?.current_streak || 0}
          longestStreak={stats?.longest_streak || 0}
        />
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="text-lg font-semibold">{completedChallenges}/{dailyChallenges.length}</div>
              <div className="text-sm text-muted-foreground">Daily Challenges</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Award className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <div className="text-lg font-semibold">{stats?.achievements_count || 0}</div>
              <div className="text-sm text-muted-foreground">Achievements</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="challenges">
            Challenges
            {dailyChallenges.length > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                {dailyChallenges.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="insights">
            <BarChart3 className="h-4 w-4 mr-1" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {unreadNotifications.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {unreadNotifications.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <DailyChallenges />
              <NotificationCenter />
            </div>
            <div className="space-y-6">
              <InsightsWidget insights={insights} />
              <AchievementGrid achievements={achievements} maxItems={3} />
              <LeaderboardWidget />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <DailyChallenges />
          <div className="text-center p-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Complete challenges daily to earn bonus points and maintain your streak!</p>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <AchievementGrid achievements={achievements} title="All Achievements" />
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          <BadgeCollection badges={badges} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <InsightsWidget insights={insights} detailed />
          <div className="text-center p-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Insights are updated in real-time based on your learning activity and progress.</p>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationCenter showAll />
        </TabsContent>
      </Tabs>
    </div>
  );
}