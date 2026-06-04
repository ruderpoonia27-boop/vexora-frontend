import React, { useEffect, useState } from 'react';
import { Loader2, Trophy } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { calculatePrizeBreakdown, isSquadTournament } from '@/lib/prizeUtils';
import { formatStatusLabel } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DeclareWinnerModal = ({ isOpen, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [joinedUsers, setJoinedUsers] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedSecondUser, setSelectedSecondUser] = useState('');
  const [selectedThirdUser, setSelectedThirdUser] = useState('');
  const [selectedSquad, setSelectedSquad] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      try {
        const data = await apiClient.get('/tournaments?status=active,completed');
        setTournaments(data.items || data.tournaments || data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (!selectedTournament) {
      setJoinedUsers([]);
      return;
    }
    const fetchJoins = async () => {
      try {
        const data = await apiClient.get(`/tournaments/${selectedTournament}/joins`);
        setJoinedUsers(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchJoins();
  }, [selectedTournament]);

  const selectedTournamentData = tournaments.find((item) => item._id === selectedTournament || item.id === selectedTournament);
  const squadMatch = isSquadTournament(selectedTournamentData);
  const prizeBreakdown = calculatePrizeBreakdown(selectedTournamentData);
  const squads = selectedTournamentData?.squads || [];
  const winningSquad = squads.find((squad) => (squad._id || squad.id) === selectedSquad);

  const resetForm = () => {
    setSelectedTournament('');
    setSelectedUser('');
    setSelectedSecondUser('');
    setSelectedThirdUser('');
    setSelectedSquad('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedTournament || (squadMatch ? !selectedSquad : (!selectedUser || !selectedSecondUser || !selectedThirdUser))) {
      return toast({ title: 'Validation', description: 'Please complete all fields.', variant: 'destructive' });
    }
    if (!squadMatch && new Set([selectedUser, selectedSecondUser, selectedThirdUser]).size !== 3) {
      return toast({ title: 'Validation', description: 'Each winning position must be a different player.', variant: 'destructive' });
    }

    setIsLoading(true);
    try {
      await apiClient.post(`/tournaments/${selectedTournament}/declare-winner`, squadMatch
        ? { squadId: selectedSquad }
        : {
          firstPlaceUserId: selectedUser,
          secondPlaceUserId: selectedSecondUser,
          thirdPlaceUserId: selectedThirdUser
        });

      toast({
        title: 'Success',
        description: squadMatch ? 'Winning squad rewards credited automatically!' : 'Solo rewards credited automatically!'
      });
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: error.message || 'Failed to declare winner.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const playerSelects = [
    { label: `1st Place - Rs.${prizeBreakdown.firstPrize}`, value: selectedUser, setter: setSelectedUser },
    { label: `2nd Place - Rs.${prizeBreakdown.secondPrize}`, value: selectedSecondUser, setter: setSelectedSecondUser },
    { label: `3rd Place - Rs.${prizeBreakdown.thirdPrize}`, value: selectedThirdUser, setter: setSelectedThirdUser }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-accent text-glow-accent">
            <Trophy className="w-5 h-5" /> Declare Winner
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Select Tournament</label>
            <select
              required
              value={selectedTournament}
              onChange={(event) => setSelectedTournament(event.target.value)}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="">-- Choose Tournament --</option>
              {tournaments.map((tournament) => (
                <option key={tournament._id} value={tournament._id}>
                  {tournament.name} - {formatStatusLabel(tournament.status)} ({tournament.joined_count || 0}/{tournament.total_slots} joined)
                </option>
              ))}
            </select>
          </div>

          {squadMatch ? (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Select Winning Squad</label>
              <select
                required
                value={selectedSquad}
                onChange={(event) => setSelectedSquad(event.target.value)}
                disabled={!selectedTournament || squads.length === 0}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
              >
                <option value="">-- Choose Squad --</option>
                {squads.map((squad) => (
                  <option key={squad._id || squad.id} value={squad._id || squad.id}>
                    {squad.name} ({squad.memberCount || squad.members?.length || 0} members)
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                Prize Pool Rs.{prizeBreakdown.prizePool} | {prizeBreakdown.firstPrizePercentage}% payout | Captain receives Rs.{prizeBreakdown.firstPrize}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {playerSelects.map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">{field.label}</label>
                  <select
                    required
                    value={field.value}
                    onChange={(event) => field.setter(event.target.value)}
                    disabled={!selectedTournament || joinedUsers.length === 0}
                    className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
                  >
                    <option value="">-- Choose Player --</option>
                    {joinedUsers.map((user) => (
                      <option key={user._id} value={user._id}>{user.name || user.email}</option>
                    ))}
                  </select>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Prize Pool Rs.{prizeBreakdown.prizePool} | Reward Pool Rs.{prizeBreakdown.rewardPool} | Distribution {prizeBreakdown.soloFirstPercentage}/{prizeBreakdown.soloSecondPercentage}/{prizeBreakdown.soloThirdPercentage}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (squadMatch ? squads.length === 0 : joinedUsers.length === 0)}
            className="w-full py-3 mt-4 bg-accent text-accent-foreground font-bold rounded-xl hover:bg-accent/90 transition-all box-glow-accent flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Distribute Winnings'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeclareWinnerModal;

