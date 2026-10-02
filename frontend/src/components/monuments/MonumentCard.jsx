import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, ArrowRight } from 'lucide-react';
import { OptimizedImage } from '../ui/OptimizedImage';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';

export const MonumentCard = ({ monument }) => {
  if (!monument) return null;

  return (
    <div className="bg-white rounded-2xl border border-sandstone-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group overflow-hidden">
      {/* Image & Badges */}
      <div className="relative h-48 overflow-hidden bg-sandstone-100">
        <OptimizedImage
          src={monument.imageUrl}
          alt={monument.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 z-10">
          <StatusBadge type="monument" status={monument.isActive} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-2.5 left-3 right-3 text-white">
          <div className="flex items-center gap-1 text-xs text-sandstone-200">
            <MapPin className="w-3.5 h-3.5 text-gold-400 shrink-0" />
            <span className="truncate">{monument.location}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold font-serif text-charcoal-900 group-hover:text-maroon-800 transition-colors line-clamp-1">
            {monument.name}
          </h3>
          {monument.description && (
            <p className="text-xs text-charcoal-600 line-clamp-2 leading-relaxed">
              {monument.description}
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="pt-2.5 border-t border-sandstone-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-charcoal-600 font-medium">
            <Users className="w-3.5 h-3.5 text-maroon-700" />
            <span>{monument.capacity} visitors</span>
          </div>
          <div className="text-right font-bold text-maroon-900 font-serif text-base">
            ₹{monument.baseTicketPrice}
          </div>
        </div>

        {/* CTA Button */}
        <Link to={`/monuments/${monument._id}`} className="block w-full pt-1">
          <Button
            variant="primary"
            fullWidth
            icon={ArrowRight}
            iconPosition="right"
            className="text-xs py-2.5"
          >
            View Details &amp; Book
          </Button>
        </Link>
      </div>
    </div>
  );
};
