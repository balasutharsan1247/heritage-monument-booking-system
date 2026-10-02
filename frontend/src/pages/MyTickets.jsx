import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Ticket as TicketIcon } from 'lucide-react';
import { TicketCard } from '../components/tickets/TicketCard';
import { TicketCardSkeleton } from '../components/ui/Skeleton';
import { Tabs } from '../components/ui/Tabs';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { ErrorState } from '../components/ui/ErrorState';
import { useToast } from '../components/ui/Toast';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const [cancellingTicketId, setCancellingTicketId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const toast = useToast();

  const fetchTickets = () => {
    setLoading(true);
    setError(null);
    api.getMyTickets()
      .then((res) => {
        if (res.success) {
          setTickets(res.data || []);
        } else {
          setError(res.message || 'Failed to load tickets');
        }
      })
      .catch((err) => {
        console.error('Failed to load tickets:', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancellingTicketId) return;
    setCancelLoading(true);
    try {
      const res = await api.cancelTicket(cancellingTicketId);
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) => (t._id === cancellingTicketId ? { ...t, status: 'cancelled' } : t))
        );
        toast.success('Ticket cancelled.');
      } else {
        toast.error(res.message || 'Could not cancel ticket.');
      }
    } catch (err) {
      toast.error('Network error cancelling ticket.');
    } finally {
      setCancelLoading(false);
      setCancellingTicketId(null);
    }
  };

  const filteredTickets = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tickets.filter((t) => {
      const visitDate = new Date(t.visitDate);
      visitDate.setHours(0, 0, 0, 0);
      const isPast = visitDate < today || t.status === 'used';
      const isCancelled = t.status === 'cancelled';
      const isUpcoming = (t.status === 'booked' || t.status === 'valid') && !isPast;

      if (activeTab === 'upcoming') return isUpcoming;
      if (activeTab === 'past') return isPast && !isCancelled;
      if (activeTab === 'cancelled') return isCancelled;
      return true;
    });
  }, [tickets, activeTab]);

  const tabsConfig = [
    { id: 'all', label: 'All', count: tickets.length },
    {
      id: 'upcoming',
      label: 'Upcoming',
      count: tickets.filter((t) => t.status === 'booked' || t.status === 'valid').length,
    },
    {
      id: 'past',
      label: 'Visited',
      count: tickets.filter((t) => t.status === 'used').length,
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      count: tickets.filter((t) => t.status === 'cancelled').length,
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'My Tickets' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sandstone-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-charcoal-900">
            My Tickets
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Your reserved entry passes and tickets
          </p>
        </div>

        <Link to="/monuments">
          <button className="bg-maroon-800 hover:bg-maroon-700 text-white px-4 py-2 rounded-xl font-semibold text-xs transition-colors cursor-pointer">
            + Book Visit
          </button>
        </Link>
      </div>

      {/* Tabs */}
      {!loading && tickets.length > 0 && (
        <Tabs
          tabs={tabsConfig}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
        />
      )}

      {error && (
        <ErrorState
          error={error}
          title="Could not load tickets"
          onRetry={fetchTickets}
        />
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <TicketCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <EmptyState
          icon={TicketIcon}
          title="No Tickets Yet"
          description="You haven't booked any monument passes yet."
          actionLabel="Explore Monuments"
          actionHref="/monuments"
        />
      )}

      {!loading && !error && tickets.length > 0 && filteredTickets.length === 0 && (
        <EmptyState
          icon={TicketIcon}
          title="No matching tickets"
          description={`No tickets found under "${activeTab}".`}
        />
      )}

      {!loading && !error && filteredTickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((t) => (
            <TicketCard
              key={t._id}
              ticket={t}
              onCancel={(id) => setCancellingTicketId(id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(cancellingTicketId)}
        onClose={() => setCancellingTicketId(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Ticket?"
        message="Are you sure you want to cancel this booking?"
        confirmText="Cancel Ticket"
        cancelText="Keep"
        variant="danger"
        loading={cancelLoading}
      />

    </div>
  );
}