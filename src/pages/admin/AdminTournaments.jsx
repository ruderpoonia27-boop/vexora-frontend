import React, { useMemo, useState } from 'react';
import { Edit, Eye, Plus, Search, Trash2, Trophy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import apiClient from '@/lib/apiClient';
import CreateTournamentModal from '@/components/CreateTournamentModal';
import EditTournamentModal from '@/components/EditTournamentModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Skeleton } from '@/components/ui/skeleton';
import { calculatePrizeBreakdown, isSquadTournament } from '@/lib/prizeUtils';

const formatDateTime = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';
  return date.toLocaleString();
};

const getPrizePool = (tournament) => calculatePrizeBreakdown(tournament).prizePool;

export const AdminTournaments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const { data: tournaments, loading } = useRealtimeSubscription('tournaments', { sort: '-created', refreshVersion });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTournament, setEditTournament] = useState(null);
  const [deleteTournament, setDeleteTournament] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const refreshData = () => setRefreshVersion((current) => current + 1);

  const filteredTournaments = useMemo(() => tournaments.filter((tournament) => {
    const text = `${tournament.title || ''} ${tournament.name || ''}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tournament.status === filterStatus;
    return matchesSearch && matchesStatus;
  }), [filterStatus, searchTerm, tournaments]);

  const handleDelete = async () => {
    if (!deleteTournament) return;
    const tournamentId = deleteTournament._id || deleteTournament.id;
    if (!tournamentId) {
      toast({ title: 'Error', description: 'Tournament ID is missing.', variant: 'destructive' });
      return;
    }
    setIsDeleting(true);
    try {
      await apiClient.delete(`/tournaments/${tournamentId}`);
      toast({ title: 'Tournament Deleted', description: 'The tournament has been removed.' });
      setDeleteTournament(null);
      refreshData();
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to delete tournament.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Manage Tournaments</h2>
          <p className="text-sm text-muted-foreground mt-1">Open any match in its own management page for joined users, room details, winners, and settings.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" /> Create Tournament
        </button>
      </div>

      <div className="admin-glass-panel p-4 rounded-2xl flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title or game..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          className="w-full sm:w-48 bg-background/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="admin-glass-panel rounded-2xl p-5 space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="admin-glass-panel rounded-2xl p-10 text-center text-muted-foreground">
          No tournaments found matching your filters.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTournaments.map((tournament) => {
            const prizeBreakdown = calculatePrizeBreakdown(tournament);
            const squadMatch = isSquadTournament(tournament);
            const freeEntry = (tournament.entry_type || tournament.entryType) === 'free' || Number(tournament.entry_fee || 0) === 0;
            return (
            <div key={tournament._id || tournament.id} className="admin-glass-panel rounded-2xl p-5 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${tournament.name === 'BGMI' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                      {tournament.name}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-semibold uppercase bg-background/70 border border-border/60">
                      {tournament.match_type || 'solo'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">{tournament.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Starts {formatDateTime(tournament.match_start_time || tournament.startTime)}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  tournament.status === 'active' ? 'bg-secondary/20 text-secondary' :
                  tournament.status === 'completed' ? 'bg-accent/20 text-accent' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {tournament.status}
                </span>
              </div>

              <div className={`grid gap-3 text-sm ${squadMatch ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-3'}`}>
                <div className="bg-background/40 border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Entry</p>
                  {freeEntry ? (
                    <p className="inline-flex rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 text-xs font-black text-secondary">FREE</p>
                  ) : (
                    <p className="font-bold">Rs.{tournament.entry_fee}</p>
                  )}
                </div>
                <div className="bg-background/40 border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Prize Pool</p>
                  <p className="font-bold text-accent">Rs.{getPrizePool(tournament)}</p>
                </div>
                {squadMatch ? (
                  <div className="bg-background/40 border border-border rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">First Prize</p>
                    <p className="font-bold text-primary">Rs.{prizeBreakdown.firstPrize}</p>
                  </div>
                ) : (
                  <div className="bg-background/40 border border-border rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">Reward Pool</p>
                    <p className="font-bold text-primary">Rs.{prizeBreakdown.rewardPool}</p>
                  </div>
                )}
                <div className="bg-background/40 border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Joined</p>
                  <p className="font-bold">{tournament.joined_count || 0}/{tournament.total_slots}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {tournament.match_type === 'squad' ? `${tournament.squads?.length || 0} squads` : 'Solo match'}</span>
                  <span className="inline-flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> Winner {tournament.winner ? 'declared' : 'pending'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/admin/tournament/${tournament._id || tournament.id}`)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Eye className="w-4 h-4" /> Manage
                  </button>
                  <button
                    onClick={() => setEditTournament(tournament)}
                    className="p-2 bg-muted/50 hover:bg-accent/20 text-foreground hover:text-accent rounded-lg transition-colors"
                    aria-label="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTournament(tournament)}
                    className="p-2 bg-muted/50 hover:bg-destructive/20 text-foreground hover:text-destructive rounded-lg transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}

      <CreateTournamentModal isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={refreshData} />
      <EditTournamentModal isOpen={!!editTournament} onOpenChange={(open) => !open && setEditTournament(null)} tournament={editTournament} onSuccess={refreshData} />
      <ConfirmationModal
        isOpen={!!deleteTournament}
        onOpenChange={(open) => !open && setDeleteTournament(null)}
        title="Delete Tournament"
        message="Are you sure you want to delete this tournament? This cannot be undone."
        confirmText="Delete"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
};
