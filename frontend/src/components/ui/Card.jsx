import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-sandstone-200 shadow-sm overflow-hidden transition-all duration-200',
        hover && 'hover:shadow-heritage hover:border-sandstone-300 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={cn('p-5 sm:p-6 pb-2', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '', as: Component = 'h3', ...props }) => {
  return (
    <Component className={cn('text-lg sm:text-xl font-bold text-charcoal-900 tracking-tight', className)} {...props}>
      {children}
    </Component>
  );
};

export const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={cn('text-sm text-charcoal-500 mt-1', className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={cn('p-5 sm:p-6', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={cn('p-5 sm:p-6 pt-0 border-t border-sandstone-100 flex items-center', className)} {...props}>
      {children}
    </div>
  );
};
