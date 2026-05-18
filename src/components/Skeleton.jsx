
import React from 'react';
import { cn } from '@/lib/utils';

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/50", className)}
      {...props}
    />
  );
};

export const TournamentCardSkeleton = () => {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 h-full flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
      <Skeleton className="h-8 w-3/4 rounded-md mt-2" />
      
      <div className="grid grid-cols-2 gap-4 mt-2">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      
      <div className="mt-auto space-y-3 pt-6">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-12 w-full rounded-lg mt-4" />
      </div>
    </div>
  );
};

export const TableRowSkeleton = ({ columns = 4 }) => {
  return (
    <tr className="border-b border-border/50">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-6 w-full max-w-[120px] rounded-md" />
        </td>
      ))}
    </tr>
  );
};

export const MetricCardSkeleton = () => {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6">
      <Skeleton className="h-5 w-32 mb-4" />
      <Skeleton className="h-10 w-24 mb-2" />
      <Skeleton className="h-4 w-40" />
    </div>
  );
};
