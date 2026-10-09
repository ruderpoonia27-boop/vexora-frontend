import React, { useMemo } from 'react';
import { calculatePrizeBreakdown } from '@/lib/prizeUtils';

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

// Platform fee input plus a live "if all slots fill" payout preview for percentage-based paid tournaments.
// Uses the same prize math as the server, so what the admin sees here is what players will be paid.
const PlatformFeeSection = ({ feePercentage, onFeeChange, entryFee, totalSlots, basePrize, distribution }) => {
  const preview = useMemo(() => {
    const slots = Math.max(0, Number(totalSlots) || 0);
    return calculatePrizeBreakdown({
      entry_type: 'paid',
      entry_fee: Number(entryFee) || 0,
      match_type: 'solo',
      joined_count: slots,
      total_slots: slots,
      base_prize: Number(basePrize) || 0,
      prize_distribution_type: 'percentage',
      platform_fee_percentage: feePercentage === '' ? 0 : Number(feePercentage),
      prize_distribution: distribution.map((item, index) => ({
        place: index + 1,
        label: item.label,
        percentage: Number(item.percentage || 0)
      }))
    });
  }, [basePrize, distribution, entryFee, feePercentage, totalSlots]);

  const feeValue = Number(feePercentage);
  const feeInvalid = feePercentage === '' || Number.isNaN(feeValue) || feeValue < 0 || feeValue > 90;
  const ready = Number(entryFee) > 0 && Number(totalSlots) > 0;

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-background/50 p-3">
      <label className="block space-y-1">
        <span className="block text-sm font-bold text-foreground">Platform fee (%)</span>
        <input
          type="number"
          min="0"
          max="90"
          value={feePercentage}
          onChange={(event) => onFeeChange(event.target.value)}
          className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <span className="block text-xs text-muted-foreground">
          Kept from entry fees. Players get the rest, plus the full base prize.
        </span>
        {feeInvalid ? <span className="block text-xs font-semibold text-destructive">Fee must be between 0% and 90%.</span> : null}
      </label>

      {ready && !feeInvalid ? (
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">If all {totalSlots} slots fill</p>
          <dl className="space-y-1">
            <div className="flex justify-between"><dt className="text-muted-foreground">Entry collection</dt><dd className="font-semibold tabular-nums">{formatMoney(preview.totalCollection)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Platform fee ({feeValue}%)</dt><dd className="font-semibold tabular-nums">− {formatMoney(preview.totalCollection - (preview.prizePool - preview.basePrize))}</dd></div>
            {preview.basePrize > 0 ? (
              <div className="flex justify-between"><dt className="text-muted-foreground">Base prize</dt><dd className="font-semibold tabular-nums">+ {formatMoney(preview.basePrize)}</dd></div>
            ) : null}
            <div className="flex justify-between border-t border-border/60 pt-1"><dt className="font-bold text-foreground">Prize pool shown to players</dt><dd className="font-black tabular-nums text-accent">{formatMoney(preview.prizePool)}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">
            {preview.prizeEntries.map((entry) => `${entry.label}: ${formatMoney(entry.amount)}`).join(' · ')}
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default PlatformFeeSection;
