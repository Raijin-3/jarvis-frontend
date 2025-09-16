"use client";

import React from 'react';
import { Award, Crown, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserBadge {
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

interface BadgeCollectionProps {
  badges: UserBadge[];
}

const rarityStyles = {
  common: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-700',
    glow: '',
  },
  rare: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-700',
    glow: 'shadow-blue-200 shadow-md',
  },
  epic: {
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    text: 'text-purple-700',
    glow: 'shadow-purple-200 shadow-md',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-yellow-100 to-orange-100',
    border: 'border-yellow-400',
    text: 'text-yellow-800',
    glow: 'shadow-yellow-300 shadow-lg',
  },
};

export function BadgeCollection({ badges }: BadgeCollectionProps) {
  if (!badges || badges.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-2">
          <Award className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold">No badges yet</h3>
          <p className="text-muted-foreground">
            Keep learning and completing achievements to earn your first badge!
          </p>
        </div>
      </Card>
    );
  }

  const equippedBadges = badges.filter(b => b.is_equipped);
  const unequippedBadges = badges.filter(b => !b.is_equipped);

  return (
    <div className="space-y-6">
      {/* Equipped Badges */}
      {equippedBadges.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Equipped Badges</h3>
            <Badge variant="secondary">{equippedBadges.length} active</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {equippedBadges.map((userBadge) => (
              <BadgeCard key={userBadge.id} userBadge={userBadge} isEquipped />
            ))}
          </div>
        </div>
      )}

      {/* All Badges */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Badge Collection</h3>
          <Badge variant="secondary">{badges.length} earned</Badge>
        </div>
        
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {badges.map((userBadge) => (
            <BadgeCard key={userBadge.id} userBadge={userBadge} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface BadgeCardProps {
  userBadge: UserBadge;
  isEquipped?: boolean;
}

function BadgeCard({ userBadge, isEquipped = false }: BadgeCardProps) {
  const { badge, earned_at } = userBadge;
  const rarity = badge.rarity as keyof typeof rarityStyles;
  const styles = rarityStyles[rarity] || rarityStyles.common;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className={`
      p-4 transition-all hover:scale-105 cursor-pointer relative
      ${styles.bg} ${styles.border} ${styles.glow}
      ${isEquipped ? 'ring-2 ring-yellow-400' : ''}
    `}>
      {isEquipped && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1 rounded-full">
          <Crown className="h-3 w-3" />
        </div>
      )}

      <div className="space-y-3">
        {/* Badge Icon and Title */}
        <div className="text-center space-y-2">
          <div 
            className="mx-auto w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: badge.color_primary }}
          >
            {badge.icon}
          </div>
          <div>
            <h4 className={`font-semibold text-sm ${styles.text}`}>
              {badge.display_name}
            </h4>
            <p className="text-xs text-muted-foreground">
              {badge.description}
            </p>
          </div>
        </div>

        {/* Rarity and Date */}
        <div className="flex items-center justify-between text-xs">
          <Badge 
            className={`
              ${rarityStyles[rarity]?.bg} ${rarityStyles[rarity]?.text} border-0
              ${rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' : ''}
            `}
          >
            {rarity === 'legendary' && <Star className="h-3 w-3 mr-1" />}
            {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
          </Badge>
          <span className="text-muted-foreground">
            {formatDate(earned_at)}
          </span>
        </div>
      </div>
    </Card>
  );
}

export function BadgeMini({ badges, maxDisplay = 3 }: { badges: UserBadge[], maxDisplay?: number }) {
  if (!badges || badges.length === 0) return null;

  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className="flex items-center gap-1">
      {displayBadges.map((userBadge) => (
        <div
          key={userBadge.id}
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 border-white"
          style={{ backgroundColor: userBadge.badge.color_primary }}
          title={userBadge.badge.display_name}
        >
          {userBadge.badge.icon}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-gray-200 text-gray-600 border-2 border-white">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}