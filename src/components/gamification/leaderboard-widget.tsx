"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabaseBrowser } from '@/lib/supabase-browser';

interface LeaderboardEntry {
  user_id: string;
  rank_position: number;
  score_value: number;
  full_name?: string;
}

interface LeaderboardWidgetProps {
  compact?: boolean;
  leaderboardName?: string; // optional, reserved for future use
}

const rankIcons = {
  1: <Crown className="h-4 w-4 text-yellow-500" />,
  2: <Medal className="h-4 w-4 text-gray-400" />,
  3: <Trophy className="h-4 w-4 text-amber-600" />,
};

export function LeaderboardWidget({ compact = false }: LeaderboardWidgetProps) {
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = supabaseBrowser();

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

      // Fetch overall points leaderboard
      const overallResponse = await fetch(
        `${apiUrl}/v1/gamification/leaderboard/overall_points?limit=10`,
        { headers }
      );
      
      // Fetch monthly points leaderboard
      const monthlyResponse = await fetch(
        `${apiUrl}/v1/gamification/leaderboard/monthly_points?limit=10`,
        { headers }
      );

      if (overallResponse.ok) {
        const overallData = await overallResponse.json();
        setOverallLeaderboard(overallData);
      } else {
        console.error('Overall leaderboard fetch failed:', overallResponse.status, overallResponse.statusText);
      }

      if (monthlyResponse.ok) {
        const monthlyData = await monthlyResponse.json();
        setMonthlyLeaderboard(monthlyData);
      } else {
        console.error('Monthly leaderboard fetch failed:', monthlyResponse.status, monthlyResponse.statusText);
      }

    } catch (error) {
      console.error('Failed to fetch leaderboards:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      setError('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-2">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h4 className="font-semibold">Top Learners</h4>
          </div>
          <div className="space-y-2">
            {overallLeaderboard.slice(0, 3).map((entry) => (
              <LeaderboardRow key={entry.user_id} entry={entry} compact />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Leaderboard</h3>
        </div>

        <Tabs defaultValue="overall" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overall">All Time</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-3">
            {overallLeaderboard.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No data available
              </div>
            ) : (
              overallLeaderboard.map((entry) => (
                <LeaderboardRow key={entry.user_id} entry={entry} />
              ))
            )}
          </TabsContent>

          <TabsContent value="monthly" className="space-y-3">
            {monthlyLeaderboard.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No data available
              </div>
            ) : (
              monthlyLeaderboard.map((entry) => (
                <LeaderboardRow key={entry.user_id} entry={entry} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  compact?: boolean;
}

function LeaderboardRow({ entry, compact = false }: LeaderboardRowProps) {
  const formatScore = (score: number) => {
    if (score >= 1000) {
      return (score / 1000).toFixed(1) + 'K';
    }
    return score.toString();
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800';
    if (rank === 2) return 'bg-gray-100 text-gray-800';
    if (rank === 3) return 'bg-amber-100 text-amber-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors
      ${entry.rank_position <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-white'}
    `}>
      {/* Rank */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge className={getRankBadgeColor(entry.rank_position)}>
          #{entry.rank_position}
        </Badge>
        {entry.rank_position <= 3 && (
          <div>
            {rankIcons[entry.rank_position as keyof typeof rankIcons]}
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${compact ? 'text-sm' : 'text-base'}`}>
          {entry.full_name || 'Anonymous User'}
        </div>
      </div>

      {/* Score */}
      <div className={`flex items-center gap-1 flex-shrink-0 ${compact ? 'text-sm' : 'text-base'}`}>
        <Star className="h-4 w-4 text-yellow-500" />
        <span className="font-semibold">{formatScore(entry.score_value)}</span>
      </div>
    </div>
  );
}
