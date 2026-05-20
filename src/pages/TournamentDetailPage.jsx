import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Zap, Shield, Loader2, CalendarClock, Copy, Check, Clock, Crown, RotateCcw, Users, XCircle, Gift } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { calculatePrizeBreakdown } from '@/lib/prizeUtils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GameAvatar from '@/components/GameAvatar';
import { getPlatformName, useSettings } from '@/hooks/useSettings';

const formatDateTime = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const getUserId = (user) => {
  if (!user) return '';
  if (typeof user === 'string') return user;
  return String(user?._id || user?.id || user);
};

const TournamentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, currentUser, refreshUser } = useAuth();
  const { settings } = useSettings();
  const platformName = getPlatformName(settings);
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinIntent, setJoinIntent] = useState({ mode: 'solo' });
  const [joinDetails, setJoinDetails] = useState({ inGameName: '', gameUid: '' });
  const [joinMethod, setJoinMethod] = useState('wallet');
  const [squadJoinMode, setSquadJoinMode] = useState('create');
  const [squadForm, setSquadForm] = useState({ squadName: '', squadPassword: '' });

  const loadTournament = async ({ showLoading = false, silent = false } = {}) => {
    if (!id || id === 'undefined') {
      if (!silent) {
        toast({ title: 'Error', description: 'Invalid tournament link.', variant: 'destructive' });
        navigate('/tournaments');
      }
      setLoading(false);
      return null;
    }

    if (showLoading) setLoading(true);
    try {
      const data = await apiClient.get(`/tournaments/${id}`);
      setTournament(data);
      return data;
    } catch (error) {
      if (!silent) {
        toast({ title: 'Error', description: 'Tournament not found', variant: 'destructive' });
        navigate('/tournaments');
      }
      return null;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    setTournament(null);
    setLoading(true);
    setJoinDialogOpen(false);
    setCopiedId(false);
    setCopiedPassword(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadTournament({ showLoading: true });
  }, [id]);

  useEffect(() => {
    const handleFocus = () => {
      loadTournament({ silent: true });
    };

    const intervalId = window.setInterval(() => {
      loadTournament({ silent: true });
    }, 15000);

    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [id]);

  useEffect(() => {
    if (!tournament?.startTime) {
      setTimeRemaining('');
      return undefined;
    }

    const updateTimer = () => {
      const diff = new Date(tournament.startTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeRemaining('Started');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [tournament]);

  const currentUserId = getUserId(currentUser);
  const matchType = tournament?.match_type || tournament?.matchType || 'solo';
  const joinedCount = tournament?.joined_count || tournament?.currentPlayers?.length || 0;
  const totalSlots = tournament?.total_slots || tournament?.totalSlots || 0;
  const entryFee = tournament?.entry_fee || tournament?.entryFee || 0;
  const prizeBreakdown = calculatePrizeBreakdown(tournament);
  const currentPrizePool = prizeBreakdown.prizePool;
  const isFull = joinedCount >= totalSlots;
  const fillPercentage = totalSlots > 0 ? Math.min(100, (joinedCount / totalSlots) * 100) : 0;
  const isJoinable = tournament?.status === 'active';
  const isDismissed = tournament?.status === 'dismissed';
  const roomId = tournament?.room_id || tournament?.roomId || '';
  const roomPassword = tournament?.room_password || tournament?.roomPassword || '';
  const roomVisibleAtStartTime = tournament?.startTime ? new Date(tournament.startTime).getTime() <= Date.now() : false;
  const refundProcessed = !!(tournament?.refund_processed || tournament?.refundProcessed);
  const canSeeRoomDetails = Boolean(roomId) && (roomVisibleAtStartTime || tournament?.status === 'completed' || tournament?.status === 'dismissed');
  const gameUidLabel = (tournament?.game_type || tournament?.name) === 'Free Fire' ? 'Free Fire UID' : 'BGMI UID';
  const freeEntriesAvailable = Math.max(
    0,
    Number(
      currentUser?.freeEntriesAvailable
      ?? currentUser?.referral_stats?.free_entries_available
      ?? 0
    )
  );

  const participantProfilesByUserId = useMemo(() => {
    const entries = (tournament?.participant_profiles || []).map((profile) => [
      getUserId(profile.user || profile.userId),
      profile
    ]).filter(([userId]) => Boolean(userId));
    return new Map(entries);
  }, [tournament]);

  const currentSquad = useMemo(() => {
    if (!tournament?.squads || !currentUserId) return null;
    return tournament.squads.find((squad) => (squad.members || []).some((member) => getUserId(member) === currentUserId)) || null;
  }, [currentUserId, tournament]);

  const currentSquadMembers = useMemo(() => {
    if (!currentSquad) return [];
    return (currentSquad.members || []).map((member) => {
      const memberId = getUserId(member);
      const profile = participantProfilesByUserId.get(memberId) || null;
      return { member, profile, memberId };
    });
  }, [currentSquad, participantProfilesByUserId]);

  const hasJoined = useMemo(() => {
    if (!currentUserId || !tournament) return false;
    if ((tournament.currentPlayers || []).some((player) => getUserId(player) === currentUserId)) return true;
    return Boolean(currentSquad);
  }, [currentSquad, currentUserId, tournament]);

  const copyToClipboard = (text, setCopied) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const ensureAuthenticated = () => {
    if (isAuthenticated) return true;
    navigate('/login', { state: { from: { pathname: `/tournament/${id}` } } });
    return false;
  };

  const refreshAfterJoin = async () => {
    await refreshUser();
    await loadTournament({ silent: true });
  };

  const handleSoloJoin = async (details) => {
    if (details.joinMethod !== 'free_entry' && (currentUser?.walletBalance || 0) < entryFee) {
      toast({ title: 'Insufficient Balance', description: 'Please add money to your wallet to join.', variant: 'destructive' });
      navigate('/wallet');
      return false;
    }

    setIsJoining(true);
    try {
      await apiClient.post(`/tournaments/${id}/join`, { userId: currentUserId, ...details });
      await refreshAfterJoin();
      toast({
        title: 'Success!',
        description: details.joinMethod === 'free_entry'
          ? 'You joined successfully using 1 Referral Reward Entry.'
          : 'You have successfully joined the tournament.'
      });
      return true;
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to join tournament.', variant: 'destructive' });
      return false;
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateSquad = async (details) => {
    if (details.joinMethod !== 'free_entry' && (currentUser?.walletBalance || 0) < entryFee) {
      toast({ title: 'Insufficient Balance', description: 'Please add money to your wallet to create and join a squad.', variant: 'destructive' });
      navigate('/wallet');
      return false;
    }

    setIsJoining(true);
    try {
      await apiClient.post(`/tournaments/${id}/squads`, { userId: currentUserId, ...details });
      setSquadForm({ squadName: '', squadPassword: '' });
      await refreshAfterJoin();
      toast({
        title: 'Squad created',
        description: details.joinMethod === 'free_entry'
          ? 'Your squad is ready and 1 Referral Reward Entry has been used.'
          : 'Your squad is ready and you have joined the tournament.'
      });
      navigate(`/tournament/${id}/squad-lobby`);
      return true;
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to create squad.', variant: 'destructive' });
      return false;
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinSquadByPassword = async (details) => {
    if (details.joinMethod !== 'free_entry' && (currentUser?.walletBalance || 0) < entryFee) {
      toast({ title: 'Insufficient Balance', description: 'Please add money to your wallet to join a squad.', variant: 'destructive' });
      navigate('/wallet');
      return false;
    }

    setIsJoining(true);
    try {
      await apiClient.post(`/tournaments/${id}/squads/join-by-password`, { userId: currentUserId, ...details });
      await refreshAfterJoin();
      toast({
        title: 'Squad joined',
        description: details.joinMethod === 'free_entry'
          ? 'You joined the squad using 1 Referral Reward Entry.'
          : 'You joined the squad successfully.'
      });
      navigate(`/tournament/${id}/squad-lobby`);
      return true;
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to join squad.', variant: 'destructive' });
      return false;
    } finally {
      setIsJoining(false);
    }
  };

  const openJoinDialog = (mode, squad = null, forcedSquadMode = '') => {
    if (!ensureAuthenticated()) return;
    if (mode === 'squad') {
      const nextMode = forcedSquadMode || (squad ? 'joinExisting' : ((tournament?.squads?.length || 0) > 0 ? 'joinExisting' : 'create'));
      setSquadJoinMode(nextMode);
      setSquadForm((current) => ({
        squadName: nextMode === 'create' ? current.squadName : '',
        squadPassword: ''
      }));
      setJoinIntent({ mode: 'squad' });
    } else {
      setJoinIntent({ mode });
    }
    setJoinMethod('wallet');
    setJoinDialogOpen(true);
  };

  const submitJoinDetails = async () => {
    if (!joinDetails.inGameName.trim()) {
      toast({ title: 'Missing Name', description: 'Please enter your in-game name.', variant: 'destructive' });
      return;
    }
    if (!joinDetails.gameUid.trim()) {
      toast({ title: 'Missing UID', description: `Please enter your ${gameUidLabel}.`, variant: 'destructive' });
      return;
    }

    const payload = {
      inGameName: joinDetails.inGameName.trim(),
      gameUid: joinDetails.gameUid.trim(),
      joinMethod
    };

    let success = false;
    if (joinIntent.mode === 'solo') {
      success = await handleSoloJoin(payload);
    } else if (joinIntent.mode === 'squad') {
      if (squadJoinMode === 'create') {
        if (!squadForm.squadName.trim()) {
          toast({ title: 'Squad name required', description: 'Enter a squad name for your squad.', variant: 'destructive' });
          return;
        }
        if (!squadForm.squadPassword.trim()) {
          toast({ title: 'Squad password required', description: 'Enter a squad password for your teammates.', variant: 'destructive' });
          return;
        }
        success = await handleCreateSquad({
          ...payload,
          squadName: squadForm.squadName.trim(),
          squadPassword: squadForm.squadPassword.trim()
        });
      } else {
        if (!squadForm.squadPassword.trim()) {
          toast({ title: 'Squad password required', description: 'Enter the squad password shared by your leader.', variant: 'destructive' });
          return;
        }
        success = await handleJoinSquadByPassword({
          ...payload,
          squadPassword: squadForm.squadPassword.trim()
        });
      }
    }

    if (success) {
      setJoinDialogOpen(false);
      setJoinDetails({ inGameName: '', gameUid: '' });
      setJoinIntent({ mode: 'solo' });
      setJoinMethod('wallet');
      setSquadJoinMode('create');
      setSquadForm({ squadName: '', squadPassword: '' });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!tournament) return null;

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <Helmet>
        <title>{tournament.title} | {platformName}</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-5xl">
        <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 md:p-12 border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wider bg-primary/10 text-primary">
                {tournament.game_type}
              </span>
              <span className="px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wider bg-background/70 border border-border/50">
                {matchType}
              </span>
              <div className={`px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wider ${
                tournament.status === 'active' ? 'bg-secondary/20 text-secondary' :
                tournament.status === 'completed' ? 'bg-accent/20 text-accent' :
                'bg-muted text-muted-foreground'
              }`}>
                {tournament.status}
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">{tournament.title}</h1>

            <div className="flex flex-wrap items-center gap-3 mb-8">
              <div className="flex items-center gap-2 text-muted-foreground text-lg bg-background/50 border border-border/50 px-4 py-2 rounded-lg">
                <CalendarClock className="w-5 h-5 text-accent" />
                <span>Starts: <strong className="text-foreground">{formatDateTime(tournament.startTime)}</strong></span>
              </div>
              {matchType === 'squad' ? (
                <div className="flex items-center gap-2 text-muted-foreground text-lg bg-background/50 border border-border/50 px-4 py-2 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                  <span>{tournament.squad_size} players per squad</span>
                </div>
              ) : null}
            </div>

            <div className={`grid grid-cols-1 gap-6 ${matchType === 'squad' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              <div className="bg-background/50 p-6 rounded-2xl border border-border/50 text-center">
                <p className="text-muted-foreground mb-2 flex items-center justify-center gap-2"><Zap className="w-4 h-4" /> Entry Fee</p>
                <p className="text-3xl font-bold">Rs.{entryFee}</p>
              </div>
              <div className="bg-background/50 p-6 rounded-2xl border border-primary/30 text-center box-glow-primary">
                <p className="text-primary mb-2 flex items-center justify-center gap-2"><Trophy className="w-4 h-4" /> Prize Pool</p>
                <p className="text-4xl md:text-5xl font-bold text-glow-primary text-primary">Rs.{currentPrizePool}</p>
              </div>
              {matchType === 'squad' ? (
                <>
                  <div className="bg-background/50 p-6 rounded-2xl border border-accent/30 text-center soft-neon-tile">
                    <p className="text-accent mb-2 flex items-center justify-center gap-2"><Crown className="w-4 h-4" /> First Prize</p>
                    <p className="text-3xl font-bold text-accent text-glow-accent">Rs.{prizeBreakdown.firstPrize}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{prizeBreakdown.firstPrizePercentage}% of prize pool</p>
                  </div>
                  <div className="bg-background/50 p-6 rounded-2xl border border-border/50 text-center">
                <p className="text-muted-foreground mb-2 flex items-center justify-center gap-2"><Users className="w-4 h-4" /> Squad Size</p>
                    <p className="text-3xl font-bold">{prizeBreakdown.squadSize}</p>
                  </div>
                </>
              ) : null}
            </div>
            {matchType === 'solo' ? (
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Reward Pool</p>
                  <p className="text-2xl font-bold text-accent">Rs.{prizeBreakdown.rewardPool}</p>
                  <p className="text-xs text-muted-foreground">50% of collection</p>
                </div>
                <div className="rounded-2xl border border-yellow-400/30 bg-background/50 p-4 text-center">
                  <p className="text-xs text-muted-foreground">#1 Prize ({prizeBreakdown.soloFirstPercentage}%)</p>
                  <p className="text-2xl font-bold text-yellow-300">Rs.{prizeBreakdown.firstPrize}</p>
                </div>
                <div className="rounded-2xl border border-slate-300/20 bg-background/50 p-4 text-center">
                  <p className="text-xs text-muted-foreground">#2 Prize ({prizeBreakdown.soloSecondPercentage}%)</p>
                  <p className="text-2xl font-bold text-slate-200">Rs.{prizeBreakdown.secondPrize}</p>
                </div>
                <div className="rounded-2xl border border-orange-400/25 bg-background/50 p-4 text-center">
                  <p className="text-xs text-muted-foreground">#3 Prize ({prizeBreakdown.soloThirdPercentage}%)</p>
                  <p className="text-2xl font-bold text-orange-300">Rs.{prizeBreakdown.thirdPrize}</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="p-8 md:p-12 space-y-8">
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">Registration Status</h3>
                  <p className="text-muted-foreground text-sm">{joinedCount} of {totalSlots} players joined</p>
                </div>
                <span className="text-2xl font-bold text-secondary">{Math.round(fillPercentage)}%</span>
              </div>
              <div className="w-full bg-background rounded-full h-4 overflow-hidden border border-border/50">
                <div className={`h-full rounded-full transition-all duration-1000 ${fillPercentage > 90 ? 'bg-destructive' : 'bg-secondary'}`} style={{ width: `${fillPercentage}%` }} />
              </div>
            </div>

            {tournament.winner ? (
              <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-secondary" />
                  <h3 className="text-xl font-bold text-secondary">Winner</h3>
                </div>
                {matchType === 'squad' && tournament.winnerSquadName ? (
                  <p className="font-semibold">{tournament.winnerSquadName}</p>
                ) : (
                  <div className="flex items-center gap-3">
                    <GameAvatar avatarId={tournament.winner.avatarId || tournament.winner.avatar_id} name={tournament.winner.name || tournament.winner.email} size="sm" className="rounded-xl" />
                    <p className="font-semibold">{tournament.winner.name || tournament.winner.email}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">First Prize: Rs.{tournament.winner_prize || 0}</p>
                {matchType === 'squad' ? (
                  <p className="text-sm text-muted-foreground">Reward per member: Rs.{tournament.rewardPerMember || tournament.reward_per_member || 0}</p>
                ) : null}
                <p className="text-sm text-muted-foreground">Declared at: {formatDateTime(tournament.winner_declared_at)}</p>
              </div>
            ) : null}

            {isDismissed ? (
              <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-destructive" />
                  <h3 className="text-xl font-bold text-destructive">Match Dismissed</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {refundProcessed
                    ? `Your entry amount of Rs.${entryFee} has been refunded to joined players.`
                    : 'This match was dismissed by the admin before completion.'}
                </p>
                {refundProcessed ? (
                  <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    <RotateCcw className="w-4 h-4" />
                    Refunded at {formatDateTime(tournament.refunded_at)}
                  </div>
                ) : null}
              </div>
            ) : null}

            {hasJoined ? (
              <div className="bg-accent/10 border border-accent/30 rounded-2xl p-8 text-center box-glow-accent space-y-6">
                <div>
                  <Shield className="w-12 h-12 text-accent mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-accent mb-2">{isDismissed ? 'Match Status Updated' : "You're In!"}</h3>
                  <p className="text-muted-foreground">
                    {isDismissed
                      ? (refundProcessed
                        ? 'This match was dismissed and the refund has already been processed.'
                        : 'This match was dismissed by admin. Any new match access is closed.')
                      : 'Room details are only visible to joined players and unlock at the match start time.'}
                  </p>
                </div>

                {matchType === 'squad' && currentSquad ? (
                  <div className="bg-background p-5 rounded-2xl border border-border text-left">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Your Squad</p>
                        <p className="text-xl font-bold">{currentSquad.name}</p>
                        <p className="text-sm text-muted-foreground">Squad lobby is ready for your team.</p>
                      </div>
                      <div className="space-y-2 text-right">
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase bg-primary/10 text-primary">
                          {(currentSquad.memberCount || currentSquad.members?.length || 0)}/{tournament.squad_size}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {(tournament.squad_size || 0) - (currentSquad.memberCount || currentSquad.members?.length || 0) > 0
                            ? `Waiting for ${(tournament.squad_size || 0) - (currentSquad.memberCount || currentSquad.members?.length || 0)} player(s)`
                            : 'Squad complete'}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {currentSquadMembers.map(({ member, profile, memberId }) => (
                        <div key={memberId} className="rounded-xl border border-border/70 bg-background/60 px-3 py-3 space-y-2">
                          <div className="flex items-center gap-3">
                            <GameAvatar avatarId={member.avatarId || member.avatar_id} name={member.name} size="sm" className="rounded-xl" />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">{member.name || 'Unknown Player'}</p>
                                {getUserId(currentSquad.captain) === memberId ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                                    <Crown className="h-3 w-3" /> Leader
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-xs text-muted-foreground">{profile?.inGameName || profile?.in_game_name || 'Game name not added yet'}</p>
                            </div>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 text-xs">
                            <div className="rounded-xl bg-background/70 px-3 py-2">
                              <p className="uppercase tracking-[0.16em] text-muted-foreground">UID</p>
                              <p className="mt-1 font-medium text-foreground break-all">{profile?.gameUid || profile?.game_uid || 'Pending'}</p>
                            </div>
                            <div className="rounded-xl bg-background/70 px-3 py-2">
                              <p className="uppercase tracking-[0.16em] text-muted-foreground">Join Status</p>
                              <p className="mt-1 font-medium text-secondary">Confirmed</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/tournament/${id}/squad-lobby`)}
                      className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Open Squad Lobby
                    </button>
                  </div>
                ) : null}

                {canSeeRoomDetails ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="bg-background p-4 rounded-xl border border-border flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Room ID</p>
                        <p className="font-mono text-lg font-bold">{roomId}</p>
                      </div>
                      <button onClick={() => copyToClipboard(roomId, setCopiedId)} className="p-2 hover:bg-accent/10 text-muted-foreground hover:text-accent rounded-lg transition-colors" title="Copy Room ID">
                        {copiedId ? <Check className="w-5 h-5 text-accent" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="bg-background p-4 rounded-xl border border-border flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Password</p>
                        <p className="font-mono text-lg font-bold">{roomPassword || 'None'}</p>
                      </div>
                      {roomPassword ? (
                        <button onClick={() => copyToClipboard(roomPassword, setCopiedPassword)} className="p-2 hover:bg-accent/10 text-muted-foreground hover:text-accent rounded-lg transition-colors" title="Copy Password">
                          {copiedPassword ? <Check className="w-5 h-5 text-accent" /> : <Copy className="w-5 h-5" />}
                        </button>
                      ) : null}
                    </div>
                    <div className="md:col-span-2 bg-background p-4 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Room ID and password given at</p>
                      <p className="font-medium">{formatDateTime(tournament.room_details_set_at)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-background p-6 rounded-xl border border-border flex flex-col items-center justify-center gap-3">
                    <Clock className="w-8 h-8 text-muted-foreground animate-pulse" />
                    <p className="text-foreground font-medium">
                      {isDismissed
                        ? (refundProcessed
                          ? 'This match is dismissed. Refund details are already applied to your wallet history.'
                          : 'This match is dismissed. Room access is no longer active.')
                        : roomId
                          ? 'Room details will unlock at match start time.'
                          : 'Admin has not shared the room details yet.'}
                    </p>
                    {!isDismissed ? (
                      <div className="text-sm text-muted-foreground">
                        Room and pass provide at {formatDateTime(tournament.startTime)}
                      </div>
                    ) : null}
                    {timeRemaining ? (
                      <div className="text-2xl font-mono font-bold text-accent bg-accent/10 px-4 py-2 rounded-lg">{timeRemaining}</div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : matchType === 'solo' ? (
              <button
                onClick={() => openJoinDialog('solo')}
                disabled={isFull || isJoining || !isJoinable}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  isFull || !isJoinable
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 box-glow-primary'
                }`}
              >
                {isJoining ? <Loader2 className="w-6 h-6 animate-spin" /> : isFull ? 'Tournament Full' : !isJoinable ? `Tournament ${tournament.status}` : `Join Tournament - Rs.${entryFee}`}
              </button>
            ) : (
              <div className="space-y-6">
                <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-xl font-bold">Squad Match Entry</h3>
                      <p className="text-sm text-muted-foreground">Choose how you want to join this match. Every player pays individually, and the leader shares the squad password with teammates.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                      <Users className="h-3.5 w-3.5" />
                      {tournament.squad_size} players per squad
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => openJoinDialog('squad', null, 'create')}
                      disabled={isJoining || isFull || !isJoinable}
                      className="rounded-2xl border border-primary/30 bg-primary/10 p-5 text-left transition-all hover:border-primary/60 hover:bg-primary/15 disabled:opacity-50"
                    >
                      <p className="text-lg font-bold text-primary">Create Squad</p>
                      <p className="mt-2 text-sm text-muted-foreground">Become squad leader, name your team, set a unique squad password, and move straight into the squad lobby.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        openJoinDialog('squad', null, 'joinExisting');
                      }}
                      disabled={isJoining || isFull || !isJoinable}
                      className="rounded-2xl border border-secondary/30 bg-secondary/10 p-5 text-left transition-all hover:border-secondary/60 hover:bg-secondary/15 disabled:opacity-50"
                    >
                      <p className="text-lg font-bold text-secondary">Join Existing Squad</p>
                      <p className="mt-2 text-sm text-muted-foreground">Enter the squad password shared by your leader, pay your own entry fee, and jump straight into the squad lobby.</p>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold">Active Squads</h3>
                    <p className="text-sm text-muted-foreground">Leaders can share squad passwords with teammates for secure joins.</p>
                  </div>
                  {tournament.squads?.length ? tournament.squads.map((squad) => {
                    const memberCount = squad.memberCount || squad.members?.length || 0;
                    const isSquadFull = memberCount >= (tournament.squad_size || 4);
                    return (
                      <div key={squad._id} className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div>
                            <p className="text-lg font-bold">{squad.name}</p>
                            <p className="text-sm text-muted-foreground">Captain: {squad.captain?.name || squad.captain?.email || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">Join with the squad password from your leader.</p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-semibold text-foreground">{memberCount}/{tournament.squad_size} players</p>
                            <p className="text-muted-foreground">{isSquadFull ? 'Squad full' : `Waiting for ${Math.max(0, (tournament.squad_size || 0) - memberCount)} player(s)`}</p>
                          </div>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                          {(squad.members || []).map((member) => (
                            <div key={member._id} className="rounded-xl border border-border/70 bg-background/60 px-3 py-3">
                              <div className="flex items-center gap-3">
                                <GameAvatar avatarId={member.avatarId || member.avatar_id} name={member.name} size="sm" className="rounded-xl" />
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium">{member.name || 'Unknown Player'}</p>
                                    {getUserId(squad.captain) === getUserId(member) ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                                        <Crown className="h-3 w-3" /> Leader
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {participantProfilesByUserId.get(getUserId(member))?.inGameName
                                      || participantProfilesByUserId.get(getUserId(member))?.in_game_name
                                      || 'Game name pending'}
                                  </p>
                                  <p className="text-xs text-muted-foreground break-all">
                                    {participantProfilesByUserId.get(getUserId(member))?.gameUid
                                      || participantProfilesByUserId.get(getUserId(member))?.game_uid
                                      || 'UID pending'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => {
                              openJoinDialog('squad', squad, 'joinExisting');
                            }}
                            disabled={isJoining || isFull || isSquadFull || !isJoinable}
                            className="px-4 py-2 rounded-xl font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
                          >
                            {isSquadFull ? 'Squad Full' : 'Join Existing Squad'}
                          </button>
                          <p className="text-xs text-muted-foreground">Use the squad password from the leader to complete the join.</p>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="bg-card border border-dashed border-border/50 rounded-2xl p-6 text-muted-foreground">
                      No squads yet. Be the first captain.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{joinIntent.mode === 'squad' ? 'Join Squad Match' : 'Enter Match Details'}</DialogTitle>
            <DialogDescription>
              {joinIntent.mode === 'squad'
                ? 'Choose whether you want to create a squad or join an existing one, then save the player details the admin will use for the match.'
                : `Save the player details that will be shared with the admin for this ${tournament.game_type} tournament.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Entry Fee</p>
                <p className="mt-1 text-lg font-bold text-foreground">Rs.{entryFee}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Wallet Balance</p>
                <p className="mt-1 text-lg font-bold text-foreground">Rs.{currentUser?.walletBalance || 0}</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary/70">Free Entries Available</p>
                <p className="mt-1 text-lg font-bold text-primary">{freeEntriesAvailable}</p>
              </div>
            </div>

            <div className="space-y-2">
              {freeEntriesAvailable > 0 ? (
                <>
                  <label className="text-sm font-medium text-foreground">Choose Join Method</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setJoinMethod('wallet')}
                      className={`rounded-xl border px-4 py-3 text-left transition-all ${
                        joinMethod === 'wallet'
                          ? 'border-primary/30 bg-primary/10 text-foreground'
                          : 'border-border bg-background/70 text-muted-foreground'
                      }`}
                    >
                      <p className="font-semibold">Use Wallet Balance</p>
                      <p className="mt-1 text-xs">Rs.{entryFee} will be deducted from your wallet.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setJoinMethod('free_entry')}
                      className={`rounded-xl border px-4 py-3 text-left transition-all ${
                        joinMethod === 'free_entry'
                          ? 'border-accent/30 bg-accent/10 text-foreground'
                          : 'border-border bg-background/70 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">Use Free Entry</p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                          <Gift className="h-3 w-3" /> Referral Reward Entry
                        </span>
                      </div>
                      <p className="mt-1 text-xs">Use 1 free entry and keep your wallet balance unchanged.</p>
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                  No free entries available right now. This join will use your wallet balance.
                </div>
              )}
              <div className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                Selected Join Method:{' '}
                <span className="font-semibold text-foreground">
                  {joinMethod === 'free_entry' ? 'Referral Reward Entry' : 'Wallet Balance'}
                </span>
              </div>
            </div>

            {joinIntent.mode === 'squad' ? (
              <div className="space-y-3 rounded-2xl border border-border bg-background/50 p-4">
                <label className="text-sm font-medium text-foreground">
                  {squadJoinMode === 'create' ? 'Create Squad' : 'Join Existing Squad'}
                </label>
                <p className="text-xs text-muted-foreground">
                  {squadJoinMode === 'create'
                    ? 'Set your squad name and a unique squad password. After payment, you will land directly in the squad lobby with share tools.'
                    : 'Enter the squad password shared by your leader. After payment, you will land directly in the squad lobby.'}
                </p>

                {squadJoinMode === 'create' ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Squad Name</label>
                      <input
                        type="text"
                        value={squadForm.squadName}
                        onChange={(event) => setSquadForm((current) => ({ ...current, squadName: event.target.value }))}
                        placeholder="Enter your squad name"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Squad Password</label>
                      <input
                        type="text"
                        value={squadForm.squadPassword}
                        onChange={(event) => setSquadForm((current) => ({ ...current, squadPassword: event.target.value }))}
                        placeholder="Create a unique password"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Squad Password</label>
                    <input
                      type="text"
                      value={squadForm.squadPassword}
                      onChange={(event) => setSquadForm((current) => ({ ...current, squadPassword: event.target.value }))}
                      placeholder="Enter squad password"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">In-Game Name</label>
              <input
                type="text"
                value={joinDetails.inGameName}
                onChange={(event) => setJoinDetails((current) => ({ ...current, inGameName: event.target.value }))}
                placeholder="Enter your player name"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{gameUidLabel}</label>
              <input
                type="text"
                value={joinDetails.gameUid}
                onChange={(event) => setJoinDetails((current) => ({ ...current, gameUid: event.target.value }))}
                placeholder={`Enter your ${gameUidLabel}`}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setJoinDialogOpen(false)}
              className="px-4 py-2 rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitJoinDetails}
              disabled={isJoining}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : joinIntent.mode === 'squad' ? (squadJoinMode === 'create' ? 'Create Squad and Join' : 'Join Squad') : 'Confirm Join'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentDetailPage;
