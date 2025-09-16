"use client";

import React from 'react';
import { Trophy, Star, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Achievement {
  id: string;
  achievement_type_id: string;
  earned_at: string;
  points_earned: number;
  is_featured: boolean;
  achievement: {
    name: string;
    display_name: string;
    description: string;
    icon: string;
    category: string;
    color: string;
    points_reward: number;
  };
}

interface AchievementCardProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showDate?: boolean;
}

const categoryColors = {
  learning: 'bg-blue-100 text-blue-800',
  streak: 'bg-orange-100 text-orange-800',
  milestone: 'bg-purple-100 text-purple-800',
  social: 'bg-green-100 text-green-800',
  special: 'bg-pink-100 text-pink-800',
};

export function AchievementCard({ achievement, size = 'md', showDate = true }: AchievementCardProps) {
  const { achievement: achievementType, earned_at, points_earned, is_featured } = achievement;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return (
    <Card className={`
      ${sizeClasses[size]} 
      ${is_featured ? 'ring-2 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' : 'bg-white'}
      transition-all hover:shadow-md hover:scale-105
    `}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-full text-white"
              style={{ backgroundColor: achievementType.color }}
            >
              <span className={iconSizes[size]}>{achievementType.icon}</span>
            </div>
            <div>
              <h4 className={`font-semibold ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
                {achievementType.display_name}
              </h4>
              <p className={`text-muted-foreground ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
                {achievementType.description}
              </p>
            </div>
          </div>
          
          {is_featured && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              className={`text-xs ${categoryColors[achievementType.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}`}
            >
              {achievementType.category}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {showDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(earned_at)}</span>
              </div>
            )}
            <div className="flex items-center gap-1 font-medium text-yellow-600">
              <Trophy className="h-3 w-3" />
              <span>+{points_earned} XP</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface AchievementGridProps {
  achievements: Achievement[];
  maxItems?: number;
  title?: string;
}

export function AchievementGrid({ achievements, maxItems, title = "Recent Achievements" }: AchievementGridProps) {
  const displayedAchievements = maxItems ? achievements.slice(0, maxItems) : achievements;

  if (achievements.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-2">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold">No achievements yet</h3>
          <p className="text-muted-foreground">Keep learning to unlock your first achievement!</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        {title}
      </h3>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayedAchievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            size="sm"
          />
        ))}
      </div>
      
      {maxItems && achievements.length > maxItems && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            And {achievements.length - maxItems} more achievements...
          </p>
        </div>
      )}
    </div>
  );
}