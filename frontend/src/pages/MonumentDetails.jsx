import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  MapPin, 
  Clock, 
  Users, 
  Ticket as TicketIcon, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Calendar,
  Settings,
  ScanLine,
  Globe,
  Coins,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { PageLoader } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { getMonumentFallback } from '../utils/monumentImages';

export default function MonumentDetails() {
  const { id } = useParams();
  const [monument, setMonument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMonument = () => {
    setLoading(true);
    setError(null);
    api.getMonument(id)
      .then((res) => {
        if (res.success) {
          setMonument(res.data);
        } else {
          setError(res.message || 'Monument not found');
        }
      })
      .catch((err) => {
        console.error('Failed to load monument:', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMonument();
  }, [id]);

  if (loading) return <PageLoader message="Loading monument details..." />;

  if (error || !monument) {
    return (
      <div className="py-12">
        <ErrorState
          error={error || 'Monument record not found.'}
          title="Monument Not Found"
          onRetry={fetchMonument}
        />
      </div>
    );
  }

  const { user } = useAuth();

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Monuments', href: '/monuments' },
          { label: monument.name },
        ]}
      />

      <div className="bg-white rounded-3xl border border-sandstone-200 overflow-hidden shadow-sm">
        
        {/* Hero Image */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-sandstone-100">
          <OptimizedImage
            src={monument.imageUrl}
            alt={monument.name}
            aspectRatio="h-full w-full"
            fallbackSrc={getMonumentFallback(monument.name)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-transparent to-transparent pointer-events-none" />

          <div className="absolute bottom-5 left-6 right-6 text-white space-y-1">
            <StatusBadge type="monument" status={monument.isActive} />
            <h1 className="text-3xl sm:text-4xl font-extrabold font-sans text-white tracking-tight">
              {monument.name}
            </h1>
            <div className="flex items-center gap-1.5 text-sandstone-200 text-xs sm:text-sm">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{monument.location}</span>
            </div>
          </div>
        </div>

        {/* Details Body */}
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-sandstone-50 rounded-2xl p-4 border border-sandstone-200">
              <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">Domestic Fee</span>
              <span className="text-2xl font-extrabold font-sans text-maroon-900 mt-1 block">
                {monument.baseTicketPrice === 0 ? 'Free' : `₹${monument.baseTicketPrice}`}
              </span>
              <span className="text-[10px] text-charcoal-400 font-medium">base entry</span>
            </div>

            <div className="bg-sandstone-50 rounded-2xl p-4 border border-sandstone-200">
              <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">Foreign Fee</span>
              <span className="text-2xl font-extrabold font-sans text-amber-900 mt-1 block">
                {monument.foreignTicketPrice === 0 ? 'Free' : `₹${monument.foreignTicketPrice ?? 0}`}
              </span>
              <span className="text-[10px] text-charcoal-400 font-medium">international visitor</span>
            </div>

            <div className="bg-sandstone-50 rounded-2xl p-4 border border-sandstone-200">
              <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">Slot Capacity</span>
              <span className="text-2xl font-extrabold font-sans text-charcoal-900 mt-1 block">
                {monument.capacity ? monument.capacity.toLocaleString() : 'Open'}
              </span>
              <span className="text-[10px] text-charcoal-400 font-medium">per slot / session</span>
            </div>

            <div className="bg-sandstone-50 rounded-2xl p-4 border border-sandstone-200">
              <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider block">Operating Hours</span>
              <span className="text-sm font-bold text-charcoal-800 mt-1 block font-mono">{monument.openingTime} – {monument.closingTime}</span>
              <span className="text-[10px] text-charcoal-400 font-medium">{monument.isActive ? 'Open Today' : 'Closed'}</span>
            </div>
          </div>

          {/* Description */}
          {monument.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
                About the Monument
              </h3>
              <p className="text-charcoal-600 leading-relaxed text-sm">
                {monument.description}
              </p>
            </div>
          )}

          {/* ========================================================= */}
          {/* SLOT CAPACITY & TICKET PRICING OVERVIEW SECTION */}
          {/* ========================================================= */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-sandstone-200 pb-2.5">
              <div className="flex items-center gap-2">
                <TicketIcon className="w-4 h-4 text-maroon-800" />
                <h3 className="text-base font-extrabold font-sans text-charcoal-900">
                  Slot Capacity & Ticket Pricing Overview
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Official ASI / Trust Schedule
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Time Slots & Slot Capacity */}
              <div className="p-4 rounded-2xl bg-sandstone-50/70 border border-sandstone-200 space-y-3">
                <div className="flex items-center gap-2 text-charcoal-900 font-bold text-xs uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-maroon-800" />
                  <span>Time Slots & Slot Capacity</span>
                </div>
                
                <div className="space-y-2 text-xs text-charcoal-700">
                  {monument.sessionsInfo ? (
                    <div>
                      <span className="font-semibold text-charcoal-900 block">Sessions & Windows:</span>
                      <p className="text-charcoal-600 mt-0.5">{monument.sessionsInfo}</p>
                    </div>
                  ) : (
                    <div>
                      <span className="font-semibold text-charcoal-900 block">Sessions & Windows:</span>
                      <p className="text-charcoal-600 mt-0.5">{monument.openingTime} to {monument.closingTime}</p>
                    </div>
                  )}

                  <div className="pt-1 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2.5 rounded-xl border border-sandstone-200">
                      <span className="text-charcoal-400 block font-medium">Slot Capacity</span>
                      <span className="font-extrabold text-charcoal-900 text-sm">
                        {monument.capacity?.toLocaleString()} visitors
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-sandstone-200">
                      <span className="text-charcoal-400 block font-medium">Daily Visitor Cap</span>
                      <span className="font-extrabold text-charcoal-900 text-sm">
                        {monument.dailyCapacity ? `~${monument.dailyCapacity.toLocaleString()}` : 'Continuous flow'}
                      </span>
                    </div>
                  </div>

                  {monument.stayLimit && (
                    <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span><strong>Stay Limit:</strong> {monument.stayLimit}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Ticket Pricing Matrix */}
              <div className="p-4 rounded-2xl bg-sandstone-50/70 border border-sandstone-200 space-y-3">
                <div className="flex items-center gap-2 text-charcoal-900 font-bold text-xs uppercase tracking-wider">
                  <Coins className="w-4 h-4 text-maroon-800" />
                  <span>Ticket Pricing Schedule</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Domestic Pricing */}
                  <div className="bg-white p-3 rounded-xl border border-sandstone-200 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-charcoal-900 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-maroon-700" />
                        Domestic Visitors
                      </span>
                      <span className="font-black text-maroon-900 text-sm">
                        {monument.baseTicketPrice === 0 ? 'Free' : `₹${monument.baseTicketPrice}`}
                      </span>
                    </div>
                    {monument.ticketPricingDomestic && (
                      <p className="text-[11px] text-charcoal-600 leading-tight">
                        {monument.ticketPricingDomestic}
                      </p>
                    )}
                  </div>

                  {/* Foreign Pricing */}
                  <div className="bg-white p-3 rounded-xl border border-sandstone-200 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-charcoal-900 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-amber-700" />
                        Foreign Visitors
                      </span>
                      <span className="font-black text-amber-900 text-sm">
                        {monument.foreignTicketPrice === 0 ? 'Free' : `₹${monument.foreignTicketPrice ?? 0}`}
                      </span>
                    </div>
                    {monument.ticketPricingForeign && (
                      <p className="text-[11px] text-charcoal-600 leading-tight">
                        {monument.ticketPricingForeign}
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Additional Fees and Booking Rules Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Additional Fees */}
              {monument.additionalFees && (
                <div className="p-4 rounded-2xl bg-sandstone-50/70 border border-sandstone-200 space-y-2">
                  <span className="font-bold text-charcoal-900 text-xs uppercase tracking-wider block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Additional Fees & Special Entry
                  </span>
                  <p className="text-xs text-charcoal-700 leading-relaxed">
                    {monument.additionalFees}
                  </p>
                </div>
              )}

              {/* Booking Rules */}
              {monument.bookingRules && monument.bookingRules.length > 0 && (
                <div className="p-4 rounded-2xl bg-sandstone-50/70 border border-sandstone-200 space-y-2">
                  <span className="font-bold text-charcoal-900 text-xs uppercase tracking-wider block flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    Booking Rules & Guidelines
                  </span>
                  <ul className="space-y-1 text-xs text-charcoal-700 list-disc list-inside">
                    {monument.bookingRules.map((rule, idx) => (
                      <li key={idx} className="leading-snug">
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Online Ticketing Discount Callout */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300/80 flex items-start gap-2 text-xs text-amber-950 font-medium">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>ASI Online Ticketing Benefit:</strong> Booking directly online via this portal provides dynamic time-slot reservation, offers up to ₹5 discount on domestic base rates compared to manual counter queues, and avoids gate congestion.
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-sandstone-100">
            {user?.role === 'staff' ? (
              <>
                <Link to="/staff/queue" className="flex-1">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={Users}
                    fullWidth
                  >
                    Open Counter Queue
                  </Button>
                </Link>
                <Link to="/staff/validate" className="flex-1">
                  <Button
                    variant="secondary"
                    size="lg"
                    icon={ScanLine}
                    fullWidth
                  >
                    Ticket Validator
                  </Button>
                </Link>
              </>
            ) : user?.role === 'admin' ? (
              <Link to="/admin/dashboard" className="flex-1">
                <Button
                  variant="primary"
                  size="lg"
                  icon={Settings}
                  fullWidth
                >
                  Manage in Dashboard
                </Button>
              </Link>
            ) : (
              <Link to={`/book/${monument._id}`} className="flex-1">
                <Button
                  variant="primary"
                  size="lg"
                  icon={Calendar}
                  fullWidth
                  disabled={!monument.isActive}
                >
                  {monument.isActive ? 'Book Visit' : 'Currently Closed'}
                </Button>
              </Link>
            )}

            <Link to={`/queue/${monument._id}`} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none">
              <Button
                variant="outline"
                size="lg"
                icon={ExternalLink}
                iconPosition="right"
                fullWidth
              >
                Live Queue Kiosk
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}