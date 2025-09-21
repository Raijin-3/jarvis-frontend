"use client";

import { useState, useEffect, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Star,
  Zap,
  Trophy,
  Target,
  Flame,
  Sparkles,
  Medal,
  Clock,
  TrendingUp,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type MicroRewardCategory =
  | "instant"
  | "streak"
  | "achievement"
  | "improvement"
  | "social";

interface RewardTemplate {
  title: string;
  message: string;
  basePoints: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  iconBg: string;
  type: MicroRewardCategory;
}

const rewardTemplates = {
  first_question_of_day: {
    title: "Early Bird Bonus",
    message: "First question of the day completed.",
    basePoints: 5,
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    iconBg: "bg-gradient-to-br from-yellow-200 to-orange-200",
    type: "instant",
  },
  perfect_first_try: {
    title: "Bullseye!",
    message: "Perfect score on the first try.",
    basePoints: 10,
    icon: Target,
    color: "text-green-600",
    bgColor: "bg-green-50",
    iconBg: "bg-gradient-to-br from-green-200 to-emerald-300",
    type: "instant",
  },
  quick_learner: {
    title: "Lightning Fast",
    message: "Activity completed in record time.",
    basePoints: 8,
    icon: Zap,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    iconBg: "bg-gradient-to-br from-blue-200 to-sky-300",
    type: "instant",
  },
  consistent_daily: {
    title: "Consistency Streak",
    message: "Daily dedication is paying off.",
    basePoints: 15,
    icon: Flame,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    iconBg: "bg-gradient-to-br from-orange-200 to-amber-300",
    type: "streak",
  },
  improvement_shown: {
    title: "Progress Unlocked",
    message: "Clear improvement detected over recent sessions.",
    basePoints: 12,
    icon: TrendingUp,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    iconBg: "bg-gradient-to-br from-purple-200 to-fuchsia-300",
    type: "improvement",
  },
  helpful_feedback: {
    title: "Insightful Contribution",
    message: "Thanks for sharing helpful feedback.",
    basePoints: 6,
    icon: Sparkles,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    iconBg: "bg-gradient-to-br from-indigo-200 to-violet-300",
    type: "social",
  },
  speed_bonus: {
    title: "Speed Demon",
    message: "Completed faster than 90% of learners.",
    basePoints: 20,
    icon: Zap,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    iconBg: "bg-gradient-to-br from-cyan-200 to-teal-300",
    type: "achievement",
  },
  perfect_streak: {
    title: "Perfectionist",
    message: "Three perfect scores in a row!",
    basePoints: 25,
    icon: Trophy,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    iconBg: "bg-gradient-to-br from-amber-200 to-yellow-300",
    type: "achievement",
  },
  night_owl: {
    title: "Night Owl",
    message: "Learning late into the night.",
    basePoints: 15,
    icon: Clock,
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    iconBg: "bg-gradient-to-br from-slate-200 to-gray-300",
    type: "instant",
  },
  weekend_warrior: {
    title: "Weekend Warrior",
    message: "You carved out time to learn this weekend.",
    basePoints: 18,
    icon: Medal,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    iconBg: "bg-gradient-to-br from-rose-200 to-pink-300",
    type: "instant",
  },
} satisfies Record<string, RewardTemplate>;

type RewardKey = keyof typeof rewardTemplates;

interface MicroReward extends RewardTemplate {
  id: string;
  points: number;
  timestamp: number;
  multiplier?: number;
  contextData?: Record<string, unknown>;
}

interface MicroRewardsSystemProps {
  userId?: string;
  onRewardTrigger?: (reward: MicroReward) => void;
}

export function MicroRewardsSystem({
  userId,
  onRewardTrigger,
}: MicroRewardsSystemProps) {
  const [activeRewards, setActiveRewards] = useState<MicroReward[]>([]);
  const [totalSessionPoints, setTotalSessionPoints] = useState(0);

  const calculateMultiplier = useCallback(
    (contextData?: Record<string, unknown>): number => {
      let multiplier = 1;
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();

      if (hour >= 6 && hour <= 9) multiplier += 0.1;
      if (hour >= 22 || hour <= 5) multiplier += 0.2;
      if (day === 0 || day === 6) multiplier += 0.15;

      if (contextData && typeof contextData === "object") {
        if ((contextData as { isFirstOfDay?: boolean }).isFirstOfDay) {
          multiplier += 0.2;
        }
        const streakLength = (contextData as { streakLength?: number }).streakLength;
        if (typeof streakLength === "number" && streakLength > 7) {
          multiplier += 0.3;
        }
        const difficulty = (contextData as { difficulty?: string }).difficulty;
        if (difficulty === "hard") {
          multiplier += 0.25;
        }
      }

      return Math.round(multiplier * 100) / 100;
    },
    [],
  );

  const triggerMicroReward = useCallback(
    (rewardType: RewardKey, contextData?: Record<string, unknown>) => {
      const template = rewardTemplates[rewardType];
      if (!template) return;

      const multiplier = calculateMultiplier(contextData);
      const points = Math.round(template.basePoints * multiplier);

      const reward: MicroReward = {
        ...template,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        points,
        timestamp: Date.now(),
        multiplier: multiplier > 1 ? multiplier : undefined,
        contextData,
      };

      setActiveRewards((prev) => [reward, ...prev].slice(0, 5));
      setTotalSessionPoints((prev) => prev + points);

      window.setTimeout(() => {
        setActiveRewards((prev) => prev.filter((item) => item.id !== reward.id));
      }, 8000);

      onRewardTrigger?.(reward);
    },
    [calculateMultiplier, onRewardTrigger],
  );

  useEffect(() => {
    if (!userId) return;

    const interval = window.setInterval(() => {
      const rewardTypes = Object.keys(rewardTemplates) as RewardKey[];
      const type = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];

      triggerMicroReward(type, {
        isFirstOfDay: Math.random() > 0.8,
        streakLength: Math.floor(Math.random() * 15),
        difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)],
      });
    }, 15000 + Math.random() * 15000);

    return () => window.clearInterval(interval);
  }, [triggerMicroReward, userId]);

  const checkForContextualAchievements = useCallback(
    (activityData: Record<string, unknown>) => {
      const score = activityData?.score as number | undefined;
      const retries = activityData?.retries as number | undefined;
      const completionTime = activityData?.completionTime as number | undefined;

      if (score === 100 && !retries) {
        triggerMicroReward("perfect_first_try", activityData);
      }

      if (completionTime && completionTime < 30) {
        triggerMicroReward("quick_learner", activityData);
      }

      const hour = new Date().getHours();
      if (hour >= 5 && hour <= 7) {
        triggerMicroReward("first_question_of_day", { earlyBird: true });
      } else if (hour >= 22) {
        triggerMicroReward("night_owl", { lateNight: true });
      }

      const day = new Date().getDay();
      if (day === 0 || day === 6) {
        triggerMicroReward("weekend_warrior", { weekend: true });
      }
    },
    [triggerMicroReward],
  );

  useEffect(() => {
    (window as Record<string, unknown>).triggerMicroReward = triggerMicroReward;
    (window as Record<string, unknown>).checkContextualAchievements =
      checkForContextualAchievements;

    return () => {
      delete (window as Record<string, unknown>).triggerMicroReward;
      delete (window as Record<string, unknown>).checkContextualAchievements;
    };
  }, [triggerMicroReward, checkForContextualAchievements]);

  const dismissReward = (id: string) => {
    setActiveRewards((prev) => prev.filter((reward) => reward.id !== id));
  };

  const dismissAll = () => {
    setActiveRewards([]);
  };

  if (activeRewards.length === 0 && totalSessionPoints === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {totalSessionPoints > 0 && (
        <Card className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-800">Session Points</p>
                <p className="text-xs text-yellow-600">+{totalSessionPoints} XP earned</p>
              </div>
            </div>
            {activeRewards.length > 1 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={dismissAll}
                className="text-xs h-6 px-2 text-yellow-700 hover:bg-yellow-200"
              >
                Clear All
              </Button>
            )}
          </div>
        </Card>
      )}

      {activeRewards.map((reward, index) => {
        const Icon = reward.icon;
        return (
          <Card
            key={reward.id}
            className={`p-4 shadow-lg border transition-all duration-500 animate-in slide-in-from-right ${reward.bgColor} border-opacity-50 hover:shadow-xl`}
            style={{
              animationDelay: `${index * 100}ms`,
              transform: `translateY(${index * 4}px)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${reward.iconBg}`}
              >
                <Icon className={`h-5 w-5 ${reward.color}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-semibold text-sm ${reward.color}`}>{reward.title}</h4>
                  {reward.multiplier && (
                    <Badge className="bg-yellow-100 text-yellow-700 text-xs px-1 py-0">
                      {reward.multiplier}x
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-2">{reward.message}</p>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 text-xs font-medium ${reward.color}`}>
                    <Star className="h-3 w-3" />
                    +{reward.points} XP
                  </div>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {reward.type}
                  </Badge>
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => dismissReward(reward.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                aria-label="Dismiss reward"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        );
      })}

      {process.env.NODE_ENV === "development" && (
        <Card className="p-3 bg-gray-50 border-gray-200">
          <p className="text-xs text-gray-600 mb-2 font-medium">Demo Actions:</p>
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-6 px-2"
              onClick={() => triggerMicroReward("perfect_first_try")}
            >
              Perfect Score
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-6 px-2"
              onClick={() => triggerMicroReward("quick_learner")}
            >
              Speed Bonus
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-6 px-2"
              onClick={() => triggerMicroReward("consistent_daily")}
            >
              Streak
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export function useMicroRewards() {
  const triggerReward = useCallback((rewardType: string, contextData?: Record<string, unknown>) => {
    if ((window as Record<string, unknown>).triggerMicroReward) {
      (window as { triggerMicroReward?: (type: string, ctx?: Record<string, unknown>) => void }).triggerMicroReward?.(
        rewardType,
        contextData,
      );
    }
  }, []);

  const checkAchievements = useCallback((activityData: Record<string, unknown>) => {
    if ((window as Record<string, unknown>).checkContextualAchievements) {
      (window as {
        checkContextualAchievements?: (data: Record<string, unknown>) => void;
      }).checkContextualAchievements?.(activityData);
    }
  }, []);

  return {
    triggerReward,
    checkAchievements,
  };
}
