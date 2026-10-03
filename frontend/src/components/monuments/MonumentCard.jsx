import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, ArrowRight, Heart, Sparkles } from 'lucide-react';
import { OptimizedImage } from '../ui/OptimizedImage';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

export const MonumentCard = ({ monument }) => {
  const { user } = useAuth?.() || {};
  const isStaff = user?.role === 'staff';
  const isAdmin = user?.role === 'admin';
  const showDetailsOnly = isStaff || isAdmin;
  const [isSaved, setIsSaved] = useState(false);

  if (!monument) return null;

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  return (
    <div className="bg-white rounded-3xl border border-sandstone-200/90 shadow-sm hover:shadow-heritage hover:border-amber-400/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col group overflow-hidden relative">
      {/* Image & Badges */}
      <div className="relative h-56 overflow-hidden bg-sandstone-100">
        <OptimizedImage
          src={monument.imageUrl}
          alt={monument.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
        />
        
        {/* Status Badge */}
        <div className="absolute top-3.5 right-3.5 z-10 drop-shadow-sm flex items-center gap-2">
          <StatusBadge type="monument" status={monument.isActive} />
          
          {/* Interactive Bookmark / Save Button */}
          <button
            type="button"
            onClick={toggleFavorite}
            className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 shadow-sm ${
              isSaved
                ? 'bg-rose-500 text-white scale-110'
                : 'bg-charcoal-950/60 text-white/90 hover:bg-white hover:text-rose-500'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save monument'}
            aria-label={isSaved ? 'Remove from saved' : 'Save monument'}
          >
            <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Ambient Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/85 via-charcoal-950/20 to-transparent pointer-events-none" />
        
        {/* Location pill */}
        <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-charcoal-950/70 backdrop-blur-md border border-white/20 text-xs text-sandstone-100 max-w-full shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate font-medium">{monument.location}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold font-sans text-charcoal-900 group-hover:text-maroon-800 transition-colors line-clamp-1 tracking-tight">
            {monument.name}
          </h3>
          {monument.description && (
            <p className="text-xs text-charcoal-600 line-clamp-2 leading-relaxed">
              {monument.description}
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="pt-3 border-t border-sandstone-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-charcoal-600 font-semibold bg-sandstone-50 px-2.5 py-1 rounded-lg border border-sandstone-200/60">
            <Users className="w-3.5 h-3.5 text-maroon-700" />
            <span>{monument.capacity} daily limit</span>
          </div>
          <div className="text-right">
            <span className="font-extrabold text-maroon-900 font-sans text-lg tracking-tight">
              ₹{monument.baseTicketPrice}
            </span>
            <span className="text-[10px] text-charcoal-400 block -mt-1 font-sans">per pass</span>
          </div>
        </div>

        {/* CTA Button */}
        <Link to={`/monuments/${monument._id}`} className="block w-full pt-1">
          <Button
            variant="primary"
            fullWidth
            icon={ArrowRight}
            iconPosition="right"
            className="text-xs py-2.5 font-bold transition-all group-hover:shadow-md group-hover:bg-maroon-700"
          >
            {showDetailsOnly ? 'View Details' : 'View Details & Book'}
          </Button>
        </Link>
      </div>
    </div>
  );
};
