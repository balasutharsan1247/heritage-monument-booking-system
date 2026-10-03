import React from 'react';
import { Landmark, Compass } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = Compass,
  title = 'No items found',
  description = 'There are no records to display at this moment.',
  actionLabel,
  onAction,
  actionHref,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-3xl border border-sandstone-200 p-10 sm:p-14 text-center max-w-lg mx-auto shadow-sm my-6 ${className}`}>
      <div className="w-16 h-16 bg-sandstone-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-maroon-700 border border-sandstone-200">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-charcoal-900 font-sans mb-2">
        {title}
      </h3>
      <p className="text-sm text-charcoal-600 mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        <div>
          {actionHref ? (
            <a href={actionHref}>
              <Button variant="primary">{actionLabel}</Button>
            </a>
          ) : (
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
