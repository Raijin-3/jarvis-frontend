"use client";

import React from 'react';
import { TrendingUp, Target, Award, Lightbulb, AlertTriangle, CheckCircle, Activity, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface InsightsWidgetProps {
  insights?: {
    productivity: {
      weeklyAverage: number;
      activeDays: number;
      trend: string;
      message: string;
    };
    progress: {
      totalPoints: number;
      currentLevel: number;
      recentAchievements: number;
      streakDays: number;
      message: string;
    };
    recommendations: string[];
    streakStatus: {
      status: string;
      message: string;
      action: string;
      risk: string;
    };
    levelProgress: {
      currentLevel: number;
      totalPoints: number;
      pointsNeededForNext: number;
      progress: number;
      nextLevel: number;
    };
  };
  isLoading?: boolean;
  detailed?: boolean;
}

export function InsightsWidget({ insights, isLoading, detailed = false }: InsightsWidgetProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-2">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold">No insights available</h3>
          <p className="text-muted-foreground">Complete some activities to generate insights!</p>
        </div>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'at_risk': return 'text-red-600';
      case 'inactive': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'at_risk': return <AlertTriangle className="h-4 w-4" />;
      case 'inactive': return <Target className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">Your Learning Insights</h3>
        </div>

        {/* Level Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Level Progress</span>
            <span className="text-xs text-muted-foreground">
              Level {insights.levelProgress.currentLevel} → {insights.levelProgress.nextLevel}
            </span>
          </div>
          <Progress 
            value={insights.levelProgress.progress * 100} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {insights.levelProgress.pointsNeededForNext > 0 
              ? `${insights.levelProgress.pointsNeededForNext} XP needed for next level`
              : 'Maximum level reached!'
            }
          </p>
        </div>

        {/* Streak Status */}
        <div className={`p-3 rounded-lg border ${insights.streakStatus.risk === 'high' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={getStatusColor(insights.streakStatus.status)}>
              {getStatusIcon(insights.streakStatus.status)}
            </span>
            <span className="text-sm font-medium">
              {insights.progress.streakDays}-Day Streak
            </span>
            <Badge 
              variant={insights.streakStatus.status === 'active' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {insights.streakStatus.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {insights.streakStatus.message}
          </p>
        </div>

        {/* Productivity Insights */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Weekly Activity</span>
            <div className="flex items-center gap-1">
              {getTrendIcon(insights.productivity.trend)}
              <span className="text-xs text-muted-foreground">
                {insights.productivity.weeklyAverage} avg/day
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {insights.productivity.message}
          </p>
        </div>

        {/* Recent Progress */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {insights.progress.recentAchievements}
            </div>
            <div className="text-xs text-muted-foreground">
              Achievements This Week
            </div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              {insights.productivity.activeDays}
            </div>
            <div className="text-xs text-muted-foreground">
              Active Days This Week
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {insights.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Smart Recommendations</span>
            </div>
            <div className="space-y-2">
              {insights.recommendations.map((recommendation, index) => (
                <div 
                  key={index}
                  className="text-xs p-2 bg-yellow-50 border-l-2 border-yellow-400 rounded-r"
                >
                  {recommendation}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Progress Overview - Only shown in detailed view */}
        {detailed && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">Detailed Progress</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Overall Statistics</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Total XP Earned:</span>
                    <span className="font-medium">{insights.progress.totalPoints}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Current Level:</span>
                    <span className="font-medium">Level {insights.progress.currentLevel}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Current Streak:</span>
                    <span className="font-medium">{insights.progress.streakDays} days</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">This Week</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Active Days:</span>
                    <span className="font-medium">{insights.productivity.activeDays}/7</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Daily Average:</span>
                    <span className="font-medium">{insights.productivity.weeklyAverage}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>New Achievements:</span>
                    <span className="font-medium">{insights.progress.recentAchievements}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Required Section */}
            {insights.streakStatus.action && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Action Recommended</span>
                </div>
                <p className="text-xs text-amber-700">{insights.streakStatus.action}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}