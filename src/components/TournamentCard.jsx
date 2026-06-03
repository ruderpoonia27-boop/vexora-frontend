import React, { memo, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Copy, Crown, KeyRound, Loader2, Radio, Trophy, Users, Zap } from 'lucide-react';
import { formatStatusLabel } from '@/lib/utils';

const formatDateTime = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleString();
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

const getUserName = (user) => {
  if (!user) return '';
  if (typeof user === 'string') return '';
  return user.name || user.email || '';
};

const getOrdinalLabel = (place) => {
  const normalized = Number(place || 1);
  if (normalized === 1) return '1st Prize';
  if (normalized === 2) return '2nd Prize';
  if (normalized === 3) return '3rd Prize';
  return `${normalized}th Prize`;
};

const getWinnerRows = (tournament, isSquadMatch) => {
  const entries = tournament.winnerEntries || tournament.winner_entries || [];
  if (entries.length > 0) {
    return entries
      .map((entry) => {
        const fallbackWinner = Number(entry.place) === 1
          ? tournament.winner
          : Number(entry.place) === 2
          ? (tournament.secondWinner || tournament.second_winner)
          : Number(entry.place) === 3
          ? (tournament.thirdWinner || tournament.third_winner)
          : null;
        return {
          place: Number(entry.place || 1),
          label: entry.label || getOrdinalLabel(entry.place),
          name: isSquadMatch
            ? (entry.squadName || entry.squad_name || tournament.winnerSquadName || tournament.winner_squad_name || 'Winning Squad')
            : (getUserName(entry.user) || getUserName(fallbackWinner) || 'Winner'),
          amount: Number(entry.amount || 0),
          rewardPerMember: Number(entry.rewardPerMember || entry.reward_per_member || 0)
        };
      })
      .filter((entry) => entry.name)
      .sort((left, right) => left.place - right.place);
  }

  const winnerName = isSquadMatch
    ? (tournament.winnerSquadName || tournament.winner_squad_name || '')
    : getUserName(tournament.winner);

  return winnerName ? [{
    place: 1,
    label: getOrdinalLabel(1),
    name: winnerName,
    amount: Number(tournament.winnerPrize || tournament.winner_prize || 0),
    rewardPerMember: Number(tournament.rewardPerMember || tournament.reward_per_member || 0)
  }] : [];
};

const getStatusStyle = (status, isLive) => {
  if (isLive) return 'border-destructive/40 bg-destructive/15 text-destructive';
  if (status === 'completed') return 'border-accent/40 bg-accent/15 text-accent';
  if (status === 'dismissed' || status === 'cancelled') return 'border-destructive/35 bg-destructive/10 text-destructive';
  if (status === 'pending') return 'border-primary/35 bg-primary/10 text-primary';
  return 'border-secondary/35 bg-secondary/10 text-secondary';
};

