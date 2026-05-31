import React, { memo, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, Loader2, Trophy, Users, Zap } from 'lucide-react';

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

const TournamentCard = ({ tournament, onJoin }) => {
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
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
  const isCompleted = tournament.status === 'completed';
  const isDismissed = tournament.status === 'dismissed';
  const startTime = tournament.match_start_time || tournament.startTime;
  const startTimeLabel = tournament.startTimeLabel || formatDateTime(startTime);
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
    if (isFull || isJoining || isJoined || isDismissed || !onJoin) return;

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
    navigate(isJoined && isSquadMatch ? `/tournament/${tournament.id}/squad-lobby` : `/tournament/${tournament.id}`);
  };

  return (
    <Link to={`/tournament/${tournament.id}`} className="block h-full">
      <div className="tournament-card bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--background))_100%)] border border-border/50 rounded-2xl overflow-hidden hover:border-primary/50 transition-all box-glow-primary group h-full flex flex-col">
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
            {matchTiming.state === 'countdown' ? (
              <span className="text-[10px] font-bold uppercase bg-destructive/10 text-destructive border border-destructive/30 px-2 py-1 rounded-md">
                {matchTiming.label}
              </span>
            ) : null}
            {matchTiming.state === 'live' ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase bg-destructive/15 text-destructive border border-destructive/40 px-2 py-1 rounded-md">
                <span className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse" />
                LIVE
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

          <div className="mt-auto">
            <div className="flex justify-between text-xs mb-2">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" /> Slots Left
              </span>
              <span className={slotsLeft <= 5 ? 'text-destructive font-bold' : 'text-secondary'}>
                {slotsLeft} slots left
              </span>
            </div>
            <div className="w-full bg-background rounded-full h-2 mb-6 overflow-hidden border border-border/30">
              <div
                style={{ transform: `scaleX(${fillPercentage / 100})` }}
                className={`h-full rounded-full origin-left transition-transform duration-700 ${fillPercentage > 90 ? 'bg-destructive' : 'bg-primary'}`}
              />
            </div>

            {isJoined ? (
              <button
                onClick={handleDetailsClick}
                className="w-full py-3 rounded-lg font-bold bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground transition-all"
              >
                {isSquadMatch ? 'Open Squad Lobby' : 'View Match'}
              </button>
            ) : isDismissed ? (
              <button
                disabled
                className="w-full py-3 rounded-lg font-bold bg-destructive/10 text-destructive cursor-not-allowed"
              >
                Match Dismissed
              </button>
            ) : isCompleted ? (
              <button
                onClick={handleDetailsClick}
                className="w-full py-3 rounded-lg font-bold bg-secondary/15 text-secondary hover:bg-secondary hover:text-secondary-foreground transition-all"
              >
                View Match
              </button>
            ) : (
              <button
                onClick={handleJoinClick}
                disabled={isFull || isJoining || isDismissed}
                className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                  isDismissed
                    ? 'bg-destructive/10 text-destructive cursor-not-allowed'
                    : isFull
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 box-glow-primary'
                }`}
              >
                {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : isDismissed ? 'Match Dismissed' : isFull ? 'Tournament Full' : 'Join Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default memo(TournamentCard);
