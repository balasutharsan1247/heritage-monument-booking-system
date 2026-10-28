import React, { useState, useEffect } from 'react';
import { Landmark } from 'lucide-react';
import { cn } from '../../utils/cn';
import { DEFAULT_FALLBACK_IMAGE } from '../../utils/monumentImages';

export const OptimizedImage = ({
  src,
  alt = 'Heritage Monument',
  className = '',
  wrapperClassName = '',
  aspectRatio = 'aspect-[16/10]',
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setFallbackFailed(false);
  }, [src, fallbackSrc]);

  // If initial src is completely empty or null, start directly in fallback state
  const targetSrc = error ? fallbackSrc : (src || fallbackSrc);

  const handleImageError = () => {
    if (!error && fallbackSrc && src !== fallbackSrc) {
      // First attempt failed, switch to fallback image
      setError(true);
      setLoaded(false);
    } else {
      // Fallback image failed or no fallback available
      setFallbackFailed(true);
      setLoaded(true);
    }
  };

  return (
    <div className={cn('relative overflow-hidden bg-sandstone-100', aspectRatio, wrapperClassName)}>
      {/* Loading Skeleton */}
      {!loaded && !fallbackFailed && (
        <div className="absolute inset-0 bg-sandstone-200 animate-pulse flex items-center justify-center">
          <Landmark className="w-8 h-8 text-sandstone-400 opacity-50 animate-bounce" />
        </div>
      )}

      {/* Target Image */}
      {!fallbackFailed && (
        <img
          src={targetSrc}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={handleImageError}
          className={cn(
            'w-full h-full object-cover transition-all duration-500',
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
            className
          )}
          {...props}
        />
      )}

      {/* Fallback pattern overlay if all images fail */}
      {fallbackFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-sandstone-100 border border-sandstone-200 text-maroon-900">
          <Landmark className="w-10 h-10 mb-2 opacity-60 text-maroon-700" />
          <span className="text-xs font-sans font-bold uppercase tracking-wider text-charcoal-700 text-center line-clamp-2">
            {alt}
          </span>
        </div>
      )}
    </div>
  );
};
