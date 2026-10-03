import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Search, X, Sparkles, Filter, SlidersHorizontal } from 'lucide-react';
import { MonumentGrid } from '../components/monuments/MonumentGrid';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { ErrorState } from '../components/ui/ErrorState';

export default function Monuments() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [monuments, setMonuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'open', 'closed'
  const [locationFilter, setLocationFilter] = useState('all');
  const [priceSort, setPriceSort] = useState('default'); // 'default', 'lowToHigh', 'highToLow'
  const [quickFilter, setQuickFilter] = useState('all'); // 'all', 'open', 'budget', 'popular'

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const fetchMonuments = () => {
    setLoading(true);
    setError(null);
    api.getMonuments()
      .then((res) => {
        if (res.success) {
          setMonuments(res.data.monuments || res.data || []);
        } else {
          setError(res.message || 'Failed to load monuments');
        }
      })
      .catch((err) => {
        console.error('Failed to load monuments:', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMonuments();
  }, []);

  const locations = useMemo(() => {
    const locSet = new Set();
    monuments.forEach((m) => {
      if (m.location) {
        // Extract city or state if possible
        const parts = m.location.split(',');
        locSet.add(parts[parts.length - 1].trim());
      }
    });
    return Array.from(locSet).sort();
  }, [monuments]);

  const filteredMonuments = useMemo(() => {
    return monuments
      .filter((m) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = m.name?.toLowerCase().includes(q);
          const matchLoc = m.location?.toLowerCase().includes(q);
          const matchDesc = m.description?.toLowerCase().includes(q);
          if (!matchName && !matchLoc && !matchDesc) return false;
        }

        // Status Filter
        if (statusFilter === 'open' && !m.isActive) return false;
        if (statusFilter === 'closed' && m.isActive) return false;

        // Quick Category Filter
        if (quickFilter === 'open' && !m.isActive) return false;
        if (quickFilter === 'budget' && (m.baseTicketPrice || 0) > 50) return false;
        if (quickFilter === 'popular' && (m.capacity || 0) < 300) return false;

        // Location Filter
        if (locationFilter !== 'all') {
          if (!m.location?.toLowerCase().includes(locationFilter.toLowerCase())) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (priceSort === 'lowToHigh') {
          return (a.baseTicketPrice || 0) - (b.baseTicketPrice || 0);
        }
        if (priceSort === 'highToLow') {
          return (b.baseTicketPrice || 0) - (a.baseTicketPrice || 0);
        }
        return 0;
      });
  }, [monuments, searchQuery, statusFilter, locationFilter, priceSort, quickFilter]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || locationFilter !== 'all' || priceSort !== 'default' || quickFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setLocationFilter('all');
    setPriceSort('default');
    setQuickFilter('all');
  };

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs items={[{ label: 'Monuments' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sandstone-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold font-sans text-charcoal-900 tracking-tight">
            Monuments Directory
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            Browse national cultural destinations and book guaranteed admission time-slots
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sandstone-100 border border-sandstone-200 text-xs font-bold text-charcoal-700 self-start sm:self-auto shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{filteredMonuments.length} destinations available</span>
        </div>
      </div>

      {/* Interactive Quick Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Destinations' },
          { id: 'open', label: 'Open Today' },
          { id: 'budget', label: 'Budget Passes (≤ ₹50)' },
          { id: 'popular', label: 'Major Sites (300+ Capacity)' },
        ].map((pill) => (
          <button
            key={pill.id}
            type="button"
            onClick={() => setQuickFilter(pill.id)}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer ${
              quickFilter === pill.id
                ? 'bg-maroon-800 text-white shadow-xs'
                : 'bg-white text-charcoal-700 hover:bg-sandstone-100 border border-sandstone-200'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-3xl border border-sandstone-200 p-5 shadow-heritage-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            icon={Search}
            placeholder="Search by name, city, state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            rightIcon={searchQuery ? X : null}
            onRightIconClick={() => setSearchQuery('')}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'open', label: 'Open Today' },
              { value: 'closed', label: 'Closed' },
            ]}
          />

          <Select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </Select>

          <Select
            value={priceSort}
            onChange={(e) => setPriceSort(e.target.value)}
            options={[
              { value: 'default', label: 'Default Order' },
              { value: 'lowToHigh', label: 'Price: Low to High' },
              { value: 'highToLow', label: 'Price: High to Low' },
            ]}
          />
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2.5 border-t border-sandstone-100 text-xs text-charcoal-600">
            <span>Filtering {filteredMonuments.length} of {monuments.length} monuments</span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-maroon-800 font-bold hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {error && (
        <ErrorState
          error={error}
          title="Could not load monuments"
          onRetry={fetchMonuments}
        />
      )}

      {!error && (
        <MonumentGrid
          monuments={filteredMonuments}
          loading={loading}
          emptyTitle={hasActiveFilters ? 'No monuments match your filters' : 'No monuments available'}
          emptyDescription={hasActiveFilters ? 'Try adjusting your search or filters.' : 'Check back later for available destinations.'}
        />
      )}
    </div>
  );
}