import React from 'react';
import { cn } from '../../utils/cn';

export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  variant = 'pills', // 'pills' or 'underline'
}) => {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-2 overflow-x-auto pb-1 scrollbar-none',
        variant === 'underline' && 'border-b border-sandstone-200 gap-6 pb-0',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        if (variant === 'underline') {
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 py-3 px-1 text-sm font-bold border-b-2 transition-all whitespace-nowrap focus-visible:outline-none',
                isActive
                  ? 'border-maroon-800 text-maroon-850 text-maroon-800'
                  : 'border-transparent text-charcoal-500 hover:text-charcoal-800 hover:border-sandstone-300'
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-bold',
                  isActive ? 'bg-maroon-100 text-maroon-800' : 'bg-sandstone-100 text-charcoal-600'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        // Default 'pills'
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap focus-visible:outline-none',
              isActive
                ? 'bg-maroon-800 text-white shadow-sm'
                : 'bg-white text-charcoal-700 hover:bg-sandstone-100 border border-sandstone-200'
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-bold ml-1',
                isActive ? 'bg-white/20 text-white' : 'bg-sandstone-100 text-charcoal-700'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
