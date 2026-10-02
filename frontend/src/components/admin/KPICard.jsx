import React from 'react';
import { cn } from '../../utils/cn';

export const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default', // 'default' or 'maroon'
  className = '',
}) => {
  const isMaroon = variant === 'maroon';

  return (
    <div
      className={cn(
        'rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all duration-200 border',
        isMaroon
          ? 'bg-gradient-to-br from-maroon-800 to-maroon-950 text-white border-maroon-900 shadow-heritage'
          : 'bg-white text-charcoal-900 border-sandstone-200/90 hover:shadow-heritage',
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            'absolute right-[-10px] bottom-[-10px] w-28 h-28 pointer-events-none transition-transform group-hover:scale-110',
            isMaroon ? 'opacity-10 text-white' : 'opacity-5 text-maroon-900'
          )}
        >
          <Icon className="w-full h-full" />
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            'text-xs font-bold uppercase tracking-wider',
            isMaroon ? 'text-gold-300' : 'text-charcoal-500'
          )}
        >
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              'w-10 h-10 rounded-2xl flex items-center justify-center',
              isMaroon ? 'bg-white/10 text-gold-300' : 'bg-sandstone-100 text-maroon-800'
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div
        className={cn(
          'text-3xl sm:text-4xl font-black font-serif tracking-tight',
          isMaroon ? 'text-white' : 'text-charcoal-900'
        )}
      >
        {value}
      </div>

      {subtitle && (
        <div
          className={cn(
            'text-xs mt-2 font-medium',
            isMaroon ? 'text-sandstone-200/80' : 'text-charcoal-500'
          )}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};
