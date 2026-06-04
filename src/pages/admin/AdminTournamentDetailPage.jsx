import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Crown, Edit, Eye, EyeOff, Loader2, Lock, RotateCcw, Trash2, Trophy, Users, XCircle } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import EditTournamentModal from '@/components/EditTournamentModal';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import GameAvatar from '@/components/GameAvatar';
import { calculatePrizeBreakdown, isSquadTournament } from '@/lib/prizeUtils';
import { formatStatusLabel } from '@/lib/utils';

const formatDateTime = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleString();
};

const getPrizePool = (tournament) => calculatePrizeBreakdown(tournament).prizePool;

const getUserId = (user) => {
  if (!user) return '';
  if (typeof user === 'string') return user;
  return user._id || user.id || '';
};

const getDeclaredWinnerMap = (tournament) => new Map((tournament?.winnerEntries || tournament?.winner_entries || [])
  .map((entry) => [Number(entry.place), entry])
  .filter(([place]) => Boolean(place)));

const AdminTournamentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [joinedUsers, setJoinedUsers] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [winnerSelections, setWinnerSelections] = useState([]);
  const [actionLoading, setActionLoading] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const loadTournament = async () => {
    if (!id || id === 'undefined') {
      toast({ title: 'Error', description: 'Invalid tournament link.', variant: 'destructive' });
      navigate('/admin', { state: { tab: 'tournaments' } });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [tournamentData, joinsData] = await Promise.all([
        apiClient.get(`/tournaments/${id}`),
        apiClient.get(`/tournaments/${id}/joins`)
      ]);
      setTournament(tournamentData);
      setJoinedUsers(joinsData);
      setRoomId(tournamentData.room_id || '');
      setRoomPassword(tournamentData.room_password || '');
      const declaredWinnerMap = getDeclaredWinnerMap(tournamentData);
      setWinnerSelections(calculatePrizeBreakdown(tournamentData).prizeEntries.map((entry, index) => {
        const place = entry.place || index + 1;
        const declaredWinner = declaredWinnerMap.get(Number(place));
        return {
          place,
          label: entry.label,
          amount: entry.amount,
          userId: declaredWinner?.userId || getUserId(declaredWinner?.user) || '',
          squadId: declaredWinner?.squadId || declaredWinner?.squad_id || '',
          declared: Boolean(declaredWinner)
        };
      }));
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to load tournament details.', variant: 'destructive' });
      navigate('/admin', { state: { tab: 'tournaments' } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournament();
  }, [id]);

  const handleRoomDetailsSave = async () => {
    if (!roomId || !roomPassword) {
      return toast({ title: 'Missing Details', description: 'Room ID and password are both required.', variant: 'destructive' });
    }

    setActionLoading('room');
    try {
      await apiClient.post(`/tournaments/${id}/room-details`, {
        room_id: roomId,
        room_password: roomPassword
      });
      toast({ title: 'Room Details Saved', description: 'Joined users will see them at match start time.' });
      await loadTournament();
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to update room details.', variant: 'destructive' });
    } finally {
      setActionLoading('');
    }
  };

  const handlePrizePoolVisibilityToggle = async () => {
    const currentVisibility = tournament?.prize_pool_visible ?? tournament?.prizePoolVisible ?? true;
    setActionLoading('prize-visibility');
    try {
      await apiClient.put(`/tournaments/${id}`, {
        prize_pool_visible: !currentVisibility
      });
      toast({
        title: !currentVisibility ? 'Prize Pool Visible' : 'Prize Pool Hidden',
        description: !currentVisibility ? 'Users can now see the prize pool.' : 'Prize pool is hidden from user cards and details.'
      });
      await loadTournament();
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to update prize pool visibility.', variant: 'destructive' });
    } finally {
      setActionLoading('');
    }
  };

  const handleFinishTournament = async () => {
    setActionLoading('finish');
    try {
      await apiClient.post(`/tournaments/${id}/finish`, {});
      toast({ title: 'Tournament Completed', description: 'This tournament is now marked as completed.' });
      await loadTournament();
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to finish tournament.', variant: 'destructive' });
    } finally {
      setActionLoading('');
    }
  };

  const handleDeclareWinner = async () => {
    const squadMatch = isSquadTournament(tournament);
    const payableSelections = winnerSelections.filter((entry) => Number(entry.amount || 0) > 0);
    const pendingSelections = payableSelections.filter((entry) => !entry.declared);
    const declaredIds = payableSelections.filter((entry) => entry.declared).map((entry) => squadMatch ? entry.squadId : entry.userId).filter(Boolean);
    const selectedSelections = pendingSelections.filter((entry) => squadMatch ? entry.squadId : entry.userId);
    const selectedIds = selectedSelections.map((entry) => squadMatch ? entry.squadId : entry.userId);
    if (selectedSelections.length === 0) {
      return toast({ title: 'Missing Winner Info', description: `Select at least one pending ${squadMatch ? 'squad' : 'player'} to declare.`, variant: 'destructive' });
    }
    if (new Set(selectedIds).size !== selectedIds.length || selectedIds.some((item) => declaredIds.includes(item))) {
      return toast({ title: 'Invalid Winners', description: `Each winning position must be a different ${squadMatch ? 'squad' : 'player'}.`, variant: 'destructive' });
    }

    setActionLoading('winner');
    try {
      await apiClient.post(`/tournaments/${id}/declare-winner`, {
        winnerEntries: selectedSelections.map((entry) => ({
          place: entry.place,
          userId: entry.userId,
          squadId: entry.squadId
        }))
      });
      toast({
        title: 'Winner Updated',
        description: squadMatch ? 'Selected squad rewards were credited to squad captains automatically.' : 'Selected winner rewards were credited automatically.'
      });
      await loadTournament();
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to declare winner.', variant: 'destructive' });
    } finally {
      setActionLoading('');
    }
  };

  const handleDismissTournament = async () => {
    setActionLoading('dismiss');
    try {
      await apiClient.post(`/tournaments/${id}/dismiss`, {});
      toast({ title: 'Match Dismissed', description: 'This match is now marked as dismissed.' });
      await loadTournament();
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to dismiss match.', variant: 'destructive' });
    } finally {
      setActionLoading('');
    }
  };

  const handleRefundTournament = async () => {
    setActionLoading('refund');
    try {
      await apiClient.post(`/tournaments/${id}/refund`, {});
      toast({ title: 'Refund Complete', description: squadMatch ? 'Full squad entries have been refunded to captains.' : 'All joined users have been refunded and the match is dismissed.' });
      await loadTournament();
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to refund players.', variant: 'destructive' });
    } finally {
      setActionLoading('');
    }
  };

  const handleRemoveSquad = async (squadId) => {
    setActionLoading(`remove-squad-${squadId}`);
    try {
      await apiClient.delete(`/tournaments/${id}/squads/${squadId}`);
      toast({ title: 'Squad Removed', description: 'The squad and its members were removed from this tournament.' });
      await loadTournament();
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to remove squad.', variant: 'destructive' });
    } finally {
      setActionLoading('');
    }
  };

  const currentSquadSummary = useMemo(() => (tournament?.squads || []).map((squad) => {
    const memberCount = squad.memberCount || squad.members?.length || 0;
    const isFull = squad.isComplete || squad.status === 'complete' || memberCount >= (tournament?.squad_size || 4);
    return {
      ...squad,
      memberCount,
      isFull,
      waitingCount: Math.max(0, (tournament?.squad_size || 4) - memberCount)
    };
  }), [tournament]);

  const joinedUsersById = useMemo(() => new Map(joinedUsers.map((user) => [user._id || user.id, user])), [joinedUsers]);
  const prizeBreakdown = useMemo(() => calculatePrizeBreakdown(tournament), [tournament]);
  const squadMatch = isSquadTournament(tournament);
  const pendingWinnerPlaces = winnerSelections.filter((entry) => Number(entry.amount || 0) > 0 && !entry.declared);
  const declaredWinnerPlaces = winnerSelections.filter((entry) => entry.declared);
  const canDeclareMoreWinners = pendingWinnerPlaces.length > 0;
  const freeEntry = (tournament?.entry_type || tournament?.entryType) === 'free' || Number(tournament?.entry_fee || 0) === 0;
  const prizePoolVisible = tournament?.prize_pool_visible ?? tournament?.prizePoolVisible ?? true;
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!tournament) return null;

  return (
    <div className="min-h-screen bg-background text-foreground py-10">
      <Helmet>
        <title>{tournament.title} | Admin Tournament</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-7xl space-y-6">
        <button
          onClick={() => navigate('/admin', { state: { tab: 'tournaments' } })}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to tournaments
        </button>

        <div className="admin-glass-panel rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${tournament.name === 'BGMI' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                  {tournament.name}
                </span>
                <span className="px-2 py-1 rounded text-xs font-semibold uppercase bg-background/70 border border-border/60">
                  {tournament.match_type}
                </span>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  tournament.status === 'active' ? 'bg-secondary/20 text-secondary' :
                  tournament.status === 'completed' ? 'bg-accent/20 text-accent' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {formatStatusLabel(tournament.status)}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">{tournament.title}</h1>
              <p className="text-muted-foreground mt-2">Match starts at {formatDateTime(tournament.match_start_time || tournament.startTime)}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handlePrizePoolVisibilityToggle}
                disabled={actionLoading === 'prize-visibility'}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 ${prizePoolVisible ? 'bg-secondary/10 text-secondary hover:bg-secondary hover:text-secondary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
              >
                {actionLoading === 'prize-visibility' ? <Loader2 className="w-4 h-4 animate-spin" /> : prizePoolVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {prizePoolVisible ? 'Prize Pool Visible' : 'Prize Pool Hidden'}
              </button>
              <button
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Edit className="w-4 h-4" /> Edit Match Settings
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-background/40 border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Entry Fee</p>
              <p className="text-2xl font-bold">Rs.{tournament.entry_fee}</p>
            </div>
            <div className="bg-background/40 border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Prize Pool</p>
              <p className="text-2xl font-bold text-accent">Rs.{prizeBreakdown.prizePool}</p>
              {squadMatch ? <p className="text-[11px] text-muted-foreground mt-1">Full collection</p> : null}
            </div>
            <div className="bg-background/40 border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{squadMatch ? 'First Prize' : 'Joined Users'}</p>
              <p className="text-2xl font-bold">{squadMatch ? `Rs.${prizeBreakdown.firstPrize}` : `${tournament.joined_count || 0}/${tournament.total_slots}`}</p>
              {squadMatch ? <p className="text-[11px] text-muted-foreground mt-1">{prizeBreakdown.firstPrizePercentage}% distributed</p> : null}
            </div>
            <div className="bg-background/40 border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{squadMatch ? 'Platform Earnings' : 'Match Settings'}</p>
              <p className="text-lg font-bold capitalize">{squadMatch ? `Rs.${prizeBreakdown.platformEarnings}` : tournament.match_type}</p>
              <p className="text-xs text-muted-foreground mt-1">{squadMatch ? `${tournament.squad_size} players per squad` : 'Single player entry'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="admin-glass-panel rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                <h2 className="text-xl font-bold">Room ID and Password</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  value={roomId}
                  onChange={(event) => setRoomId(event.target.value)}
                  placeholder="Room ID"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
                <input
                  type="text"
                  value={roomPassword}
                  onChange={(event) => setRoomPassword(event.target.value)}
                  placeholder="Room Password"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>
              <button
                onClick={handleRoomDetailsSave}
                disabled={actionLoading === 'room'}
                className="w-full sm:w-auto bg-primary text-primary-foreground font-bold px-5 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'room' ? 'Saving...' : 'Save Room Details'}
              </button>
              <p className="text-sm text-muted-foreground">Joined players can only see these details after the match start time. Last updated {formatDateTime(tournament.room_details_set_at)}.</p>
            </section>

            {tournament.match_type !== 'squad' ? (
              <section className="admin-glass-panel rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  <h2 className="text-xl font-bold">Joined Users</h2>
                </div>
                {joinedUsers.length === 0 ? (
                  <div className="bg-background/30 border border-dashed border-border rounded-2xl p-5 text-sm text-muted-foreground">
                    No users have joined this match yet.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {joinedUsers.map((user) => (
                      <div key={user._id} className="bg-background/40 border border-border rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-3">
                          <GameAvatar avatarId={user.avatarId || user.avatar_id} name={user.name} size="sm" className="rounded-xl" />
                          <p className="font-semibold text-foreground">{user.name || 'Unknown User'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Game Name</p>
                          <p className="font-medium text-foreground">{user.inGameName || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">UID</p>
                          <p className="font-medium text-foreground">{user.gameUID || 'Not provided'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {tournament.match_type === 'squad' ? (
              <section className="admin-glass-panel rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-secondary" />
                  <h2 className="text-xl font-bold">Squads</h2>
                </div>
                {currentSquadSummary.length === 0 ? (
                  <div className="bg-background/30 border border-dashed border-border rounded-2xl p-5 text-sm text-muted-foreground">
                    No squads created yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentSquadSummary.map((squad) => (
                      <div key={squad._id} className="bg-background/40 border border-border rounded-2xl p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">{squad.name}</p>
                            <p className="text-sm text-muted-foreground">Captain: {squad.captain?.name || squad.captain?.email || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">Code: {squad.inviteCode || squad.squadCode || squad.squad_code || 'Generated'} | Entry paid: Rs.{squad.totalEntryFee || squad.total_entry_fee || (tournament.entry_fee * tournament.squad_size)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${squad.isFull ? 'bg-accent/20 text-accent' : 'bg-secondary/20 text-secondary'}`}>
                            {squad.isFull ? 'Squad Complete' : `${squad.memberCount}/${tournament.squad_size}`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {squad.isFull ? 'Squad complete' : `Waiting for ${squad.waitingCount} player(s)`}
                        </p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {squad.members.map((member) => {
                            const joinedUser = joinedUsersById.get(member._id || member.id);
                            return (
                            <div key={member._id} className="rounded-xl border border-border/70 bg-background/60 px-3 py-3 text-sm space-y-2">
                              <div className="flex items-center gap-3">
                                <GameAvatar avatarId={member.avatarId || member.avatar_id} name={member.name} size="sm" className="rounded-xl" />
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium">{member.name || 'Unknown Player'}</p>
                                    {(squad.captainId || squad.captain?._id) === (member._id || member.id) ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                                        <Crown className="h-3 w-3" /> Captain
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{joinedUser?.inGameName || 'Game name not provided'}</p>
                                </div>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <div className="rounded-xl bg-background/70 px-3 py-2">
                                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">UID</p>
                                  <p className="font-medium text-foreground break-all">{joinedUser?.gameUID || 'UID not provided'}</p>
                                </div>
                                <div className="rounded-xl bg-background/70 px-3 py-2">
                                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Payment</p>
                                  <p className="font-medium text-foreground">{joinedUser?.paymentStatus || 'Paid'}</p>
                                </div>
                              </div>
                            </div>
                          );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSquad(squad._id || squad.id)}
                          disabled={actionLoading === `remove-squad-${squad._id || squad.id}` || !!tournament.winner_declared_at}
                          className="inline-flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-bold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          {actionLoading === `remove-squad-${squad._id || squad.id}` ? 'Removing...' : 'Remove Squad'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : null}
          </div>

          <div className="space-y-6">
            <section className="admin-glass-panel rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" />
                <h2 className="text-xl font-bold">Winner Declaration</h2>
              </div>
              <button
                onClick={handleFinishTournament}
                disabled={tournament.status === 'completed' || actionLoading === 'finish'}
                className="w-full bg-secondary text-secondary-foreground font-bold py-3 rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'finish' ? 'Finishing...' : tournament.status === 'completed' ? 'Completed' : 'Complete Tournament'}
              </button>
              <div className="space-y-3">
                {winnerSelections.map((entry, index) => (
                  <div key={`${entry.place}-${entry.label}`} className="rounded-2xl border border-border bg-background/35 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold">{entry.label}</span>
                      <span className="flex items-center gap-2 text-muted-foreground">Rs.{entry.amount}{entry.declared ? <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">Declared</span> : null}</span>
                    </div>
                    <select
                      value={squadMatch ? entry.squadId : entry.userId}
                      onChange={(event) => setWinnerSelections((current) => current.map((item, itemIndex) => (
                        itemIndex === index
                          ? { ...item, [squadMatch ? 'squadId' : 'userId']: event.target.value }
                          : item
                      )))}
                      disabled={entry.declared}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">{squadMatch ? 'Select squad' : 'Select player'}</option>
                      {squadMatch ? currentSquadSummary.map((squad) => {
                        const squadId = squad._id || squad.id;
                        const alreadyDeclared = winnerSelections.some((item) => item.declared && item.squadId === squadId && item.place !== entry.place);
                        return (
                          <option key={squadId} value={squadId} disabled={alreadyDeclared}>
                            {squad.name} ({squad.memberCount}/{tournament.squad_size}){alreadyDeclared ? ' - declared' : ''}
                          </option>
                        );
                      }) : joinedUsers.map((user) => {
                        const userId = user._id || user.id;
                        const alreadyDeclared = winnerSelections.some((item) => item.declared && item.userId === userId && item.place !== entry.place);
                        return (
                          <option key={userId} value={userId} disabled={alreadyDeclared}>
                            {user.name || user.email}{alreadyDeclared ? ' - declared' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {squadMatch ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Full reward credits to the selected squad captain.
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
                  <p className="text-xs text-muted-foreground">Prize Pool</p>
                  <p className="text-xl font-bold text-primary">Rs.{prizeBreakdown.prizePool}</p>
                </div>
                <div className="rounded-2xl border border-accent/30 bg-accent/10 p-3">
                  <p className="text-xs text-muted-foreground">Distribution</p>
                  <p className="text-xl font-bold text-accent capitalize">{prizeBreakdown.distributionType}</p>
                </div>
              </div>
              <button
                onClick={handleDeclareWinner}
                disabled={(squadMatch ? currentSquadSummary.length === 0 : joinedUsers.length === 0) || actionLoading === 'winner' || !canDeclareMoreWinners}
                className="w-full bg-accent text-accent-foreground font-bold py-3 rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'winner' ? 'Declaring...' : !canDeclareMoreWinners ? 'All Winners Declared' : declaredWinnerPlaces.length > 0 ? 'Declare Remaining Winners' : squadMatch ? 'Declare Winning Squad' : 'Declare Winner'}
              </button>
              <p className="text-sm text-muted-foreground">
                {squadMatch
                  ? 'Select pending prize places only. Already declared squads stay locked so rewards are not credited twice.'
                  : 'Select pending prize places only. Already declared players stay locked so rewards are not credited twice.'}
              </p>

              {tournament.winner ? (
                <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 font-bold text-accent mb-1">
                    <Crown className="w-4 h-4" /> Winner: {squadMatch ? (tournament.winnerSquadName || tournament.winner_squad_name || 'Winning Squad') : (tournament.winner.name || tournament.winner.email)}
                  </div>
                  <p className="text-sm text-muted-foreground">First Prize: Rs.{tournament.winner_prize || 0}</p>
                  {squadMatch ? <p className="text-sm text-muted-foreground">Captain reward: Rs.{tournament.winner_prize || tournament.winnerPrize || 0}</p> : (
                    <>
                      <p className="text-sm text-muted-foreground">2nd: {tournament.secondWinner?.name || tournament.second_winner?.name || 'Not set'} | Rs.{tournament.secondPlacePrize || tournament.second_place_prize || 0}</p>
                      <p className="text-sm text-muted-foreground">3rd: {tournament.thirdWinner?.name || tournament.third_winner?.name || 'Not set'} | Rs.{tournament.thirdPlacePrize || tournament.third_place_prize || 0}</p>
                    </>
                  )}
                  <p className="text-sm text-muted-foreground">Declared at {formatDateTime(tournament.winner_declared_at)}</p>
                </div>
              ) : null}
            </section>

            <section className="admin-glass-panel rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <h2 className="text-xl font-bold">Match Settings</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Game</span>
                  <span className="font-medium">{tournament.name}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Match Type</span>
                  <span className="font-medium capitalize">{tournament.match_type}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Entry Type</span>
                  <span className="font-medium">{freeEntry ? 'Free Entry' : `Paid Entry - Rs.${tournament.entry_fee}`}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Player Slots</span>
                  <span className="font-medium">{tournament.total_slots}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Total Collection</span>
                  <span className="font-medium">Rs.{prizeBreakdown.totalCollection}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Public Prize Pool</span>
                  <span className="font-medium">{prizePoolVisible ? 'Visible' : 'Hidden'}</span>
                </div>
                {squadMatch ? (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">First Prize</span>
                      <span className="font-medium">Rs.{prizeBreakdown.firstPrize}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Platform Earnings</span>
                      <span className="font-medium">Rs.{prizeBreakdown.platformEarnings}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Reward Pool</span>
                      <span className="font-medium">Rs.{prizeBreakdown.rewardPool}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Platform Earnings</span>
                      <span className="font-medium">Rs.{prizeBreakdown.platformEarnings}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Distribution</span>
                      <span className="font-medium">{prizeBreakdown.soloFirstPercentage}/{prizeBreakdown.soloSecondPercentage}/{prizeBreakdown.soloThirdPercentage}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Squad Size</span>
                  <span className="font-medium">{tournament.match_type === 'squad' ? tournament.squad_size : 1}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Start Time</span>
                  <span className="font-medium">{formatDateTime(tournament.match_start_time || tournament.startTime)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Refund Status</span>
                  <span className="font-medium">{tournament.refund_processed ? `Refunded at ${formatDateTime(tournament.refunded_at)}` : 'Not refunded'}</span>
                </div>
              </div>
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <button
                  onClick={handleDismissTournament}
                  disabled={tournament.status === 'dismissed' || actionLoading === 'dismiss' || tournament.refund_processed}
                  className="w-full inline-flex items-center justify-center gap-2 bg-destructive/10 text-destructive font-bold py-3 rounded-xl hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  {actionLoading === 'dismiss' ? 'Dismissing...' : tournament.status === 'dismissed' ? 'Match Dismissed' : 'Dismiss Match'}
                </button>
                <button
                  onClick={handleRefundTournament}
                  disabled={tournament.refund_processed || actionLoading === 'refund' || joinedUsers.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary/10 text-primary font-bold py-3 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  {actionLoading === 'refund' ? 'Refunding...' : tournament.refund_processed ? 'Refund Completed' : 'Refund All Players'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <EditTournamentModal
        isOpen={editOpen}
        onOpenChange={setEditOpen}
        tournament={tournament}
        onSuccess={loadTournament}
      />
    </div>
  );
};

export default AdminTournamentDetailPage;



