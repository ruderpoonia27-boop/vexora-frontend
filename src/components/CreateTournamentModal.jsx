import React, { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const buildDistribution = (count, type, existing = []) => (
  Array.from({ length: count }).map((_, index) => {
    const current = existing[index] || {};
    const defaults = count === 1 ? [100] : count === 2 ? [70, 30] : count === 3 ? [50, 30, 20] : [];
    return {
      place: index + 1,
      label: current.label || `${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'} Prize`,
      percentage: type === 'percentage' ? String(current.percentage ?? defaults[index] ?? '') : '',
      amount: type === 'fixed' ? String(current.amount ?? '') : ''
    };
  })
);

const initialFormData = {
  name: 'BGMI',
  title: '',
  match_type: 'solo',
  squad_size: '4',
  entry_type: 'paid',
  entry_fee: '',
  base_prize: '',
  prize_distribution_type: 'percentage',
  winner_count_mode: '3',
  custom_winner_count: '4',
  prize_display_note: '',
  prize_distribution: buildDistribution(3, 'percentage'),
  total_slots: '',
  match_start_date: '',
  match_start_clock: ''
};

const CreateTournamentModal = ({ isOpen, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const winnerCount = useMemo(() => (
    formData.winner_count_mode === 'custom'
      ? Math.max(1, Number(formData.custom_winner_count) || 1)
      : Number(formData.winner_count_mode)
  ), [formData.custom_winner_count, formData.winner_count_mode]);

  const distributionTotal = useMemo(() => (
    formData.prize_distribution_type === 'percentage'
      ? formData.prize_distribution.reduce((sum, item) => sum + Number(item.percentage || 0), 0)
      : formData.prize_distribution.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  ), [formData.prize_distribution, formData.prize_distribution_type]);

  const setDistributionType = (type) => {
    setFormData((current) => ({
      ...current,
      prize_distribution_type: type,
      prize_distribution: buildDistribution(winnerCount, type, current.prize_distribution)
    }));
  };

  const setWinnerMode = (mode) => {
    const nextCount = mode === 'custom' ? Math.max(1, Number(formData.custom_winner_count) || 1) : Number(mode);
    setFormData((current) => ({
      ...current,
      winner_count_mode: mode,
      prize_distribution: buildDistribution(nextCount, current.prize_distribution_type, current.prize_distribution)
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => {
      const next = { ...current, [name]: value };
      if (name === 'entry_type') {
        next.entry_fee = value === 'free' ? '' : current.entry_fee;
        next.prize_distribution_type = value === 'free' ? 'fixed' : current.prize_distribution_type;
        next.prize_distribution = buildDistribution(winnerCount, next.prize_distribution_type, current.prize_distribution);
      }
      if (name === 'custom_winner_count' && current.winner_count_mode === 'custom') {
        next.prize_distribution = buildDistribution(Math.max(1, Number(value) || 1), current.prize_distribution_type, current.prize_distribution);
      }
      return next;
    });
  };

  const updateDistribution = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      prize_distribution: current.prize_distribution.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      ))
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const paidEntry = formData.entry_type === 'paid';
    const entryFee = paidEntry ? Number(formData.entry_fee) : 0;
    const basePrize = Number(formData.base_prize || 0);
    const totalSlots = Number(formData.total_slots);
    const squadSize = Number(formData.squad_size || 1);
    const prizeDistribution = formData.prize_distribution.map((item, index) => ({
      place: index + 1,
      label: item.label,
      percentage: Number(item.percentage || 0),
      amount: Number(item.amount || 0)
    }));

    if (paidEntry && (Number.isNaN(entryFee) || entryFee <= 0)) {
      return toast({ title: 'Validation Error', description: 'Paid tournaments need a valid entry fee.', variant: 'destructive' });
    }
    if (Number.isNaN(basePrize) || basePrize < 0) {
      return toast({ title: 'Validation Error', description: 'Prize pool must be a valid number.', variant: 'destructive' });
    }
    if (formData.prize_distribution_type === 'percentage' && distributionTotal !== 100) {
      return toast({ title: 'Validation Error', description: 'Prize percentages must total 100%.', variant: 'destructive' });
    }
    if (formData.prize_distribution_type === 'fixed' && distributionTotal <= 0) {
      return toast({ title: 'Validation Error', description: 'Fixed prize amounts must be greater than zero.', variant: 'destructive' });
    }
    if (Number.isNaN(totalSlots) || totalSlots < 1) {
      return toast({ title: 'Validation Error', description: 'Total player slots must be at least 1.', variant: 'destructive' });
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
        entry_type: formData.entry_type,
        entry_fee: entryFee,
        base_prize: formData.prize_distribution_type === 'fixed' ? distributionTotal : basePrize,
        prize_distribution_type: formData.prize_distribution_type,
        winner_count: winnerCount,
        prize_distribution: prizeDistribution,
        prize_display_note: formData.prize_display_note.trim(),
        total_slots: totalSlots,
        status: 'active'
      };

      if (formData.match_start_date && formData.match_start_clock) {
        payload.match_start_time = new Date(`${formData.match_start_date}T${formData.match_start_clock}`).toISOString();
      }

      await apiClient.post('/tournaments', payload);
      toast({ title: 'Success', description: 'Tournament created successfully.' });
      setFormData(initialFormData);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Failed to create tournament',
        description: error.message || 'Please check the tournament details and try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-accent text-glow-accent">Create Tournament</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="block text-sm font-medium text-muted-foreground">Game</span>
              <select name="name" value={formData.name} onChange={handleChange} className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
                <option value="BGMI">BGMI</option>
                <option value="Free Fire">Free Fire</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="block text-sm font-medium text-muted-foreground">Match Type</span>
              <select name="match_type" value={formData.match_type} onChange={handleChange} className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
                <option value="solo">Solo</option>
                <option value="squad">Squad</option>
              </select>
            </label>
          </div>

          <label className="space-y-1">
            <span className="block text-sm font-medium text-muted-foreground">Tournament Title</span>
            <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Optional custom title" className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
          </label>

          <label className="space-y-1">
            <span className="block text-sm font-medium text-muted-foreground">Card Highlight Text</span>
            <input type="text" name="prize_display_note" value={formData.prize_display_note} onChange={handleChange} placeholder="Example: 3 prizes available" className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
          </label>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-4">
            <div>
              <p className="mb-2 text-sm font-bold text-foreground">Entry Type</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {['paid', 'free'].map((type) => (
                  <button key={type} type="button" onClick={() => handleChange({ target: { name: 'entry_type', value: type } })} className={`rounded-xl border px-4 py-3 text-left font-bold capitalize transition-all ${formData.entry_type === type ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border bg-background/50 text-muted-foreground'}`}>
                    {type === 'paid' ? 'Paid Entry' : 'Free Entry'}
                  </button>
                ))}
              </div>
            </div>
            {formData.entry_type === 'paid' ? (
              <label className="block space-y-1">
                <span className="block text-sm font-medium text-muted-foreground">Entry Fee (Rs.)</span>
                <input type="number" name="entry_fee" min="1" value={formData.entry_fee} onChange={handleChange} className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
              </label>
            ) : (
              <div className="rounded-xl border border-secondary/25 bg-secondary/10 px-4 py-3 text-sm font-bold text-secondary">This tournament will show as FREE ENTRY.</div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="block text-sm font-medium text-muted-foreground">Total Player Slots</span>
              <input type="number" name="total_slots" min="1" value={formData.total_slots} onChange={handleChange} className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
            </label>
            {formData.match_type === 'squad' ? (
              <label className="space-y-1">
                <span className="block text-sm font-medium text-muted-foreground">Squad Size</span>
                <input type="number" name="squad_size" min="2" value={formData.squad_size} onChange={handleChange} className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
              </label>
            ) : null}
            {formData.prize_distribution_type === 'percentage' ? (
              <label className="space-y-1">
                <span className="block text-sm font-medium text-muted-foreground">Base Prize (Rs.)</span>
                <input type="number" name="base_prize" min="0" value={formData.base_prize} onChange={handleChange} className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
              </label>
            ) : null}
          </div>

          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 space-y-4">
            <div>
              <p className="mb-2 text-sm font-bold text-foreground">Prize Distribution</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {['percentage', 'fixed'].map((type) => (
                  <button key={type} type="button" onClick={() => setDistributionType(type)} className={`rounded-xl border px-4 py-3 text-left font-bold transition-all ${formData.prize_distribution_type === type ? 'border-accent/40 bg-accent/15 text-accent' : 'border-border bg-background/50 text-muted-foreground'}`}>
                    {type === 'percentage' ? 'Percentage Based' : 'Fixed Amount Based'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-foreground">Number of Winners</p>
              <div className="grid grid-cols-4 gap-2">
                {['1', '2', '3', 'custom'].map((mode) => (
                  <button key={mode} type="button" onClick={() => setWinnerMode(mode)} className={`rounded-lg border px-3 py-2 text-sm font-bold capitalize ${formData.winner_count_mode === mode ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border bg-background/50 text-muted-foreground'}`}>
                    {mode}
                  </button>
                ))}
              </div>
              {formData.winner_count_mode === 'custom' ? (
                <input type="number" name="custom_winner_count" min="1" max="10" value={formData.custom_winner_count} onChange={handleChange} className="mt-3 w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
              ) : null}
            </div>

            <div className="space-y-3">
              {formData.prize_distribution.map((item, index) => (
                <div key={item.place} className="grid gap-3 rounded-xl border border-border/70 bg-background/50 p-3 sm:grid-cols-[1fr_130px]">
                  <input type="text" value={item.label} onChange={(event) => updateDistribution(index, 'label', event.target.value)} className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
                  <input
                    type="number"
                    min="0"
                    value={formData.prize_distribution_type === 'percentage' ? item.percentage : item.amount}
                    onChange={(event) => updateDistribution(index, formData.prize_distribution_type === 'percentage' ? 'percentage' : 'amount', event.target.value)}
                    placeholder={formData.prize_distribution_type === 'percentage' ? '%' : 'Rs.'}
                    className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              ))}
              <p className={`text-xs font-semibold ${formData.prize_distribution_type === 'percentage' ? (distributionTotal === 100 ? 'text-secondary' : 'text-destructive') : 'text-secondary'}`}>
                {formData.prize_distribution_type === 'percentage' ? `Total: ${distributionTotal}%` : `Total Prize Pool: Rs.${distributionTotal}`}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border/50">
            <h4 className="text-sm font-bold text-foreground mb-1">Schedule</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="block text-xs font-medium text-muted-foreground">Match Date</span>
                <input type="date" name="match_start_date" value={formData.match_start_date} onChange={handleChange} className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
              </label>
              <label className="space-y-1">
                <span className="block text-xs font-medium text-muted-foreground">Match Time</span>
                <input type="time" name="match_start_clock" value={formData.match_start_clock} onChange={handleChange} className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50" />
              </label>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-3 mt-4 bg-accent text-accent-foreground font-bold rounded-xl hover:bg-accent/90 transition-all box-glow-accent flex items-center justify-center">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Tournament'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTournamentModal;