const TournamentCard = ({ tournament, onJoin }) => {
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [now, setNow] = useState(Date.now());

  const currentPrizePool = useMemo(() => getDisplayPrizePool(tournament), [tournament]);
  const entryType = tournament.entry_type || tournament.entryType || (Number(tournament.entry_fee || 0) > 0 ? 'paid' : 'free');
  const isFreeEntry = entryType === 'free';
  const prizeNote = tournament.prize_display_note || tournament.prizeDisplayNote || '';
  const totalSlots = tournament.total_slots || 0;
  const joinedCount = tournament.joined_count || 0;
  const isFull = joinedCount >= totalSlots;
  const fillPercentage = totalSlots > 0 ? Math.min(100, (joinedCount / totalSlots) * 100) : 0;
  const slotsLeft = Math.max(0, totalSlots - joinedCount);
  const isSquadMatch = (tournament.match_type || tournament.matchType) === 'squad';
  const isJoined = !!tournament.isJoined;
  const status = tournament.status || 'active';
  const isCompleted = status === 'completed';
  const isDismissed = status === 'dismissed' || status === 'cancelled';
  const startTime = tournament.match_start_time || tournament.startTime;
  const startTimeLabel = tournament.startTimeLabel || formatDateTime(startTime);
  const roomId = tournament.room_id || tournament.roomId || '';
  const roomPassword = tournament.room_password || tournament.roomPassword || '';
  const roomVisible = Boolean(roomId) && !isCompleted && !isDismissed && (tournament.roomVisible || isJoined);
  const winnerRows = useMemo(() => getWinnerRows(tournament, isSquadMatch), [isSquadMatch, tournament]);
  const hasWinner = winnerRows.length > 0 || Boolean(tournament.winner_declared_at || tournament.winnerDeclaredAt);

  const matchTiming = useMemo(() => {
    if (!startTime || isCompleted || isDismissed) {
      return { state: 'idle', label: '' };
    }

    const startTimestamp = new Date(startTime).getTime();
    if (Number.isNaN(startTimestamp)) {
      return { state: 'idle', label: '' };
    }

    const diff = startTimestamp - now;
    if (diff <= 0) {
      return { state: 'live', label: 'LIVE' };
    }
    if (diff <= 60000) {
      const seconds = Math.max(0, Math.ceil(diff / 1000));
      return { state: 'countdown', label: `Starts in 0:${String(seconds).padStart(2, '0')}` };
    }
    return { state: 'idle', label: '' };
  }, [isCompleted, isDismissed, now, startTime]);

  const statusLabel = matchTiming.state === 'live'
    ? 'Live'
    : isCompleted
    ? 'Completed'
    : formatStatusLabel(status);
  const statusStyle = getStatusStyle(status, matchTiming.state === 'live');

  useEffect(() => {
    if (!startTime || isCompleted || isDismissed) return undefined;
    const startTimestamp = new Date(startTime).getTime();
    if (Number.isNaN(startTimestamp)) return undefined;

    let intervalId = null;
    const scheduleTicker = () => {
      setNow(Date.now());
      intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    };

    const diff = startTimestamp - Date.now();
    if (diff <= 60000) {
      scheduleTicker();
      return () => window.clearInterval(intervalId);
    }

    const timeoutId = window.setTimeout(scheduleTicker, Math.min(diff - 60000, 2147483647));
    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [isCompleted, isDismissed, startTime]);

  const handleJoinClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isFull || isJoining || isJoined || isDismissed || isCompleted || !onJoin) return;

    setIsJoining(true);
    try {
      await onJoin(tournament);
    } finally {
      setIsJoining(false);
    }
  };

  const handleDetailsClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(isJoined && isSquadMatch && !isCompleted ? `/tournament/${tournament.id}/squad-lobby` : `/tournament/${tournament.id}`);
  };

  const handleCopy = async (event, value, key) => {
    event.preventDefault();
    event.stopPropagation();
    if (!value || !navigator?.clipboard) return;
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(''), 1200);
  };

  return (
    <Link to={`/tournament/${tournament.id}`} className="block h-full">
      <div className={`tournament-card relative bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--background))_100%)] border rounded-2xl overflow-hidden transition-all box-glow-primary group h-full flex flex-col ${isCompleted ? 'border-accent/50' : 'border-border/50 hover:border-primary/50'}`}>
        {isCompleted ? (
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-primary to-secondary" />
        ) : null}
        <div className="p-6 flex-grow flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider border ${
              tournament.game_type === 'BGMI' ? 'bg-primary/10 text-primary border-primary/25' : 'bg-secondary/10 text-secondary border-secondary/25'
            }`}>
              {tournament.game_type}
            </span>
            <span className="text-[10px] font-bold uppercase bg-background/80 border border-border/60 px-2.5 py-1 rounded-md text-muted-foreground">
              {isSquadMatch ? 'Squad' : 'Solo'}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase border px-2.5 py-1 rounded-md ${statusStyle}`}>
              {matchTiming.state === 'live' ? <span className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse" /> : null}
              {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : null}
              {statusLabel}
            </span>
            {matchTiming.state === 'countdown' ? (
              <span className="text-[10px] font-bold uppercase bg-destructive/10 text-destructive border border-destructive/30 px-2 py-1 rounded-md">
                {matchTiming.label}
              </span>
            ) : null}
            {hasWinner ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase border border-accent/30 bg-accent/10 px-2 py-1 rounded-md text-accent">
                <Crown className="h-3 w-3" /> Results Out
              </span>
            ) : null}
            {roomVisible ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase border border-primary/30 bg-primary/10 px-2 py-1 rounded-md text-primary">
                <Radio className="h-3 w-3" /> Room Live
              </span>
            ) : null}
          </div>

          <div className="mb-5">
            <h3 className="text-xl font-black leading-tight text-foreground">{tournament.title}</h3>
          </div>

          <div className="mb-5 rounded-2xl border border-accent/30 bg-accent/5 p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <Trophy className="h-4 w-4" /> Prize Pool
            </p>
            <p className="text-4xl font-black text-accent text-glow-accent">Rs.{currentPrizePool}</p>
            {prizeNote ? (
              <p className="mt-2 inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {prizeNote}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 mb-5 sm:grid-cols-2">
            <div className="bg-background/80 p-3 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <CalendarClock className="w-3 h-3 text-primary" /> Match Time
              </p>
              <p className="font-semibold text-primary leading-snug">{startTimeLabel}</p>
            </div>
            <div className="bg-background/80 p-3 rounded-lg border border-secondary/20">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-secondary" /> Entry Fee
              </p>
              {isFreeEntry ? (
                <p className="inline-flex rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 text-xs font-black text-secondary">FREE</p>
              ) : (
                <p className="font-semibold text-secondary">Rs.{tournament.entry_fee}</p>
              )}
            </div>
          </div>

          {roomVisible ? (
            <div className="mb-5 rounded-2xl border border-primary/25 bg-primary/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
                  <Radio className="h-4 w-4" /> Battle Room
                </p>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Published</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Room ID</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate font-mono text-sm font-black text-foreground">{roomId}</p>
                    <button
                      type="button"
                      onClick={(event) => handleCopy(event, roomId, 'roomId')}
                      className="shrink-0 rounded-lg border border-primary/25 bg-primary/10 p-1.5 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      title="Copy room ID"
                    >
                      {copiedKey === 'roomId' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/70 p-3">
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><KeyRound className="h-3 w-3" /> Password</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate font-mono text-sm font-black text-foreground">{roomPassword || 'None'}</p>
                    {roomPassword ? (
                      <button
                        type="button"
                        onClick={(event) => handleCopy(event, roomPassword, 'roomPassword')}
                        className="shrink-0 rounded-lg border border-primary/25 bg-primary/10 p-1.5 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                        title="Copy password"
                      >
                        {copiedKey === 'roomPassword' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {winnerRows.length > 0 ? (
            <div className="mb-5 rounded-2xl border border-accent/30 bg-[linear-gradient(135deg,rgba(34,197,94,0.10),rgba(14,165,233,0.06))] p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-accent">
                <Crown className="h-4 w-4" /> Match Winners
              </p>
              <div className="space-y-2">
                {winnerRows.slice(0, 3).map((winner) => (
                  <div key={`${winner.place}-${winner.name}`} className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/60 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{winner.label}</p>
                      <p className="truncate text-sm font-black text-foreground">{winner.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {winner.amount > 0 ? <p className="text-sm font-black text-accent">Rs.{winner.amount}</p> : null}
                      {isSquadMatch && winner.rewardPerMember > 0 ? <p className="text-[10px] text-muted-foreground">Rs.{winner.rewardPerMember}/member</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-auto">
            <div className="flex justify-between text-xs mb-2">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" /> {isCompleted || isDismissed ? 'Players Joined' : 'Slots Left'}
              </span>
              <span className={slotsLeft <= 5 && !isCompleted && !isDismissed ? 'text-destructive font-bold' : 'text-secondary'}>
                {isCompleted || isDismissed ? `${joinedCount}/${totalSlots}` : `${slotsLeft} slots left`}
              </span>
            </div>
            <div className="w-full bg-background rounded-full h-2 mb-6 overflow-hidden border border-border/30">
              <div
                style={{ transform: `scaleX(${fillPercentage / 100})` }}
                className={`h-full rounded-full origin-left transition-transform duration-700 ${isCompleted ? 'bg-accent' : fillPercentage > 90 ? 'bg-destructive' : 'bg-primary'}`}
              />
            </div>

            {isDismissed ? (
              <button
                disabled
                className="w-full py-3 rounded-lg font-bold bg-destructive/10 text-destructive cursor-not-allowed"
              >
                Match Dismissed
              </button>
            ) : isCompleted ? (
              <button
                onClick={handleDetailsClick}
                className="w-full py-3 rounded-lg font-bold bg-accent/15 text-accent hover:bg-accent hover:text-accent-foreground transition-all"
              >
                View Results
              </button>
            ) : isJoined ? (
              <button
                onClick={handleDetailsClick}
                className="w-full py-3 rounded-lg font-bold bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground transition-all"
              >
                {isSquadMatch ? 'Open Squad Lobby' : 'View Match'}
              </button>
            ) : (
              <button
                onClick={handleJoinClick}
                disabled={isFull || isJoining || isDismissed || isCompleted}
                className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                  isFull
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 box-glow-primary'
                }`}
              >
                {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : isFull ? 'Tournament Full' : 'Join Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default memo(TournamentCard);