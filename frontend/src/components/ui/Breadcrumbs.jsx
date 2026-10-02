import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = ({ items = [] }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs font-medium text-charcoal-500 mb-6 flex-wrap gap-1.5">
      <Link to="/" className="inline-flex items-center gap-1 hover:text-maroon-800 transition-colors">
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-sandstone-400 shrink-0" />
            {isLast || !item.href ? (
              <span className="text-charcoal-900 font-bold truncate max-w-[200px] sm:max-w-none">
                {item.label}
              </span>
            ) : (
              <Link to={item.href} className="hover:text-maroon-800 transition-colors truncate max-w-[150px] sm:max-w-none">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
