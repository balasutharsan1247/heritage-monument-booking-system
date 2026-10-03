import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Premium National Heritage Monument Logo & Emblem Component.
 * Features high-contrast golden monument architecture and compass star
 * ensuring crystal-clear visibility on dark navbars, light cards, and mobile screens.
 */
export const Logo = ({
  variant = 'navbar', // 'navbar' | 'light' | 'footer' | 'hero'
  size = 'md',        // 'sm' | 'md' | 'lg'
  showSubtitle = true,
  className = '',
}) => {
  const isLight = variant === 'light';

  const sizeConfig = {
    sm: {
      emblem: 'w-8 h-8 rounded-xl',
      icon: 'w-4 h-4',
      title: 'text-sm font-bold',
      sub: 'text-[8.5px]',
      gap: 'gap-2',
    },
    md: {
      emblem: 'w-10 h-10 rounded-2xl',
      icon: 'w-5 h-5',
      title: 'text-base sm:text-lg font-extrabold',
      sub: 'text-[9.5px]',
      gap: 'gap-2.5',
    },
    lg: {
      emblem: 'w-13 h-13 rounded-2xl',
      icon: 'w-6 h-6',
      title: 'text-xl sm:text-2xl font-black',
      sub: 'text-[11px]',
      gap: 'gap-3.5',
    },
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={cn('flex items-center select-none group', currentSize.gap, className)}>
      {/* Visual Emblem Badge */}
      <div
        className={cn(
          'relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105',
          currentSize.emblem,
          'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600',
          'border border-amber-200/90 shadow-md shadow-amber-950/30 ring-2 ring-amber-400/20'
        )}
      >
        {/* Subtle inner glow highlight */}
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-black/20 via-transparent to-white/40 pointer-events-none" />

        {/* Custom Heritage Architectural Monument + Compass SVG Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(currentSize.icon, 'text-maroon-950 drop-shadow-xs relative z-10')}
          aria-hidden="true"
        >
          {/* Central Dome / Heritage Monument Arch */}
          <path d="M4 21V11a8 8 0 0 1 16 0v10" strokeWidth="2.2" />
          <path d="M2 21h20" strokeWidth="2.4" />
          {/* Central Gate Arch */}
          <path d="M9 21v-5a3 3 0 0 1 6 0v5" strokeWidth="2.2" />
          {/* Compass / Heritage Spire Finial */}
          <circle cx="12" cy="4" r="1.5" fill="currentColor" />
          <path d="M12 2v2" strokeWidth="2" />
          <path d="M8 8.5l4-2.5 4 2.5" strokeWidth="1.8" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col text-left leading-tight">
        <span
          className={cn(
            currentSize.title,
            'tracking-tight transition-colors duration-200 font-sans',
            isLight
              ? 'text-charcoal-900 group-hover:text-maroon-800'
              : 'text-white group-hover:text-amber-200'
          )}
        >
          Heritage Monuments
        </span>

        {showSubtitle && (
          <span
            className={cn(
              currentSize.sub,
              'font-bold tracking-widest uppercase transition-colors',
              isLight
                ? 'text-maroon-800/80'
                : 'text-amber-300/90'
            )}
          >
            National Ticketing Portal
          </span>
        )}
      </div>
    </div>
  );
};
