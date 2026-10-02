import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Ticket as TicketIcon, 
  Bell, 
  SkipForward, 
  AlertCircle 
} from 'lucide-react';
import { Badge } from './Badge';

export const StatusBadge = ({ type = 'ticket', status, className = '' }) => {
  if (!status) return null;
  const s = String(status).toLowerCase();

  // Ticket Status
  if (type === 'ticket') {
    switch (s) {
      case 'booked':
      case 'valid':
        return (
          <Badge variant="success" icon={CheckCircle2} className={className}>
            Confirmed
          </Badge>
        );
      case 'used':
        return (
          <Badge variant="info" icon={TicketIcon} className={className}>
            Checked In
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="danger" icon={XCircle} className={className}>
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="default" className={className}>
            {status}
          </Badge>
        );
    }
  }

  // Queue Status
  if (type === 'queue') {
    switch (s) {
      case 'waiting':
        return (
          <Badge variant="warning" icon={Clock} className={className}>
            Waiting
          </Badge>
        );
      case 'called':
        return (
          <Badge variant="maroon" icon={Bell} className={`animate-pulse ${className}`}>
            Now Serving
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="success" icon={CheckCircle2} className={className}>
            Completed
          </Badge>
        );
      case 'skipped':
        return (
          <Badge variant="default" icon={SkipForward} className={className}>
            Skipped
          </Badge>
        );
      default:
        return (
          <Badge variant="default" className={className}>
            {status}
          </Badge>
        );
    }
  }

  // Monument Status
  if (type === 'monument') {
    const isOpen = status === true || s === 'open' || s === 'active';
    return isOpen ? (
      <Badge variant="success" icon={CheckCircle2} className={className}>
        Open Today
      </Badge>
    ) : (
      <Badge variant="danger" icon={AlertCircle} className={className}>
        Closed
      </Badge>
    );
  }

  return <Badge variant="default" className={className}>{status}</Badge>;
};
