import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const formatForInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const formatDatePart = (value) => formatForInput(value).slice(0, 10);
const formatTimePart = (value) => formatForInput(value).slice(11, 16);

const EditTournamentModal = ({ isOpen, onOpenChange, tournament, onSuccess }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: 'BGMI',
    title: '',
    match_type: 'solo',
    squad_size: '4',
    entry_fee: '',
    base_prize: '',
    prize_pool_visible: true,
    first_prize_percentage: '50',
    solo_first_place_percentage: '60',
    solo_second_place_percentage: '30',
    solo_third_place_percentage: '10',
    total_slots: '',
    status: 'active',
    match_start_date: '',
    match_start_clock: ''
  });

  useEffect(() => {
    if (!tournament) return;
    setFormData({
      name: tournament.name || 'BGMI',
      title: tournament.title || '',
      match_type: tournament.match_type || tournament.matchType || 'solo',
      squad_size: String(tournament.squad_size || tournament.squadSize || 4),
      entry_fee: String(tournament.entry_fee ?? 0),
      base_prize: String(tournament.base_prize ?? 0),
      prize_pool_visible: tournament.prize_pool_visible ?? tournament.prizePoolVisible ?? true,
      first_prize_percentage: String(tournament.first_prize_percentage ?? tournament.firstPrizePercentage ?? 50),
      solo_first_place_percentage: String(tournament.solo_first_place_percentage ?? tournament.soloFirstPlacePercentage ?? 60),
      solo_second_place_percentage: String(tournament.solo_second_place_percentage ?? tournament.soloSecondPlacePercentage ?? 30),
      solo_third_place_percentage: String(tournament.solo_third_place_percentage ?? tournament.soloThirdPlacePercentage ?? 10),
      total_slots: String(tournament.total_slots ?? 1),
      status: tournament.status || 'active',
      match_start_date: formatDatePart(tournament.match_start_time || tournament.startTime),
      match_start_clock: formatTimePart(tournament.match_start_time || tournament.startTime)
    });
  }, [tournament]);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!tournament) return;
    const tournamentId = tournament._id || tournament.id;
    if (!tournamentId) {
      return toast({ title: 'Error', description: 'Tournament ID is missing.', variant: 'destructive' });
    }

    const entryFee = Number(formData.entry_fee);
    const basePrize = Number(formData.base_prize || 0);
    const firstPrizePercentage = Number(formData.first_prize_percentage);
    const soloFirstPlacePercentage = Number(formData.solo_first_place_percentage);
    const soloSecondPlacePercentage = Number(formData.solo_second_place_percentage);
    const soloThirdPlacePercentage = Number(formData.solo_third_place_percentage);
    const totalSlots = Number(formData.total_slots);
    const squadSize = Number(formData.squad_size || 1);

    if (entryFee < 0 || basePrize < 0 || totalSlots < 1 || Number.isNaN(entryFee) || Number.isNaN(basePrize) || Number.isNaN(totalSlots)) {
      return toast({ title: 'Validation Error', description: 'Please enter valid positive numbers.', variant: 'destructive' });
    }
    if (formData.match_type === 'squad' && (Number.isNaN(firstPrizePercentage) || firstPrizePercentage < 1 || firstPrizePercentage > 100)) {
      return toast({ title: 'Validation Error', description: 'First prize percentage must be between 1 and 100.', variant: 'destructive' });
    }
    if (formData.match_type === 'solo') {
      const soloTotal = soloFirstPlacePercentage + soloSecondPlacePercentage + soloThirdPlacePercentage;
      if ([soloFirstPlacePercentage, soloSecondPlacePercentage, soloThirdPlacePercentage].some((value) => Number.isNaN(value) || value < 0 || value > 100)) {
        return toast({ title: 'Validation Error', description: 'Solo prize percentages must be between 0 and 100.', variant: 'destructive' });
      }
      if (soloTotal !== 100) {
        return toast({ title: 'Validation Error', description: 'Total prize distribution must equal 100%.', variant: 'destructive' });
      }
    }
    if (formData.match_type === 'squad' && (Number.isNaN(squadSize) || squadSize < 2)) {
      return toast({ title: 'Validation Error', description: 'Squad size must be at least 2 for squad matches.', variant: 'destructive' });
    }

    setIsLoading(true);
    try {
      const payload = {
        name: formData.name,
        title: formData.title.trim() || `${formData.name} ${formData.match_type === 'squad' ? 'Squad Clash' : 'Solo Showdown'}`,
        match_type: formData.match_type,
        squad_size: formData.match_type === 'squad' ? squadSize : 1,
        entry_fee: entryFee,
        base_prize: basePrize,
        prize_pool_visible: formData.prize_pool_visible,
        first_prize_percentage: formData.match_type === 'squad' ? firstPrizePercentage : 100,
        solo_first_place_percentage: formData.match_type === 'solo' ? soloFirstPlacePercentage : 60,
        solo_second_place_percentage: formData.match_type === 'solo' ? soloSecondPlacePercentage : 30,
        solo_third_place_percentage: formData.match_type === 'solo' ? soloThirdPlacePercentage : 10,
        total_slots: totalSlots,
        status: formData.status
      };

      if (formData.match_start_date && formData.match_start_clock) {
        payload.match_start_time = new Date(`${formData.match_start_date}T${formData.match_start_clock}`).toISOString();
      }

      await apiClient.put(`/tournaments/${tournamentId}`, payload);
      toast({ title: 'Success', description: 'Tournament updated successfully.' });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to update tournament.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const isCompleted = tournament?.status === 'completed';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-accent text-glow-accent">Edit Tournament</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Game</label>
            <select
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isCompleted}
              className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
            >
              <option value="BGMI">BGMI</option>
              <option value="Free Fire">Free Fire</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Tournament Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={isCompleted}
              className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Match Type</label>
              <select
                name="match_type"
                value={formData.match_type}
                onChange={handleChange}
                disabled={isCompleted}
                className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
              >
                <option value="solo">Solo</option>
                <option value="squad">Squad</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isCompleted}
                className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Entry Fee (Rs.)</label>
              <input
                type="number"
                name="entry_fee"
                min="0"
                required
                disabled={isCompleted}
                value={formData.entry_fee}
                onChange={handleChange}
                className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Base Prize (Rs.)</label>
              <input
                type="number"
                name="base_prize"
                min="0"
                required={formData.match_type === 'squad'}
                disabled={isCompleted}
                value={formData.base_prize}
                onChange={handleChange}
                className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
              />
              {formData.match_type === 'solo' ? <p className="mt-1 text-xs text-muted-foreground">Solo prize pool me base prize + entry collection dono add honge.</p> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Prize Pool Visibility</p>
                <p className="text-xs text-muted-foreground">Prize calculation stays active; public card/detail display follows this toggle.</p>
              </div>
              <button
                type="button"
                disabled={isCompleted}
                onClick={() => setFormData((current) => ({ ...current, prize_pool_visible: !current.prize_pool_visible }))}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all disabled:opacity-50 ${formData.prize_pool_visible ? 'border-secondary/35 bg-secondary/10 text-secondary' : 'border-muted bg-muted/30 text-muted-foreground'}`}
              >
                {formData.prize_pool_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {formData.prize_pool_visible ? 'Prize Pool Visible' : 'Prize Pool Hidden'}
              </button>
            </div>
          </div>

          <div className={`grid gap-4 ${formData.match_type === 'squad' ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Total Player Slots</label>
              <input
                type="number"
                name="total_slots"
                min="1"
                required
                disabled={isCompleted}
                value={formData.total_slots}
                onChange={handleChange}
                className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
              />
            </div>
            {formData.match_type === 'squad' ? (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Squad Size</label>
                <input
                  type="number"
                  name="squad_size"
                  min="2"
                  required
                  disabled={isCompleted}
                  value={formData.squad_size}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
                />
              </div>
            ) : null}
          </div>

          {formData.match_type === 'squad' ? (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">First Prize (%)</label>
              <input
                type="number"
                name="first_prize_percentage"
                min="1"
                max="100"
                required
                disabled={isCompleted}
                value={formData.first_prize_percentage}
                onChange={handleChange}
                className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-muted-foreground">Prize pool ka kitna percent winner squad ko milega.</p>
            </div>
          ) : null}

          {formData.match_type === 'solo' ? (
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
              <div className="mb-3">
                <h4 className="text-sm font-bold text-foreground">Solo Prize Distribution</h4>
                <p className="text-xs text-muted-foreground">Reward pool total collection ka 50% hoga. Total exactly 100% hona chahiye.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">1st Place (%)</label>
                  <input type="number" name="solo_first_place_percentage" min="0" max="100" required disabled={isCompleted} value={formData.solo_first_place_percentage} onChange={handleChange} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">2nd Place (%)</label>
                  <input type="number" name="solo_second_place_percentage" min="0" max="100" required disabled={isCompleted} value={formData.solo_second_place_percentage} onChange={handleChange} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">3rd Place (%)</label>
                  <input type="number" name="solo_third_place_percentage" min="0" max="100" required disabled={isCompleted} value={formData.solo_third_place_percentage} onChange={handleChange} className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50" />
                </div>
              </div>
              <p className={`mt-2 text-xs font-semibold ${Number(formData.solo_first_place_percentage) + Number(formData.solo_second_place_percentage) + Number(formData.solo_third_place_percentage) === 100 ? 'text-secondary' : 'text-destructive'}`}>
                Total: {Number(formData.solo_first_place_percentage) + Number(formData.solo_second_place_percentage) + Number(formData.solo_third_place_percentage)}%
              </p>
            </div>
          ) : null}

          <div className="pt-4 border-t border-border/50">
            <h4 className="text-sm font-bold text-foreground mb-1">Schedule</h4>
            <p className="text-xs text-muted-foreground mb-3">Room ID and password are managed from the dedicated tournament details page.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Match Date</label>
                <input
                  type="date"
                  name="match_start_date"
                  disabled={isCompleted}
                  value={formData.match_start_date}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Match Time</label>
                <input
                  type="time"
                  name="match_start_clock"
                  disabled={isCompleted}
                  value={formData.match_start_clock}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isCompleted}
            className="w-full py-3 mt-4 bg-accent text-accent-foreground font-bold rounded-xl hover:bg-accent/90 transition-all box-glow-accent flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTournamentModal;

