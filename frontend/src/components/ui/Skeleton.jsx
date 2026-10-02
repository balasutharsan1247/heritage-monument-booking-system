import React from 'react';
import { cn } from '../../utils/cn';

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-sandstone-200/70 rounded-xl relative overflow-hidden',
        className
      )}
      {...props}
    />
  );
};

export const MonumentCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-sandstone-200 p-5 shadow-sm space-y-4">
      <Skeleton className="h-48 -mx-5 -mt-5 rounded-t-2xl rounded-b-none" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="pt-4 border-t border-sandstone-100 flex justify-between items-center">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
};

export const TicketCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-sandstone-200 p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-3/4" />
      <div className="space-y-2 py-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="pt-4 border-t border-sandstone-100 flex justify-between items-center">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
};

export const KPICardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-sandstone-200 p-6 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="w-10 h-10 rounded-xl" />
      </div>
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
};

export const QueueRowSkeleton = () => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-sandstone-200">
      <div className="flex items-center gap-3">
        <Skeleton className="w-6 h-6 rounded-md" />
        <Skeleton className="h-7 w-28" />
      </div>
      <Skeleton className="h-5 w-20 rounded-md" />
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="bg-white rounded-2xl border border-sandstone-200 overflow-hidden">
      <div className="p-4 border-b border-sandstone-100 bg-sandstone-50/50 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-sandstone-100 p-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-sandstone-200 p-6 shadow-sm space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="h-64 flex items-end justify-between gap-4 pt-6 px-4">
        <Skeleton className="w-full h-1/3 rounded-t-lg" />
        <Skeleton className="w-full h-2/3 rounded-t-lg" />
        <Skeleton className="w-full h-1/2 rounded-t-lg" />
        <Skeleton className="w-full h-3/4 rounded-t-lg" />
      </div>
    </div>
  );
};
