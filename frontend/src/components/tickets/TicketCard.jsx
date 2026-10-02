import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, QrCode, MapPin, XCircle, Users } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { OptimizedImage } from '../ui/OptimizedImage';

export const TicketCard = ({
  ticket,
  onCancel,
  onViewQR,
}) => {
  if (!ticket) return null;

  const monument = typeof ticket.monumentId === 'object' ? ticket.monumentId : null;
  const monumentName = monument?.name || 'Heritage Monument';
  const monumentLocation = monument?.location || '';
  const monumentImage = monument?.imageUrl || '';

  const canCancel = ticket.status === 'booked' || ticket.status === 'valid';

  const formattedDate = new Date(ticket.visitDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="bg-white rounded-3xl border border-sandstone-200/90 shadow-sm hover:shadow-heritage transition-all duration-300 flex flex-col overflow-hidden relative group">
      
      {/* Top Header with Image & Token Chip */}
      <div className="relative h-36 bg-sandstone-100 overflow-hidden">
        {monumentImage ? (
          <OptimizedImage
            src={monumentImage}
            alt={monumentName}
            aspectRatio="h-full w-full"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-maroon-900 flex items-center justify-center text-gold-400">
            <span className="font-serif font-bold text-lg">{monumentName}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-charcoal-950/30 to-transparent pointer-events-none" />

        {/* Token Number pill */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black font-mono text-maroon-900 shadow border border-sandstone-200">
          #{ticket.tokenNumber || '---'}
        </div>

        {/* Monument details overlay */}
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <h4 className="text-xl font-bold font-serif leading-tight truncate">
            {monumentName}
          </h4>
          {monumentLocation && (
            <p className="text-xs text-sandstone-200 flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 text-gold-400" />
              <span>{monumentLocation}</span>
            </p>
          )}
        </div>
      </div>

      {/* Perforated separator with ticket notches */}
      <div className="relative flex items-center my-0">
        <div className="w-4 h-6 bg-ivory-100 rounded-r-full -ml-2 border-r border-t border-b border-sandstone-300" />
        <div className="flex-1 border-b-2 border-dashed border-sandstone-200 mx-1" />
        <div className="w-4 h-6 bg-ivory-100 rounded-l-full -mr-2 border-l border-t border-b border-sandstone-300" />
      </div>

      {/* Body details */}
      <div className="p-6 pt-4 flex-1 flex flex-col justify-between space-y-4">
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-sandstone-50 p-2.5 rounded-xl border border-sandstone-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500 flex items-center gap-1 mb-0.5">
              <Calendar className="w-3 h-3 text-maroon-700" /> Visit Date
            </span>
            <span className="font-bold text-charcoal-900 truncate block">{formattedDate}</span>
          </div>

          <div className="bg-sandstone-50 p-2.5 rounded-xl border border-sandstone-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500 flex items-center gap-1 mb-0.5">
              <Clock className="w-3 h-3 text-maroon-700" /> Time Slot
            </span>
            <span className="font-bold text-charcoal-900 truncate block">
              {ticket.slotStart} - {ticket.slotEnd}
            </span>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="pt-3 border-t border-sandstone-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge type="ticket" status={ticket.status} />
            {ticket.numberOfPeople && ticket.numberOfPeople > 1 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-maroon-800 bg-sandstone-100 px-2.5 py-0.5 rounded-full border border-sandstone-200">
                <Users className="w-3 h-3 text-maroon-700" /> {ticket.numberOfPeople} Visitors
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canCancel && onCancel && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-700 hover:text-red-800 hover:bg-red-50 text-xs px-2.5"
                onClick={() => onCancel(ticket._id)}
              >
                Cancel
              </Button>
            )}

            <Link to={`/tickets/${ticket._id}`}>
              <Button
                variant="primary"
                size="sm"
                icon={QrCode}
                className="text-xs px-3"
              >
                Pass &amp; QR
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
