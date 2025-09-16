"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface PointsDisplayProps {
  points: number;
  title?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: {
    value: number;
    period: string;
  };
  compact?: boolean;
}

export function PointsDisplay({ 
  points, 
  title = "Points", 
  icon, 
  color = "text-blue-500",
  trend,
  compact = false 
}: PointsDisplayProps) {
  const formatPoints = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {icon && <div className={color}>{icon}</div>}
        <span className="font-semibold">{formatPoints(points)}</span>
        <span className="text-xs text-muted-foreground">{title}</span>
      </div>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${getBackgroundColor(color)}`}>
          {icon || <TrendingUp className={`h-5 w-5 ${color}`} />}
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold">{formatPoints(points)}</div>
          <div className="text-sm text-muted-foreground">{title}</div>
          {trend && (
            <div className={`text-xs flex items-center gap-1 mt-1 ${
              trend.value >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`h-3 w-3 ${trend.value < 0 ? 'rotate-180' : ''}`} />
              <span>
                {trend.value >= 0 ? '+' : ''}{trend.value} {trend.period}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function getBackgroundColor(textColor: string) {
  const colorMap: Record<string, string> = {
    'text-blue-500': 'bg-blue-100',
    'text-green-500': 'bg-green-100',
    'text-yellow-500': 'bg-yellow-100',
    'text-red-500': 'bg-red-100',
    'text-purple-500': 'bg-purple-100',
    'text-orange-500': 'bg-orange-100',
    'text-pink-500': 'bg-pink-100',
    'text-indigo-500': 'bg-indigo-100',
  };
  
  return colorMap[textColor] || 'bg-gray-100';
}