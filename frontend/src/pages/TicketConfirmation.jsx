import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useQueueSocket } from '../hooks/useQueueSocket';
import SocketStatus from '../components/SocketStatus';
import { QRCodeCard } from '../components/tickets/QRCodeCard';
import { QueueStatusWidget } from '../components/tickets/QueueStatusWidget';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { ErrorState } from '../components/ui/ErrorState';
import { Calendar, Clock, Printer, ArrowLeft, Users, CheckCircle2 } from 'lucide-react';

export default function TicketConfirmation() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(id);
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTicketAndQueue = useCallback(async () => {
    try {
      const [tRes, qRes] = await Promise.all([
        api.getTicket(selectedTicketId || id),
        api.getMyQueue(selectedTicketId || id).catch(() => ({ success: false })),
      ]);

      if (tRes.success) {
        setTicket(tRes.data);
      } else {
        setError(tRes.message || 'Ticket not found or unauthorized');
      }

      if (qRes?.success) {
        setQueueStatus(qRes.data);
      }
    } catch (err) {
      console.error('Error fetching ticket & queue:', err);
      setError('Unable to load ticket details.');
    } finally {
      setLoading(false);
    }
  }, [id, selectedTicketId]);

  useEffect(() => {
    fetchTicketAndQueue();
  }, [fetchTicketAndQueue]);

  const siblingTickets = ticket?.siblingTickets || (ticket ? [ticket] : []);
  const currentTicket = siblingTickets.find((t) => t._id === selectedTicketId) || ticket;

  const monumentIdStr = ticket
    ? typeof ticket.monumentId === 'object'
      ? ticket.monumentId._id
      : ticket.monumentId
    : null;

  const { socketState } = useQueueSocket(monumentIdStr, fetchTicketAndQueue);

  if (loading) return <PageLoader message="Loading ticket..." />;

  if (error || !ticket || !currentTicket) {
    return (
      <div className="py-12">
        <ErrorState
          error={error || 'Ticket record could not be found'}
          title="Ticket Not Found"
          onRetry={fetchTicketAndQueue}
        />
      </div>
    );
  }

  const monument = typeof ticket.monumentId === 'object' ? ticket.monumentId : null;
  const monumentName = monument?.name || 'Heritage Monument';
  const monumentLocation = monument?.location || '';

  const formattedDate = new Date(ticket.visitDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-12 max-w-md mx-auto">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Breadcrumbs
          items={[
            { label: 'My Tickets', href: '/my-tickets' },
            { label: `Pass #${currentTicket.tokenNumber || currentTicket._id.slice(-6)}` },
          ]}
        />
        <SocketStatus state={socketState} onRefresh={fetchTicketAndQueue} />
      </div>

      {/* Group / Bulk Pass Banner */}
      {currentTicket.numberOfPeople > 1 && (
        <div className="bg-sandstone-100/90 border border-sandstone-300 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-maroon-800 text-gold-300 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-charcoal-900 text-sm">
                  Bulk Entry Pass ({currentTicket.numberOfPeople} Visitors)
                </span>
                <span className="bg-maroon-100 text-maroon-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Single QR Pass
                </span>
              </div>
              <p className="text-[11px] text-charcoal-500 mt-0.5">
                Valid for all {currentTicket.numberOfPeople} visitors together. Staff will count your party physically at entry.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Multiple Passes Switcher (Shown only if legacy split tickets exist) */}
      {siblingTickets.length > 1 && (
        <div className="bg-sandstone-100/80 p-3 rounded-2xl border border-sandstone-300 space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-charcoal-900 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-maroon-800" />
              Order Passes ({siblingTickets.length} Passes)
            </span>
            <span className="text-charcoal-500 text-[11px]">
              Tap pass to switch QR
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {siblingTickets.map((t, idx) => {
              const isCurrent = currentTicket._id === t._id;
              return (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => setSelectedTicketId(t._id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-maroon-800 text-white shadow-2xs'
                      : 'bg-white text-charcoal-700 hover:bg-sandstone-200 border border-sandstone-200'
                  }`}
                >
                  {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-gold-400" />}
                  <span>Pass #{idx + 1}</span>
                  <span className="opacity-75 font-mono text-[10px]">
                    ({t.tokenNumber?.slice(-5) || ''})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Queue Status Widget */}
      <QueueStatusWidget
        queueStatus={queueStatus}
        tokenNumber={currentTicket.tokenNumber}
        onRefresh={fetchTicketAndQueue}
      />

      {/* Ticket Card */}
      <div className="bg-white rounded-3xl border border-sandstone-300 shadow-sm overflow-hidden print-include">
        
        {/* Pass Header */}
        <div className="bg-maroon-900 text-white p-6 text-center">
          <h2 className="text-2xl font-bold font-serif">
            {monumentName}
          </h2>
          {monumentLocation && (
            <p className="text-xs text-sandstone-300 mt-0.5">
              {monumentLocation}
            </p>
          )}
          {currentTicket.numberOfPeople > 1 && (
            <div className="inline-block mt-2 px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold border border-gold-400/30">
              Bulk Pass • {currentTicket.numberOfPeople} Visitors Admitted
            </div>
          )}
        </div>

        {/* QR & Details */}
        <div className="p-6 space-y-5">
          <div className="flex justify-center">
            <StatusBadge type="ticket" status={currentTicket.status} />
          </div>

          <QRCodeCard
            value={currentTicket.qrCodeData}
            tokenNumber={currentTicket.tokenNumber}
            size={200}
          />

          {/* Details */}
          <div className="space-y-2 text-xs border-t border-sandstone-100 pt-4">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-sandstone-50">
              <span className="text-charcoal-500 font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-maroon-800" /> Attendees
              </span>
              <span className="font-bold text-charcoal-900">
                {currentTicket.numberOfPeople || 1} {(currentTicket.numberOfPeople || 1) === 1 ? 'Person' : 'People (Bulk Pass)'}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-sandstone-50">
              <span className="text-charcoal-500 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-maroon-800" /> Date
              </span>
              <span className="font-semibold text-charcoal-800">
                {formattedDate}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-sandstone-50">
              <span className="text-charcoal-500 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-maroon-800" /> Slot
              </span>
              <span className="font-semibold text-charcoal-800 font-mono">
                {currentTicket.slotStart} – {currentTicket.slotEnd}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="secondary"
              icon={Printer}
              onClick={() => window.print()}
              fullWidth
            >
              Print Pass
            </Button>
            <Link to="/my-tickets">
              <Button
                variant="primary"
                icon={ArrowLeft}
                fullWidth
              >
                All Tickets
              </Button>
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}