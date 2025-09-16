"use client";

import React from 'react';
import { Bell, Trophy, Star, Flame, Target, Award, CheckCircle } from 'lucide-react';
import { useGamification } from './gamification-provider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NotificationCenterProps {
  showAll?: boolean;
  maxItems?: number;
}

const notificationIcons = {
  achievement: <Trophy className="h-4 w-4" />,
  level_up: <Star className="h-4 w-4" />,
  streak_milestone: <Flame className="h-4 w-4" />,
  challenge_complete: <Target className="h-4 w-4" />,
  badge_earned: <Award className="h-4 w-4" />,
};

const notificationColors = {
  achievement: 'text-yellow-500 bg-yellow-50 border-yellow-200',
  level_up: 'text-purple-500 bg-purple-50 border-purple-200',
  streak_milestone: 'text-orange-500 bg-orange-50 border-orange-200',
  challenge_complete: 'text-blue-500 bg-blue-50 border-blue-200',
  badge_earned: 'text-green-500 bg-green-50 border-green-200',
};

export function NotificationCenter({ showAll = false, maxItems = 5 }: NotificationCenterProps) {
  const { notifications, isLoading, markNotificationsRead } = useGamification();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </Card>
    );
  }

  const displayNotifications = showAll ? notifications : notifications.slice(0, maxItems);
  const unreadNotifications = notifications.filter(n => !n.is_read);

  if (!notifications || notifications.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-2">
          <Bell className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold">No notifications</h3>
          <p className="text-muted-foreground">
            You'll see your achievements and updates here!
          </p>
        </div>
      </Card>
    );
  }

  const handleMarkAllRead = () => {
    const unreadIds = unreadNotifications.map(n => n.id);
    if (unreadIds.length > 0) {
      markNotificationsRead(unreadIds);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Notifications</h3>
            {unreadNotifications.length > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {unreadNotifications.length} new
              </Badge>
            )}
          </div>
          
          {unreadNotifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {displayNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={() => markNotificationsRead([notification.id])}
            />
          ))}
        </div>

        {!showAll && notifications.length > maxItems && (
          <div className="text-center pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              {notifications.length - maxItems} more notifications...
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    data: any;
    is_read: boolean;
    created_at: string;
  };
  onMarkRead: () => void;
}

function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const icon = notificationIcons[notification.type as keyof typeof notificationIcons] || 
               <Bell className="h-4 w-4" />;
  
  const colorClass = notificationColors[notification.type as keyof typeof notificationColors] || 
                    'text-gray-500 bg-gray-50 border-gray-200';

  return (
    <div className={`
      rounded-lg border p-4 transition-all hover:shadow-sm cursor-pointer
      ${notification.is_read 
        ? 'bg-white border-gray-200' 
        : `${colorClass.split(' ')[1]} ${colorClass.split(' ')[2]}`
      }
    `}>
      <div className="flex items-start gap-3">
        <div className={`
          p-2 rounded-lg flex-shrink-0
          ${notification.is_read ? 'bg-gray-100 text-gray-500' : colorClass}
        `}>
          {icon}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-sm">{notification.title}</h4>
            {!notification.is_read && (
              <button
                onClick={onMarkRead}
                className="text-xs text-blue-500 hover:text-blue-600 flex-shrink-0"
              >
                Mark read
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{notification.message}</p>
          
          {/* Additional data display */}
          {notification.data && notification.data.points && (
            <div className="flex items-center gap-1 text-xs text-yellow-600">
              <Star className="h-3 w-3" />
              <span>+{notification.data.points} XP earned</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatTimeAgo(notification.created_at)}</span>
            {notification.is_read && (
              <CheckCircle className="h-3 w-3 text-green-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}