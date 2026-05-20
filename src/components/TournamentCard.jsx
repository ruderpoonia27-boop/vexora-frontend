import React, { memo, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Copy, Crown, Loader2, RotateCcw, Shield, Trophy, Users, Zap } from 'lucide-react';
import { calculatePrizeBreakdown } from '@/lib/prizeUtils';

const TournamentCard = ({ tournament, onJoin }) => {
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [now, setNow] = useState(Date.now());

  const prizeBreakdown = useMemo(() => calculatePrizeBreakdown(tournament), [tournament]);
  const currentPrizePool = prizeBreakdown.prizePool;
  const totalSlots = tournament.total_slots || 0;
  const joinedCount = tournament.joined_count || 0;
  const isFull = joinedCount >= totalSlots;
  const fillPercentage = totalSlots > 0 ? Math.min(100, (joinedCount / totalSlots) * 100) : 0;
  const slotsLeft = Math.max(0, totalSlots - joinedCount);
  const isSquadMatch = (tournament.match_type || tournament.matchType) === 'squad';
  const isJoined = !!tournament.isJoined;
  const isCompleted = tournament.status === 'completed';
  const isDismissed = tournament.status === 'dismissed';
  const roomVisible = !!tournament.roomVisible;
  const roomId = tournament.room_id || tournament.roomId || '';
  const roomPassword = tournament.room_password || tournament.roomPassword || '';
  const startTimeLabel = tournament.startTimeLabel || 'Not set';
  const startTime = tournament.match_start_time || tournament.startTime;
  const winnerName = tournament.winner?.name || tournament.winner?.email || 'Winner not declared';
  const refundProcessed = !!(tournament.refund_processed || tournament.refundProcessed);
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

  const copyValue = async (event, text) => {
    event.preventDefault();
    event.stopPropagation();
    if (!text) return;
    await navigator.clipboard.writeText(text);
  };

  return (
    <Link to={`/tournament/${tournament.id}`} className="block h-full">
      <div className="tournament-card bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/50 transition-all box-glow-primary group h-full flex flex-col">
        <div className="p-6 flex-grow flex flex-col">
          <div className="flex justify-between items-start gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                tournament.game_type === 'BGMI' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
              }`}>
                {tournament.game_type}
              </span>
              <span className="text-[10px] font-bold uppercase bg-background/90 border border-border/50 px-2 py-1 rounded-md">
                {isSquadMatch ? 'Squad' : 'Solo'}
              </span>
              {isJoined ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-accent/10 text-accent px-2 py-1 rounded-md">
                  <CheckCircle2 className="w-3 h-3" /> Joined
                </span>
              ) : null}
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${
                isDismissed
                  ? 'bg-destructive/15 text-destructive'
                  : isCompleted
                  ? 'bg-secondary/15 text-secondary'
                  : tournament.status === 'active'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-background/90 border border-border/50 text-muted-foreground'
              }`}>
                {tournament.status}
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
            <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-md flex items-center gap-1">
              <Users className="w-3 h-3" />
              {joinedCount}/{totalSlots}
            </span>
          </div>

          <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">
            {tournament.title || `${tournament.game_type} Showdown`}
          </h3>

          <div className={`grid gap-3 mb-4 ${isSquadMatch ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
            {isSquadMatch ? (
              <div className="bg-background p-3 rounded-lg border border-border/30">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Entry Fee
                </p>
                <p className="font-bold text-foreground">Rs.{tournament.entry_fee}</p>
              </div>
            ) : null}
            <div className="bg-background p-3 rounded-lg border border-accent/30 soft-neon-tile">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Prize Pool
              </p>
              <p className="font-bold text-accent text-glow-accent">Rs.{currentPrizePool}</p>
            </div>
            {isSquadMatch ? (
              <div className="bg-background p-3 rounded-lg border border-primary/30 soft-neon-tile">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Crown className="w-3 h-3" /> First Prize
                </p>
                <p className="font-bold text-primary text-glow-primary">Rs.{prizeBreakdown.firstPrize}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{prizeBreakdown.firstPrizePercentage}% payout</p>
              </div>
            ) : (
              <>
                <div className="bg-background p-3 rounded-lg border border-yellow-400/30 soft-neon-tile">
                  <p className="text-xs text-muted-foreground mb-1">#1 Prize</p>
                  <p className="font-bold text-yellow-300">Rs.{prizeBreakdown.firstPrize}</p>
                </div>
                <div className="bg-background p-3 rounded-lg border border-slate-300/20">
                  <p className="text-xs text-muted-foreground mb-1">#2 Prize</p>
                  <p className="font-bold text-slate-200">Rs.{prizeBreakdown.secondPrize}</p>
                </div>
                <div className="bg-background p-3 rounded-lg border border-orange-400/25">
                  <p className="text-xs text-muted-foreground mb-1">#3 Prize</p>
                  <p className="font-bold text-orange-300">Rs.{prizeBreakdown.thirdPrize}</p>
                </div>
              </>
            )}
          </div>

          {isDismissed ? (
            <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-destructive">
                <AlertTriangle className="w-3.5 h-3.5" />
                Match dismissed
              </div>
              <div className="text-xs text-muted-foreground">
                {refundProcessed
                  ? `Entry fee refunded: Rs.${tournament.entry_fee || 0}`
                  : 'This match was closed by admin before completion.'}
              </div>
              {refundProcessed ? (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Refund processed
                </div>
              ) : null}
            </div>
          ) : isCompleted ? (
            <div className="mb-5 rounded-xl border border-secondary/30 bg-secondary/10 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
                <Crown className="w-3.5 h-3.5" />
                Match completed
              </div>
              <div className="text-sm">
                <p className="font-semibold text-foreground">{winnerName}</p>
                <p className="text-xs text-muted-foreground">Winner</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Prize credited: <span className="font-semibold text-secondary">Rs.{tournament.winner_prize || 0}</span>
              </div>
            </div>
          ) : null}

          {isJoined ? (
            <div className="mb-5 rounded-xl border border-border/50 bg-background/60 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Shield className="w-3.5 h-3.5 text-primary" />
                {roomVisible ? 'Room details available' : isCompleted ? 'Match summary' : 'Match access status'}
              </div>
              {roomVisible ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Room ID</p>
                      <p className="font-mono font-semibold">{roomId}</p>
                    </div>
                    <button
                      onClick={(event) => copyValue(event, roomId)}
                      className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      title="Copy room id"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Password</p>
                      <p className="font-mono font-semibold">{roomPassword || 'None'}</p>
                    </div>
                    {roomPassword ? (
                      <button
                        onClick={(event) => copyValue(event, roomPassword)}
                        className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        title="Copy password"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  {isDismissed
                    ? (refundProcessed
                      ? `Match dismissed and refund sent. Amount returned: Rs.${tournament.entry_fee || 0}`
                      : 'Match dismissed by admin. Open details for the latest update.')
                    : isCompleted
                    ? (tournament.winner ? `Winner declared. Open details to see full result and room history.` : 'Match completed. Open details to see the latest status.')
                    : roomId
                      ? `Room and pass available at ${startTimeLabel}`
                      : 'Room and pass will appear here after admin shares them.'}
                </div>
              )}
            </div>
          ) : null}

          <div className="mt-auto">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-muted-foreground">Filling Fast</span>
              <span className={slotsLeft <= 5 ? 'text-destructive font-bold' : 'text-secondary'}>
                {slotsLeft} slots left
              </span>
            </div>
            <div className="w-full bg-background rounded-full h-2 mb-6 overflow-hidden border border-border/30">
              <div
                style={{ transform: `scaleX(${fillPercentage / 100})` }}
                className={`h-full rounded-full ${fillPercentage > 90 ? 'bg-destructive' : 'bg-primary'}`}
              />
            </div>

            {isJoined ? (
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <button
                  disabled
                  className={`py-3 rounded-lg font-bold cursor-default ${
                    isDismissed
                      ? 'bg-destructive/15 text-destructive'
                      : isCompleted
                        ? 'bg-secondary/15 text-secondary'
                        : 'bg-accent/10 text-accent'
                  }`}
                >
                  {isDismissed ? 'Dismissed' : isCompleted ? 'Completed' : 'Joined'}
                </button>
                <button
                  onClick={handleDetailsClick}
                  disabled={isDismissed}
                  className={`px-4 py-3 rounded-lg font-bold transition-all ${
                    isDismissed
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                  }`}
                >
                  {isSquadMatch ? 'Squad Lobby' : 'See Details'}
                </button>
              </div>
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
                See Result
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
                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground box-glow-primary'
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
