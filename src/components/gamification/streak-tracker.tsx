"use client";

import React from 'react';
import { Flame, Calendar, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  compact?: boolean;
}

export function StreakTracker({ currentStreak, longestStreak, compact = false }: StreakTrackerProps) {
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-red-500';
    if (streak >= 14) return 'text-orange-500';
    if (streak >= 7) return 'text-yellow-500';
    if (streak >= 3) return 'text-blue-500';
    return 'text-gray-500';
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your streak today!';
    if (streak < 3) return 'Building momentum...';
    if (streak < 7) return 'Good progress!';
    if (streak < 14) return 'On fire! 🔥';
    if (streak < 30) return 'Streak master!';
    return 'Legendary streak!';
  };

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100">
            <Flame className={`h-5 w-5 ${getStreakColor(currentStreak)}`} />
          </div>
          <div>
            <div className="text-lg font-semibold">{currentStreak} days</div>
            <div className="text-sm text-muted-foreground">Current streak</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Flame className={`h-6 w-6 ${getStreakColor(currentStreak)}`} />
          <h3 className="text-lg font-semibold">Learning Streak</h3>
        </div>

        {/* Current Streak */}
        <div className="text-center space-y-2">
          <div className={`text-4xl font-bold ${getStreakColor(currentStreak)}`}>
            {currentStreak}
          </div>
          <div className="text-sm text-muted-foreground">
            {currentStreak === 1 ? 'day' : 'days'} in a row
          </div>
          <div className={`text-sm font-medium ${getStreakColor(currentStreak)}`}>
            {getStreakMessage(currentStreak)}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs">Best</span>
            </div>
            <div className="text-lg font-semibold">{longestStreak}</div>
            <div className="text-xs text-muted-foreground">days</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Today</span>
            </div>
            <div className="text-lg font-semibold">
              {currentStreak > 0 ? '✓' : '○'}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentStreak > 0 ? 'complete' : 'pending'}
            </div>
          </div>
        </div>

        {/* Visual Streak Calendar */}
        <StreakCalendar currentStreak={currentStreak} />
      </div>
    </Card>
  );
}

interface StreakCalendarProps {
  currentStreak: number;
}

function StreakCalendar({ currentStreak }: StreakCalendarProps) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const dayIndex = 13 - i; // Most recent day is index 0
    const isActive = dayIndex < currentStreak;
    const isToday = dayIndex === 0;
    
    return {
      index: dayIndex,
      isActive,
      isToday,
    };
  }).reverse();

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground text-center">
        Last 14 days
      </div>
      <div className="flex justify-center gap-1">
        {days.map((day, i) => (
          <div
            key={i}
            className={`
              w-3 h-3 rounded-sm transition-colors
              ${day.isActive 
                ? day.isToday 
                  ? 'bg-orange-500 ring-2 ring-orange-200' 
                  : 'bg-orange-400'
                : 'bg-gray-200'
              }
            `}
            title={
              day.isToday 
                ? 'Today' 
                : day.isActive 
                  ? `Day ${day.index + 1}` 
                  : 'No activity'
            }
          />
        ))}
      </div>
    </div>
  );
}