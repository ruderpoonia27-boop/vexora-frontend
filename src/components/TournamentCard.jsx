import React, { memo, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, Check, ChevronRight, Copy, Crown, Gift, KeyRound, Loader2, Medal, Radio, Trophy, Users } from 'lucide-react';
import { formatStatusLabel } from '@/lib/utils';
import { calculatePrizeBreakdown } from '@/lib/prizeUtils';

// A match counts as live for this long after its start time; older unfinished matches just show "Started".
const LIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatMatchTime = (value) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return 'Time to be announced';
  return date.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

const formatCountdown = (ms) => {
  const totalMinutes = Math.floor(ms / 60000);
  if (ms <= 60000) return `Starts in 0:${String(Math.max(0, Math.ceil(ms / 1000))).padStart(2, '0')}`;
  if (totalMinutes < 60) return `Starts in ${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  return `Starts in ${hours}h ${totalMinutes % 60}m`;
};

const getDisplayPrizePool = (tournament) => Number(
  tournament?.public_prize_pool
  ?? tournament?.publicPrizePool
  ?? tournament?.total_prize_pool
  ?? tournament?.totalPrizePool
  ?? tournament?.prizePool
  ?? tournament?.base_prize
  ?? tournament?.basePrize
  ?? 0
);

const getUserName = (user) => (user && typeof user === 'object' ? user.name || '' : '');

const getOrdinalLabel = (place) => {
  const normalized = Number(place || 1);
  if (normalized === 1) return '1st';
  if (normalized === 2) return '2nd';
  if (normalized === 3) return '3rd';
  return `${normalized}th`;
};

const placeStyles = {
  1: 'text-yellow-400',
  2: 'text-slate-300',
  3: 'text-amber-600'
};

// One row per paid prize place; places without a declared winner show as "To be announced".
const getWinnerRows = (tournament, isSquadMatch) => {
  const entries = tournament.winnerEntries || tournament.winner_entries || [];
  const resultsDeclared = entries.length > 0 || Boolean(tournament.winner_declared_at || tournament.winnerDeclaredAt || tournament.winner);
  if (!resultsDeclared) return [];

  const declaredByPlace = new Map(entries.map((entry, index) => [Number(entry.place || index + 1), entry]));
  const prizeEntries = calculatePrizeBreakdown(tournament).prizeEntries.filter((entry) => Number(entry.amount || 0) > 0);
  const fallbackWinners = { 1: tournament.winner, 2: tournament.secondWinner || tournament.second_winner, 3: tournament.thirdWinner || tournament.third_winner };

  if (prizeEntries.length > 0) {
    return prizeEntries.map((prizeEntry) => {
      const place = Number(prizeEntry.place);
      const declaredEntry = declaredByPlace.get(place);
      const name = declaredEntry
        ? (isSquadMatch
          ? (declaredEntry.squadName || declaredEntry.squad_name || '')
          : (getUserName(declaredEntry.user) || getUserName(fallbackWinners[place])))
        : '';
      return {
        place,
        name,
        amount: Number(declaredEntry?.amount || prizeEntry.amount || 0)
      };
    }).sort((left, right) => left.place - right.place);
  }

  const winnerName = isSquadMatch
    ? (tournament.winnerSquadName || tournament.winner_squad_name || '')
    : getUserName(tournament.winner);
  return winnerName
    ? [{ place: 1, name: winnerName, amount: Number(tournament.winnerPrize || tournament.winner_prize || 0) }]
    : [];
};

const gameStyles = (gameType) => (
  String(gameType || '').toLowerCase().includes('free')
    ? { badge: 'bg-orange-500/15 text-orange-300 border-orange-400/30', strip: 'from-orange-500/25 via-orange-500/5' }
    : { badge: 'bg-primary/15 text-primary border-primary/30', strip: 'from-primary/25 via-primary/5' }
);

const CopyField = ({ label, value, icon: Icon }) => {
  const [copied, setCopied] = useState(false);

  const copy = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard blocked: the value is still visible to copy by hand.
    }
  };

  return (
    <div className="min-w-0 rounded-xl border border-border/50 bg-background/70 px-3 py-2">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {Icon ? <Icon className="h-3 w-3" /> : null} {label}
      </p>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate font-mono text-sm font-black text-foreground">{value || '—'}</p>
        {value ? (
          <button
            type="button"
            onClick={copy}
            aria-label={`Copy ${label}`}
            className="relative z-10 shrink-0 rounded-lg p-1.5 text-primary transition-colors hover:bg-primary/15"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-secondary" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        ) : null}
      </div>
    </div>
  );
};

const TournamentCard = ({ tournament, onJoin }) => {
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [now, setNow] = useState(Date.now());

  const detailsUrl = `/tournament/${tournament.id}`;
  const prizePool = useMemo(() => getDisplayPrizePool(tournament), [tournament]);
  const entryType = tournament.entry_type || tournament.entryType || (Number(tournament.entry_fee || 0) > 0 ? 'paid' : 'free');
  const isFreeEntry = entryType === 'free';
  const prizeNote = tournament.prize_display_note || tournament.prizeDisplayNote || '';
  const prizePoolVisible = tournament.prize_pool_visible ?? tournament.prizePoolVisible ?? true;
  const totalSlots = Number(tournament.total_slots || 0);
  const joinedCount = Number(tournament.joined_count || 0);
  const slotsLeft = Math.max(0, totalSlots - joinedCount);
  const isFull = totalSlots > 0 && joinedCount >= totalSlots;
  const fillPercentage = totalSlots > 0 ? Math.min(100, (joinedCount / totalSlots) * 100) : 0;
  const isSquadMatch = (tournament.match_type || tournament.matchType) === 'squad';
  const squadSize = Number(tournament.squad_size || tournament.squadSize || 4);
  const isJoined = Boolean(tournament.isJoined);
  const status = tournament.status || 'active';
  const isCompleted = status === 'completed';
  const isDismissed = status === 'dismissed' || status === 'cancelled';
  const isClosed = isCompleted || isDismissed;
  const startTime = tournament.match_start_time || tournament.startTime;
  const startTimestamp = startTime ? new Date(startTime).getTime() : NaN;
  const msToStart = Number.isNaN(startTimestamp) ? null : startTimestamp - now;
  const hasStarted = !isClosed && msToStart !== null && msToStart <= 0;
  const isLive = hasStarted && -msToStart < LIVE_WINDOW_MS;
  const roomId = tournament.room_id || tournament.roomId || '';
  const roomPassword = tournament.room_password || tournament.roomPassword || '';
  const roomVisible = Boolean(roomId) && !isClosed && (tournament.roomVisible || isJoined);
  const winnerRows = useMemo(() => getWinnerRows(tournament, isSquadMatch), [isSquadMatch, tournament]);
  const game = gameStyles(tournament.game_type);

  // Re-render each second in the final minute, otherwise every 30s while the start is within a day.
  useEffect(() => {
    if (isClosed || Number.isNaN(startTimestamp)) return undefined;
    const diff = startTimestamp - Date.now();
    if (diff <= 0 || diff > 24 * 60 * 60 * 1000) return undefined;
    const intervalId = window.setInterval(() => setNow(Date.now()), diff <= 61000 ? 1000 : 30000);
    return () => window.clearInterval(intervalId);
  }, [isClosed, startTimestamp, now]);

  const countdown = !isClosed && msToStart !== null && msToStart > 0 && msToStart <= 24 * 60 * 60 * 1000
    ? formatCountdown(msToStart)
    : '';

  const statusBadge = isLive
    ? { label: 'Live', className: 'border-red-500/40 bg-red-500/15 text-red-400' }
    : hasStarted
      ? { label: 'Started', className: 'border-border bg-background/60 text-muted-foreground' }
    : isCompleted
      ? { label: 'Completed', className: 'border-accent/40 bg-accent/15 text-accent' }
      : isDismissed
        ? { label: 'Cancelled', className: 'border-destructive/40 bg-destructive/10 text-red-400' }
        : isFull
          ? { label: 'Full', className: 'border-border bg-background/60 text-muted-foreground' }
          : { label: status === 'active' ? 'Open' : formatStatusLabel(status), className: 'border-secondary/35 bg-secondary/10 text-secondary' };

  const handleJoinClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isFull || isJoining || isClosed || hasStarted) return;
    if (!onJoin) {
      navigate(detailsUrl);
      return;
    }
    setIsJoining(true);
    try {
      await onJoin(tournament);
    } finally {
      setIsJoining(false);
    }
  };

  const openUrl = isJoined && isSquadMatch && !isClosed ? `${detailsUrl}/squad-lobby` : detailsUrl;

  let action;
  if (isDismissed) {
    action = { label: 'Match cancelled', disabled: true, className: 'bg-destructive/10 text-red-400' };
  } else if (isCompleted) {
    action = { label: 'View results', to: detailsUrl, className: 'bg-accent/15 text-accent hover:bg-accent hover:text-accent-foreground' };
  } else if (isJoined) {
    action = { label: isSquadMatch ? 'Open squad lobby' : 'View match', to: openUrl, className: 'bg-secondary/15 text-secondary hover:bg-secondary hover:text-secondary-foreground' };
  } else if (hasStarted) {
    action = { label: 'Match started', disabled: true, className: 'bg-muted/40 text-muted-foreground' };
  } else if (isFull) {
    action = { label: 'Tournament full', disabled: true, className: 'bg-muted/40 text-muted-foreground' };
  } else {
    action = {
      label: isSquadMatch ? 'Create or join squad' : isFreeEntry ? 'Join free' : `Join for ${formatMoney(tournament.entry_fee)}`,
      onClick: handleJoinClick,
      className: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.25)]'
    };
  }

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] ${
        isLive ? 'border-red-500/50' : isCompleted ? 'border-accent/40' : 'border-border/60 hover:border-primary/40'
      }`}
    >
      {/* Whole card opens the tournament; buttons inside sit above this link. */}
      <Link to={openUrl} className="absolute inset-0 z-0" aria-label={`Open ${tournament.title}`} />

      <div className={`pointer-events-none bg-gradient-to-b ${game.strip} to-transparent px-4 pb-3 pt-4`}>
        <div className="flex items-center gap-2">
          <span className={`rounded-md border px-2 py-0.5 text-[11px] font-black uppercase tracking-wide ${game.badge}`}>
            {tournament.game_type || tournament.name || 'Match'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
            <Users className="h-3 w-3" /> {isSquadMatch ? `Squad · ${squadSize}` : 'Solo'}
          </span>
          <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusBadge.className}`}>
            {isLive ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> : null}
            {statusBadge.label}
          </span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-lg font-black leading-snug text-foreground">{tournament.title}</h3>
      </div>

      <div className="pointer-events-none flex flex-1 flex-col gap-3 px-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-accent/25 bg-accent/5 px-3 py-2.5">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Trophy className="h-3 w-3 text-accent" /> Prize pool
            </p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-accent">
              {prizePoolVisible ? formatMoney(prizePool) : 'Coming soon'}
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/50 px-3 py-2.5">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Gift className="h-3 w-3 text-secondary" /> Entry
            </p>
            <p className="mt-0.5 text-xl font-black tabular-nums text-foreground">
              {isFreeEntry ? <span className="text-secondary">Free</span> : formatMoney(tournament.entry_fee)}
            </p>
            {isSquadMatch && !isFreeEntry ? <p className="text-[10px] text-muted-foreground">per player · captain pays</p> : null}
          </div>
        </div>

        {prizeNote ? (
          <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">{prizeNote}</p>
        ) : null}

        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <CalendarClock className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate font-medium text-foreground">{formatMatchTime(startTime)}</span>
          </span>
          {countdown ? (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
              msToStart <= 60000 ? 'bg-red-500/15 text-red-400' : 'bg-primary/10 text-primary'
            }`}
            >
              {countdown}
            </span>
          ) : null}
        </div>

        {roomVisible ? (
          <div className="pointer-events-auto relative z-10 rounded-xl border border-primary/30 bg-primary/5 p-2.5">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-primary">
              <Radio className="h-3.5 w-3.5" /> Room details
            </p>
            <div className="grid grid-cols-2 gap-2">
              <CopyField label="Room ID" value={roomId} />
              <CopyField label="Password" value={roomPassword} icon={KeyRound} />
            </div>
          </div>
        ) : null}

        {winnerRows.length > 0 ? (
          <div className="rounded-xl border border-accent/25 bg-accent/5 p-2.5">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-accent">
              <Crown className="h-3.5 w-3.5" /> Winners
            </p>
            <ul className="space-y-1">
              {winnerRows.slice(0, 3).map((winner) => (
                <li key={winner.place} className="flex items-center gap-2 text-sm">
                  <Medal className={`h-4 w-4 shrink-0 ${placeStyles[winner.place] || 'text-muted-foreground'}`} />
                  <span className="w-8 shrink-0 text-xs font-bold text-muted-foreground">{getOrdinalLabel(winner.place)}</span>
                  <span className={`min-w-0 flex-1 truncate font-semibold ${winner.name ? 'text-foreground' : 'italic text-muted-foreground'}`}>
                    {winner.name || 'To be announced'}
                  </span>
                  {winner.amount > 0 ? <span className="shrink-0 font-bold tabular-nums text-accent">{formatMoney(winner.amount)}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-auto pt-1">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              <span className="font-bold text-foreground">{joinedCount}</span>/{totalSlots} joined
            </span>
            {!isClosed ? (
              <span className={isFull ? 'font-bold text-muted-foreground' : slotsLeft <= 5 ? 'font-bold text-red-400' : 'font-semibold text-secondary'}>
                {isFull ? 'No slots left' : `${slotsLeft} ${slotsLeft === 1 ? 'slot' : 'slots'} left`}
              </span>
            ) : null}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/80">
            <div
              style={{ width: `${fillPercentage}%` }}
              className={`h-full rounded-full transition-[width] duration-700 ${
                isCompleted ? 'bg-accent' : fillPercentage >= 90 ? 'bg-red-400' : 'bg-primary'
              }`}
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 pb-4">
        {action.to ? (
          <Link
            to={action.to}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-colors ${action.className}`}
          >
            {action.label} <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            disabled={action.disabled || isJoining}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors disabled:cursor-not-allowed ${action.className}`}
          >
            {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : action.label}
          </button>
        )}
      </div>
    </article>
  );
};

export default memo(TournamentCard);
