"use client";

import React from 'react';
import { Flame, Star, Award, Trophy, Crown, Target } from 'lucide-react';
import { useGamification } from './gamification-provider';
import { Card } from '@/components/ui/card';

interface GamificationStripProps {
  onContinueLearning?: () => void;
  compact?: boolean;
}

export function GamificationStrip({ onContinueLearning, compact = false }: GamificationStripProps) {
  const { stats, isLoading } = useGamification();

  if (isLoading) {
    return (
      <Card className="rounded-xl border border-border bg-white/70 p-4 md:p-6 backdrop-blur animate-pulse">
        <div className="h-16 bg-gray-200 rounded"></div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="rounded-xl border border-border bg-white/70 p-4 md:p-6 backdrop-blur">
        <div className="text-center text-muted-foreground">
          Start learning to see your progress!
        </div>
      </Card>
    );
  }

  const levelProgress = getLevelProgress(stats.current_level, stats.total_points);
  
  if (compact) {
    return (
      <div className="flex items-center gap-4 rounded-lg bg-white/70 p-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">Level {stats.current_level}</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">{stats.total_points} XP</span>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium">{stats.current_streak} day streak</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="rounded-xl border border-border bg-white/70 p-4 md:p-6 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold">Level {stats.current_level}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Keep up your great learning momentum!
          </p>
          {/* Level Progress Bar */}
          <div className="w-full max-w-md">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{levelProgress.currentLevelPoints} XP</span>
              <span>{levelProgress.nextLevelPoints} XP</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                style={{ width: `${levelProgress.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">
                {stats.current_streak} days
              </div>
              <div className="text-xs text-muted-foreground">Current streak</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">
                {stats.total_points} XP
              </div>
              <div className="text-xs text-muted-foreground">Total points</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-500" />
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">
                {stats.achievements_count}
              </div>
              <div className="text-xs text-muted-foreground">Achievements</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">
                {stats.longest_streak}
              </div>
              <div className="text-xs text-muted-foreground">Best streak</div>
            </div>
          </div>
          
          {onContinueLearning && (
            <button
              onClick={onContinueLearning}
              className="rounded-md bg-[hsl(var(--brand))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Continue learning
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Helper function to calculate level progress
function getLevelProgress(currentLevel: number, totalPoints: number) {
  // This is a basic level calculation - you might want to fetch actual level config from your API
  const levelThresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000];
  
  const currentLevelThreshold = levelThresholds[currentLevel - 1] || 0;
  const nextLevelThreshold = levelThresholds[currentLevel] || currentLevelThreshold + 2000;
  
  const currentLevelPoints = totalPoints - currentLevelThreshold;
  const neededForNextLevel = nextLevelThreshold - currentLevelThreshold;
  const progressPercent = Math.min(100, Math.max(0, (currentLevelPoints / neededForNextLevel) * 100));
  
  return {
    currentLevelPoints,
    nextLevelPoints: nextLevelThreshold,
    neededForNextLevel,
    progressPercent: Math.round(progressPercent),
  };
}