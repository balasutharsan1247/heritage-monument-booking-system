import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import { Search, X } from 'lucide-react';
import { MonumentGrid } from '../components/monuments/MonumentGrid';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { ErrorState } from '../components/ui/ErrorState';

export default function Monuments() {
  const [monuments, setMonuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'open', 'closed'
  const [locationFilter, setLocationFilter] = useState('all');
  const [priceSort, setPriceSort] = useState('default'); // 'default', 'lowToHigh', 'highToLow'

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
      if (m.location) locSet.add(m.location.split(',')[0].trim());
    });
    return Array.from(locSet);
  }, [monuments]);

  const filteredMonuments = useMemo(() => {
    return monuments
      .filter((m) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = m.name?.toLowerCase().includes(q);
          const matchLoc = m.location?.toLowerCase().includes(q);
          const matchDesc = m.description?.toLowerCase().includes(q);
          if (!matchName && !matchLoc && !matchDesc) return false;
        }

        if (statusFilter === 'open' && !m.isActive) return false;
        if (statusFilter === 'closed' && m.isActive) return false;

        if (locationFilter !== 'all') {
          if (!m.location?.toLowerCase().includes(locationFilter.toLowerCase())) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (priceSort === 'lowToHigh') return (a.baseTicketPrice || 0) - (b.baseTicketPrice || 0);
        if (priceSort === 'highToLow') return (b.baseTicketPrice || 0) - (a.baseTicketPrice || 0);
        return 0;
      });
  }, [monuments, searchQuery, statusFilter, locationFilter, priceSort]);

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || locationFilter !== 'all' || priceSort !== 'default';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setLocationFilter('all');
    setPriceSort('default');
  };

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs items={[{ label: 'Monuments' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sandstone-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-charcoal-900">
            Monuments
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Browse destinations and book entry time slots
          </p>
        </div>
        <div className="text-xs text-charcoal-500 font-medium">
          {filteredMonuments.length} monuments available
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-sandstone-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            icon={Search}
            placeholder="Search monuments..."
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
              { value: 'open', label: 'Open' },
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
          <div className="flex items-center justify-between pt-2 border-t border-sandstone-100 text-xs text-charcoal-500">
            <span>Filtered results</span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-maroon-800 font-semibold hover:underline cursor-pointer"
            >
              Reset filters
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