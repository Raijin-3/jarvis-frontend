"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

interface GamificationStats {
  total_points: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  achievements_count: number;
  badges_count: number;
  rank_position?: number;
}

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

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  points_reward: number;
  difficulty_level: string;
  progress?: {
    id: string;
    current_progress: number;
    completed_at: string | null;
    points_earned: number;
  };
}

interface Badge {
  id: string;
  badge_id: string;
  earned_at: string;
  is_equipped: boolean;
  badge: {
    name: string;
    display_name: string;
    description: string;
    icon: string;
    color_primary: string;
    rarity: string;
  };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

interface GamificationContextType {
  stats: GamificationStats | null;
  achievements: Achievement[];
  dailyChallenges: DailyChallenge[];
  badges: Badge[];
  notifications: Notification[];
  insights: any;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  recordActivity: (activityType: string, referenceId?: string, referenceType?: string, durationMinutes?: number) => Promise<void>;
  updateChallengeProgress: (challengeId: string, progressIncrement: number) => Promise<void>;
  markNotificationsRead: (notificationIds: string[]) => Promise<void>;
  awardPoints: (points: number, reason: string, referenceId?: string, referenceType?: string) => Promise<void>;
  refreshChallenges: () => Promise<void>;
  // Enhanced dynamic features
  awardMicroReward: (microAchievement: string, contextData?: any) => Promise<void>;
  getCurrentMultiplier: () => Promise<number>;
  checkContextualAchievements: (activityData: any) => Promise<string[]>;
  getDynamicInsights: () => Promise<any>;
  getPersonalizedRecommendations: () => Promise<any>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}

interface GamificationProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function GamificationProvider({ children, userId }: GamificationProviderProps) {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = supabaseBrowser();

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No authentication token');
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }, [supabase.auth]);

  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }, [getAuthHeaders]);

  const refreshData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch dashboard data (combines multiple endpoints)
      const dashboardData = await apiCall(`/v1/gamification/dashboard/${userId}`);
      
      setStats(dashboardData.stats);
      setAchievements(dashboardData.recent_achievements || []);
      setDailyChallenges(dashboardData.daily_challenges || []);
      setBadges(dashboardData.recent_badges || []);
      setNotifications(dashboardData.unread_notifications || []);
      setInsights(dashboardData.insights || null);

    } catch (error) {
      console.error('Failed to fetch gamification data:', error);
      setError('Failed to load gamification data');
    } finally {
      setIsLoading(false);
    }
  }, [userId, apiCall]);

  const recordActivity = useCallback(async (
    activityType: string,
    referenceId?: string,
    referenceType?: string,
    durationMinutes?: number
  ) => {
    if (!userId) return;

    try {
      await apiCall(`/v1/gamification/activity/${userId}`, {
        method: 'POST',
        body: JSON.stringify({
          activityType,
          referenceId,
          referenceType,
          durationMinutes,
        }),
      });
      
      // Refresh data after recording activity
      await refreshData();
    } catch (error) {
      console.error('Failed to record activity:', error);
    }
  }, [userId, apiCall, refreshData]);

  const updateChallengeProgress = useCallback(async (challengeId: string, progressIncrement: number) => {
    if (!userId) return;

    try {
      await apiCall(`/v1/gamification/challenges/${userId}/${challengeId}`, {
        method: 'POST',
        body: JSON.stringify({
          progressIncrement,
        }),
      });
      
      // Refresh challenges data
      const updatedChallenges = await apiCall(`/v1/gamification/challenges/${userId}`);
      setDailyChallenges(updatedChallenges);
    } catch (error) {
      console.error('Failed to update challenge progress:', error);
    }
  }, [userId, apiCall]);

  const markNotificationsRead = useCallback(async (notificationIds: string[]) => {
    if (!userId) return;

    try {
      await apiCall(`/v1/gamification/notifications/${userId}/read`, {
        method: 'PATCH',
        body: JSON.stringify({
          notificationIds,
        }),
      });
      
      // Update local notifications state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id) 
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }, [userId, apiCall]);

  const awardPoints = useCallback(async (
    points: number,
    reason: string,
    referenceId?: string,
    referenceType?: string
  ) => {
    if (!userId) return;

    try {
      await apiCall(`/v1/gamification/points/${userId}`, {
        method: 'POST',
        body: JSON.stringify({
          points,
          reason,
          referenceId,
          referenceType,
        }),
      });
      
      // Refresh stats after awarding points
      const updatedStats = await apiCall(`/v1/gamification/stats/${userId}`);
      setStats(updatedStats);
    } catch (error) {
      console.error('Failed to award points:', error);
    }
  }, [userId, apiCall]);

  // Enhanced dynamic gamification methods
  const awardMicroReward = useCallback(async (microAchievement: string, contextData?: any) => {
    if (!userId) return;

    try {
      await apiCall(`/v1/gamification/micro-reward/${userId}`, {
        method: 'POST',
        body: JSON.stringify({
          microAchievement,
          contextData,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error awarding micro reward:', error);
    }
  }, [userId, apiCall]);

  const getCurrentMultiplier = useCallback(async (): Promise<number> => {
    if (!userId) return 1.0;

    try {
      const data = await apiCall(`/v1/gamification/multiplier/${userId}`);
      return data.multiplier || 1.0;
    } catch (error) {
      console.error('Error getting current multiplier:', error);
      return 1.0;
    }
  }, [userId, apiCall]);

  const checkContextualAchievements = useCallback(async (activityData: any): Promise<string[]> => {
    if (!userId) return [];

    try {
      const data = await apiCall(`/v1/gamification/contextual-achievements/${userId}`, {
        method: 'POST',
        body: JSON.stringify({
          activityData,
          timestamp: new Date().toISOString(),
        }),
      });
      return data.newAchievements || [];
    } catch (error) {
      console.error('Error checking contextual achievements:', error);
      return [];
    }
  }, [userId, apiCall]);

  const getDynamicInsights = useCallback(async () => {
    if (!userId) return null;

    try {
      return await apiCall(`/v1/gamification/dynamic-insights/${userId}`);
    } catch (error) {
      console.error('Error getting dynamic insights:', error);
      return null;
    }
  }, [userId, apiCall]);

  const getPersonalizedRecommendations = useCallback(async () => {
    if (!userId) return null;

    try {
      return await apiCall(`/v1/gamification/personalized-recommendations/${userId}`);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return null;
    }
  }, [userId, apiCall]);

  useEffect(() => {
    if (userId) {
      refreshData();
    }
  }, [userId, refreshData]);

  // Set up real-time updates for achievements and notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`gamification:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refreshData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gamification_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refreshData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, refreshData]);

  const refreshChallenges = useCallback(async () => {
    if (!userId) return;

    try {
      await apiCall(`/v1/gamification/challenges/refresh/${userId}`, {
        method: 'POST',
      });
      
      // Refresh the dashboard data after refreshing challenges
      await refreshData();
    } catch (error) {
      console.error('Failed to refresh challenges:', error);
    }
  }, [userId, apiCall, refreshData]);

  const value: GamificationContextType = {
    stats,
    achievements,
    dailyChallenges,
    badges,
    notifications,
    insights,
    isLoading,
    error,
    refreshData,
    recordActivity,
    updateChallengeProgress,
    markNotificationsRead,
    awardPoints,
    refreshChallenges,
    // Enhanced dynamic features
    awardMicroReward,
    getCurrentMultiplier,
    checkContextualAchievements,
    getDynamicInsights,
    getPersonalizedRecommendations,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}
