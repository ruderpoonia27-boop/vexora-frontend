import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  Loader2,
  Lock,
  Share2,
  Shield,
  Sparkles,
  Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/apiClient';
import GameAvatar from '@/components/GameAvatar';
import { getPlatformName, useSettings } from '@/hooks/useSettings';

const formatDateTime = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleString();
};

const SquadLobbyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();
  const platformName = getPlatformName(settings);
  const [loading, setLoading] = useState(true);
  const [lobby, setLobby] = useState(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  const [copiedRoomPassword, setCopiedRoomPassword] = useState(false);

  const currentUserId = currentUser?.id || currentUser?._id;

  const loadLobby = async (showLoading = true) => {
    if (!currentUserId || !id) return;
    if (showLoading) setLoading(true);
    try {
      const data = await apiClient.get(`/tournaments/${id}/squad-lobby?userId=${currentUserId}`);
      setLobby(data);
    } catch (error) {
      toast({
        title: 'Unable to open squad lobby',
        description: error.message || 'Please check your squad access and try again.',
        variant: 'destructive'
      });
      navigate(`/tournament/${id}`);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadLobby(true);
  }, [id, currentUserId]);

  useEffect(() => {
    if (!currentUserId || !id) return undefined;

    const handleFocus = () => {
      loadLobby(false);
    };
    const intervalId = window.setInterval(() => loadLobby(false), 15000);

    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [id, currentUserId]);

  const squad = lobby?.squad;
  const roomDetails = lobby?.roomDetails;
  const progressPercent = useMemo(() => {
    if (!squad?.memberCount || !lobby?.squadSize) return 0;
    return Math.min(100, (squad.memberCount / lobby.squadSize) * 100);
  }, [lobby?.squadSize, squad?.memberCount]);

  const copyValue = async (value, type) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    if (type === 'password') setCopiedPassword(true);
    if (type === 'roomId') setCopiedRoomId(true);
    if (type === 'roomPassword') setCopiedRoomPassword(true);
    toast({ title: 'Copied', description: `${type === 'password' ? 'Squad password' : 'Room detail'} copied to clipboard.` });
    window.setTimeout(() => {
      if (type === 'password') setCopiedPassword(false);
      if (type === 'roomId') setCopiedRoomId(false);
      if (type === 'roomPassword') setCopiedRoomPassword(false);
    }, 1800);
  };

  const shareSquad = async () => {
    if (!squad?.password) return;
    const shareText = `Join my ${squad.name} squad in ${lobby?.tournamentTitle}. Squad password: ${squad.password}.`;
    const shareUrl = `${window.location.origin}/tournament/${id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${squad.name} Squad Invite`,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch {
        // fall through to copy
      }
    }

    await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    toast({ title: 'Invite copied', description: 'Share it with your teammates.' });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lobby || !squad) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background py-8 md:py-12">
      <Helmet>
        <title>{squad.name} Lobby | {platformName}</title>
      </Helmet>

      <div className="container mx-auto max-w-6xl px-4">
        <button
          onClick={() => navigate(`/tournament/${id}`)}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to tournament
        </button>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[30px] border border-primary/20 bg-[rgba(9,14,31,0.88)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.36)] backdrop-blur-2xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-primary">
                  <Users className="h-4 w-4" /> Squad Lobby
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">{squad.name}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {lobby.gameName} squad room for {lobby.tournamentTitle}
                </p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Squad Progress</p>
                <p className="mt-1 text-2xl font-black text-primary">{squad.memberCount} / {lobby.squadSize}</p>
              </div>
            </div>

            <div className="mb-5 overflow-hidden rounded-full border border-primary/15 bg-[rgba(11,17,36,0.95)]">
              <div
                className={`h-3 ${squad.isComplete ? 'bg-secondary' : 'bg-primary'}`}
                style={{ width: `${progressPercent}%`, transition: 'width 240ms ease' }}
              />
            </div>

            <div className="page-transition" key={squad.isComplete ? 'complete' : 'waiting'}>
              {squad.isComplete ? (
                <div className="mb-6 rounded-2xl border border-secondary/25 bg-secondary/10 p-4">
                  <div className="flex items-center gap-2 text-secondary">
                    <Sparkles className="h-5 w-5" />
                    <p className="font-bold">Squad complete. Your team is ready for battle.</p>
                  </div>
                </div>
              ) : (
                <div className="mb-6 rounded-2xl border border-accent/20 bg-accent/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent/70 [animation-delay:180ms]" />
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent/40 [animation-delay:360ms]" />
                    </div>
                    <p className="text-sm font-medium text-accent">Waiting for {squad.remainingSlots} teammate(s) to join.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {squad.members.map((member) => (
                <div key={member.id} className="rounded-2xl border border-border/60 bg-background/45 p-4">
                  <div className="flex items-start gap-3">
                    <GameAvatar avatarId={member.avatarId} name={member.name} size="sm" className="rounded-2xl" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{member.name}</p>
                        {member.isLeader ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                            <Crown className="h-3 w-3" /> Leader
                          </span>
                        ) : null}
                        {member.isCurrentUser ? (
                          <span className="inline-flex rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
                            You
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs">
                        <div className="rounded-xl bg-background/70 px-3 py-2">
                          <p className="uppercase tracking-[0.16em] text-muted-foreground">Game Name</p>
                          <p className="mt-1 font-medium text-foreground">{member.inGameName || 'Pending'}</p>
                        </div>
                        <div className="rounded-xl bg-background/70 px-3 py-2">
                          <p className="uppercase tracking-[0.16em] text-muted-foreground">Game UID</p>
                          <p className="mt-1 font-medium text-foreground break-all">{member.gameUID || 'Pending'}</p>
                        </div>
                        <div className="rounded-xl bg-background/70 px-3 py-2">
                          <p className="uppercase tracking-[0.16em] text-muted-foreground">Join Status</p>
                          <p className="mt-1 font-medium text-secondary">Joined</p>
                        </div>
                        <div className="rounded-xl bg-background/70 px-3 py-2">
                          <p className="uppercase tracking-[0.16em] text-muted-foreground">Payment</p>
                          <p className="mt-1 font-medium text-foreground">{member.paymentStatus}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[30px] border border-border/60 bg-[rgba(9,14,31,0.88)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
              <div className="mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Squad Invite</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Squad Password</p>
                  <p className="mt-2 break-all font-mono text-2xl font-black text-primary">{squad.password}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => copyValue(squad.password, 'password')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-bold text-primary-foreground transition-all hover:bg-primary/90"
                  >
                    {copiedPassword ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy Password
                  </button>
                  <button
                    type="button"
                    onClick={shareSquad}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 font-bold text-accent transition-all hover:bg-accent hover:text-accent-foreground"
                  >
                    <Share2 className="h-4 w-4" /> Share Squad
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-border/60 bg-[rgba(9,14,31,0.88)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-bold">Match Room</h2>
              </div>
              {roomDetails?.visible ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Room ID</p>
                        <p className="mt-2 font-mono text-lg font-bold text-foreground">{roomDetails.roomId}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyValue(roomDetails.roomId, 'roomId')}
                        className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                      >
                        {copiedRoomId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Room Password</p>
                        <p className="mt-2 font-mono text-lg font-bold text-foreground">{roomDetails.roomPassword || 'None'}</p>
                      </div>
                      {roomDetails.roomPassword ? (
                        <button
                          type="button"
                          onClick={() => copyValue(roomDetails.roomPassword, 'roomPassword')}
                          className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                        >
                          {copiedRoomPassword ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Shared at {formatDateTime(roomDetails.sharedAt)}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-accent/20 bg-accent/10 p-4">
                  <p className="text-sm font-medium text-foreground">Room details are not live yet.</p>
                  <p className="mt-2 text-sm text-muted-foreground">Room ID and password unlock at {formatDateTime(roomDetails?.availableAt)} for squad members only.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SquadLobbyPage;
