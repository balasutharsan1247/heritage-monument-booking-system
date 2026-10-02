import React, { useState } from 'react';
import { Landmark } from 'lucide-react';
import { cn } from '../../utils/cn';

// Default cultural monument fallback image
const DEFAULT_HERITAGE_IMAGE = '/images/taj-mahal.jpg';

export const OptimizedImage = ({
  src,
  alt = 'Heritage Monument',
  className = '',
  wrapperClassName = '',
  aspectRatio = 'aspect-[16/10]',
  fallbackSrc = DEFAULT_HERITAGE_IMAGE,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // If initial src is completely empty or null, start directly in error/fallback state
  const targetSrc = error ? fallbackSrc : (src || fallbackSrc);

  return (
    <div className={cn('relative overflow-hidden bg-sandstone-100', aspectRatio, wrapperClassName)}>
      {/* Loading Skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-sandstone-200 animate-pulse flex items-center justify-center">
          <Landmark className="w-8 h-8 text-sandstone-400 opacity-50 animate-bounce" />
        </div>
      )}

      {/* Target Image */}
      <img
        src={targetSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!error && fallbackSrc && src !== fallbackSrc) {
            setError(true);
            setLoaded(false);
          } else {
            setLoaded(true); // Stop loading animation even if fallback fails
          }
        }}
        className={cn(
          'w-full h-full object-cover transition-all duration-500',
          loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
          className
        )}
        {...props}
      />

      {/* Fallback pattern overlay if both fail */}
      {error && targetSrc === fallbackSrc && !loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-maroon-900/10 text-maroon-800">
          <Landmark className="w-10 h-10 mb-2 opacity-60" />
          <span className="text-xs font-serif font-bold uppercase tracking-wider">{alt}</span>
        </div>
      )}
    </div>
  );
};
