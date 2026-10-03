import React from 'react';
import { Landmark } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
    xl: 'w-14 h-14 border-4',
  };

  return (
    <div
      className={cn(
        'rounded-full border-sandstone-300 border-t-maroon-800 animate-spin',
        sizes[size] || sizes.md,
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
};

export const PageLoader = ({ message = 'Loading Heritage Portal...' }) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-5 animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        {/* Outer pulsating heritage ring */}
        <div className="absolute w-20 h-20 rounded-full border-2 border-gold-400/40 animate-ping opacity-30" />
        
        {/* Rotating emblem border */}
        <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-maroon-700 animate-spin duration-1000 flex items-center justify-center" />
        
        {/* Center heritage icon */}
        <div className="absolute inset-0 flex items-center justify-center text-maroon-800">
          <Landmark className="w-7 h-7" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-bold uppercase tracking-widest text-maroon-900 font-sans">
          {message}
        </p>
        <p className="text-xs text-charcoal-400">
          National Heritage Monument E-Ticketing System
        </p>
      </div>
    </div>
  );
};
