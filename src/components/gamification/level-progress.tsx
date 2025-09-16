"use client";

import React from 'react';
import { Crown, Star, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LevelProgressProps {
  currentLevel: number;
  totalPoints: number;
  compact?: boolean;
}

// Level configuration - should ideally come from your API
const LEVEL_CONFIG = [
  { level: 1, points_required: 0, title: 'Beginner', color: '#22c55e' },
  { level: 2, points_required: 100, title: 'Explorer', color: '#3b82f6' },
  { level: 3, points_required: 250, title: 'Student', color: '#6366f1' },
  { level: 4, points_required: 500, title: 'Scholar', color: '#8b5cf6' },
  { level: 5, points_required: 1000, title: 'Expert', color: '#f59e0b' },
  { level: 6, points_required: 2000, title: 'Master', color: '#ef4444' },
  { level: 7, points_required: 3500, title: 'Guru', color: '#dc2626' },
  { level: 8, points_required: 5500, title: 'Legend', color: '#7c3aed' },
  { level: 9, points_required: 8000, title: 'Champion', color: '#e11d48' },
  { level: 10, points_required: 12000, title: 'Grandmaster', color: '#9333ea' },
];

export function LevelProgress({ currentLevel, totalPoints, compact = false }: LevelProgressProps) {
  const getCurrentLevelConfig = () => {
    return LEVEL_CONFIG.find(config => config.level === currentLevel) || LEVEL_CONFIG[0];
  };

  const getNextLevelConfig = () => {
    return LEVEL_CONFIG.find(config => config.level === currentLevel + 1) || null;
  };

  const calculateProgress = () => {
    const currentConfig = getCurrentLevelConfig();
    const nextConfig = getNextLevelConfig();
    
    if (!nextConfig) {
      return { progressPercent: 100, currentLevelPoints: totalPoints - currentConfig.points_required, pointsToNext: 0 };
    }

    const currentLevelPoints = totalPoints - currentConfig.points_required;
    const pointsNeededForNext = nextConfig.points_required - currentConfig.points_required;
    const progressPercent = Math.min(100, Math.max(0, (currentLevelPoints / pointsNeededForNext) * 100));
    const pointsToNext = nextConfig.points_required - totalPoints;

    return { progressPercent, currentLevelPoints, pointsToNext };
  };

  const currentConfig = getCurrentLevelConfig();
  const nextConfig = getNextLevelConfig();
  const { progressPercent, currentLevelPoints, pointsToNext } = calculateProgress();

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4" style={{ color: currentConfig.color }} />
          <span className="font-semibold">{currentConfig.title}</span>
          <Badge variant="secondary">Level {currentLevel}</Badge>
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-500"
              style={{ 
                width: `${progressPercent}%`,
                background: `linear-gradient(to right, ${currentConfig.color}, ${nextConfig?.color || currentConfig.color})`
              }}
            />
          </div>
        </div>
        {nextConfig && (
          <span className="text-xs text-muted-foreground">
            {pointsToNext} XP to {nextConfig.title}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-3 rounded-full text-white"
              style={{ backgroundColor: currentConfig.color }}
            >
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{currentConfig.title}</h3>
              <p className="text-sm text-muted-foreground">Level {currentLevel}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: currentConfig.color }}>
              {totalPoints.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total XP</div>
          </div>
        </div>

        {/* Progress Section */}
        {nextConfig ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress to {nextConfig.title}</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercent)}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="relative">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000 relative overflow-hidden"
                  style={{ 
                    width: `${progressPercent}%`,
                    background: `linear-gradient(to right, ${currentConfig.color}, ${nextConfig.color})`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                </div>
              </div>
            </div>

            {/* Progress Details */}
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                <span>{currentLevelPoints} XP in current level</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{pointsToNext} XP to level up</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="text-4xl">🏆</div>
            <h4 className="font-semibold text-lg">Maximum Level Reached!</h4>
            <p className="text-muted-foreground">You've achieved the highest level possible!</p>
          </div>
        )}

        {/* Level Milestones */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Recent Milestones</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {LEVEL_CONFIG
              .filter(config => config.level <= currentLevel && config.level >= Math.max(1, currentLevel - 3))
              .map((config) => (
                <div
                  key={config.level}
                  className={`
                    flex-shrink-0 px-3 py-2 rounded-full border text-xs font-medium
                    ${config.level === currentLevel 
                      ? 'border-current text-white' 
                      : 'border-gray-300 text-gray-600 bg-gray-50'
                    }
                  `}
                  style={config.level === currentLevel ? { backgroundColor: config.color } : {}}
                >
                  Level {config.level}: {config.title}
                </div>
              ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function LevelBadge({ level, title, color }: { level: number, title: string, color: string }) {
  return (
    <div 
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-medium"
      style={{ backgroundColor: color }}
    >
      <Crown className="h-3 w-3" />
      <span>Level {level}</span>
    </div>
  );
}