import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon = null,
  rightIcon: RightIcon = null,
  onRightIconClick,
  className = '',
  required = false,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-charcoal-700">
          {label} {required && <span className="text-maroon-600">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          required={required}
          className={cn(
            'w-full rounded-xl bg-white text-charcoal-900 border border-sandstone-300 px-4 py-2.5 text-sm transition-all duration-150',
            'placeholder:text-charcoal-400 focus:outline-none focus:border-maroon-700 focus:ring-2 focus:ring-maroon-600/20',
            'disabled:bg-sandstone-50 disabled:text-charcoal-400 disabled:cursor-not-allowed',
            Icon && 'pl-10',
            RightIcon && 'pr-10',
            error && 'border-red-500 focus:border-red-600 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            tabIndex={onRightIconClick ? 0 : -1}
            className={cn(
              'absolute inset-y-0 right-0 pr-3.5 flex items-center text-charcoal-400',
              onRightIconClick ? 'hover:text-charcoal-700 cursor-pointer' : 'pointer-events-none'
            )}
          >
            <RightIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 font-medium animate-in fade-in">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs text-charcoal-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
