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
  ScanLine
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { PageLoader } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';

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
              <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">Entry Fee</span>
              <span className="text-2xl font-extrabold font-sans text-maroon-900 mt-1 block">₹{monument.baseTicketPrice}</span>
            </div>

            <div className="bg-sandstone-50 rounded-2xl p-4 border border-sandstone-200">
              <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">Hours</span>
              <span className="text-sm font-bold text-charcoal-800 mt-1 block font-mono">{monument.openingTime} – {monument.closingTime}</span>
            </div>

            <div className="bg-sandstone-50 rounded-2xl p-4 border border-sandstone-200">
              <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">Capacity</span>
              <span className="text-2xl font-extrabold font-sans text-charcoal-900 mt-1 block">{monument.capacity}</span>
            </div>

            <div className="bg-sandstone-50 rounded-2xl p-4 border border-sandstone-200">
              <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider block">Status</span>
              <span className="text-sm font-bold text-charcoal-800 mt-1 block">
                {monument.isActive ? 'Open Today' : 'Closed'}
              </span>
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