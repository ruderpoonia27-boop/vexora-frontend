import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import GameAvatar from '@/components/GameAvatar';
import { AVATAR_COLLECTION, RARITY_STYLES } from '@/data/avatarCatalog';
import { cn } from '@/lib/utils';

export const AvatarSelectionGrid = ({
  selectedAvatarId,
  onSelect,
  compact = false,
  title = 'Choose Your Battle Avatar'
}) => {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <p className="mt-1 text-xs text-muted-foreground">Pick a gaming identity you can use across profile, squads, leaderboard, and referrals.</p>
      </div>

      <div className={cn('grid gap-3', compact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4')}>
        {AVATAR_COLLECTION.map((avatar) => {
          const selected = avatar.id === selectedAvatarId;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onSelect(avatar.id)}
              className={cn(
                'group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300',
                selected
                  ? 'border-primary bg-primary/10 shadow-[0_0_28px_rgba(59,130,246,0.24)]'
                  : 'border-border/60 bg-background/45 hover:border-primary/40 hover:bg-primary/6'
              )}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {selected ? (
                <div className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  <CheckCircle2 className="h-3 w-3" />
                  Selected
                </div>
              ) : null}

              <div className="relative z-10 flex flex-col items-start gap-3">
                <GameAvatar avatarId={avatar.id} name={avatar.name} size={compact ? 'md' : 'lg'} className="rounded-[18px]" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{avatar.name}</p>
                  <span className={cn('mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]', RARITY_STYLES[avatar.rarity])}>
                    <Sparkles className="h-3 w-3" />
                    {avatar.rarity}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AvatarSelectionGrid;
