import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-maroon-800 hover:bg-maroon-700 text-white shadow-sm hover:shadow-md focus-visible:ring-maroon-800 border border-maroon-900/30',
    secondary: 'bg-sandstone-100 hover:bg-sandstone-200 text-charcoal-900 border border-sandstone-300 focus-visible:ring-sandstone-400',
    outline: 'bg-transparent border-2 border-maroon-800 text-maroon-850 hover:bg-maroon-50 text-maroon-800 focus-visible:ring-maroon-800',
    gold: 'bg-gold-500 hover:bg-gold-600 text-charcoal-950 font-bold shadow-sm hover:shadow-md border border-gold-600/30 focus-visible:ring-gold-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm focus-visible:ring-red-600 border border-red-700/30',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus-visible:ring-emerald-600 border border-emerald-700/30',
    ghost: 'bg-transparent hover:bg-sandstone-100 text-charcoal-700 hover:text-charcoal-900 focus-visible:ring-charcoal-400',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-bold',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
