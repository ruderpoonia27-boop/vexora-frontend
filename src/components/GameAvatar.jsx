import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DEFAULT_AVATAR_ID, RARITY_STYLES, getAvatarById } from '@/data/avatarCatalog';
import { cn } from '@/lib/utils';

const sizeMap = {
  xs: 'h-8 w-8',
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
  xl: 'h-24 w-24'
};

export const GameAvatar = ({
  avatarId = DEFAULT_AVATAR_ID,
  name = 'Player',
  size = 'md',
  showRarityRing = true,
  className
}) => {
  const avatar = getAvatarById(avatarId);
  const initials = String(name || 'P').trim().slice(0, 2).toUpperCase();

  return (
    <Avatar
      className={cn(
        'overflow-hidden rounded-2xl border bg-background shadow-[0_0_24px_rgba(59,130,246,0.12)]',
        sizeMap[size] || sizeMap.md,
        showRarityRing ? RARITY_STYLES[avatar.rarity]?.split(' ')[0] : 'border-border/60',
        className
      )}
    >
      <AvatarImage src={avatar.imageSrc} alt={avatar.name} className="object-cover" />
      <AvatarFallback className="rounded-2xl bg-primary/15 text-xs font-black text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default GameAvatar;
