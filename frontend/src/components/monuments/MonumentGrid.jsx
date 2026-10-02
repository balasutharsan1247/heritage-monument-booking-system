import React from 'react';
import { MonumentCard } from './MonumentCard';
import { MonumentCardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Compass } from 'lucide-react';

export const MonumentGrid = ({
  monuments = [],
  loading = false,
  emptyTitle = 'No monuments found',
  emptyDescription = 'Try adjusting your search keywords or active filters.',
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <MonumentCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!monuments.length) {
    return (
      <EmptyState
        icon={Compass}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {monuments.map((monument) => (
        <MonumentCard key={monument._id} monument={monument} />
      ))}
    </div>
  );
};
