'use client';

import React from 'react';
import { 
  GamificationProvider, 
  GamificationStrip, 
  DailyChallenges, 
  NotificationCenter, 
  AchievementCard, 
  BadgeCollection, 
  StreakTracker, 
  LeaderboardWidget,
  PointsDisplay,
  LevelProgress
} from '@/components/gamification';
import { LearningActivityDemo } from '@/components/gamification/LearningActivityDemo';

// Mock user ID for testing
const MOCK_USER_ID = 'test-user-123';

export default function GamificationTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gamification System Test</h1>
          <p className="text-gray-600 mt-2">
            Testing dynamic gamification components with real API integration
          </p>
        </div>

        <GamificationProvider userId={MOCK_USER_ID}>
          <div className="space-y-8">
            {/* Top Statistics Strip */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Statistics Strip</h2>
              <GamificationStrip />
            </section>

            {/* Grid Layout for Components */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Challenges */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Daily Challenges</h2>
                <DailyChallenges />
              </section>

              {/* Notifications */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Notification Center</h2>
                <NotificationCenter />
              </section>

              {/* Points Display */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Points Display</h2>
                <PointsDisplay />
              </section>

              {/* Level Progress */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Level Progress</h2>
                <LevelProgress />
              </section>

              {/* Badge Collection */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Badge Collection</h2>
                <BadgeCollection />
              </section>

              {/* Leaderboard */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>
                <LeaderboardWidget />
              </section>

              {/* Streak Tracker */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Learning Streak</h2>
                <StreakTracker />
              </section>

              {/* Recent Achievement */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">Recent Achievement</h2>
                <AchievementCard
                  achievement={({
                    id: 'test-achievement',
                    type_name: 'first_login',
                    display_name: 'Welcome Aboard!',
                    description: 'Complete your first login to the platform',
                    icon: '🎉',
                    points_value: 100,
                    badge_color: 'gold',
                    earned_at: new Date().toISOString(),
                    is_new: true
                  }) as any}
                />
              </section>
            </div>

            {/* Interactive Learning Demo */}
            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Interactive Learning Demo</h2>
              <p className="text-gray-600 mb-6">
                Complete the activities below to see gamification in action. Points, achievements, and challenges will update in real-time above!
              </p>
              <LearningActivityDemo />
            </section>
          </div>
        </GamificationProvider>
      </div>
    </div>
  );
}
