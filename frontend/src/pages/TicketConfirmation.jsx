import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api';
import { useQueueSocket } from '../hooks/useQueueSocket';
import SocketStatus from '../components/SocketStatus';
import { Users, Clock } from 'lucide-react';

export default function TicketConfirmation() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTicketAndQueue = async () => {
    try {
      const tRes = await api.getTicket(id);
      if (tRes.success) {
        setTicket(tRes.data);
      }
      
      const qRes = await api.getMyQueue(id);
      if (qRes.success) {
        setQueueStatus(qRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketAndQueue();
  }, [id]);

  const monumentIdStr = ticket ? (typeof ticket.monumentId === 'object' ? ticket.monumentId._id : ticket.monumentId) : null;
  const { socketState } = useQueueSocket(monumentIdStr, fetchTicketAndQueue);

  if (loading) return <div className="p-12 text-center text-xl animate-pulse">Generating your ticket...</div>;
  if (!ticket) return <div className="p-12 text-center text-red-500 font-bold text-xl">Ticket not found or unauthorized.</div>;

  return (
    <div className="max-w-md mx-auto space-y-6 mt-6">
      
      <div className="flex justify-end">
        <SocketStatus state={socketState} onRefresh={fetchTicketAndQueue} />
      </div>

      {queueStatus && queueStatus.status === 'waiting' && (
        <div className="bg-white dark:bg-maroon-900 rounded-2xl shadow-lg p-6 border-2 border-maroon-200 dark:border-maroon-800 animate-in slide-in-from-bottom-4">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-maroon-800 dark:text-maroon-100">
            <Users className="w-5 h-5" /> Live Queue Update
          </h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-maroon-50 dark:bg-maroon-950 p-4 rounded-xl border border-maroon-100 dark:border-maroon-700">
              <div className="text-xs uppercase font-bold text-maroon-600 dark:text-maroon-400 mb-1">People Ahead</div>
              <div className="text-3xl font-black text-maroon-900 dark:text-maroon-50">{queueStatus.entriesAhead}</div>
            </div>
            <div className="bg-maroon-50 dark:bg-maroon-950 p-4 rounded-xl border border-maroon-100 dark:border-maroon-700">
              <div className="text-xs uppercase font-bold text-maroon-600 dark:text-maroon-400 mb-1 flex justify-center items-center gap-1"><Clock className="w-3 h-3"/> Est. Wait</div>
              <div className="text-2xl font-black text-maroon-900 dark:text-maroon-50 mt-1">{queueStatus.estimatedWait} <span className="text-sm font-medium">min</span></div>
            </div>
          </div>
        </div>
      )}

      {queueStatus && queueStatus.status === 'called' && (
        <div className="bg-green-100 dark:bg-green-900 border-2 border-green-300 dark:border-green-700 rounded-2xl shadow-lg p-6 text-center animate-bounce">
          <h3 className="font-black text-2xl text-green-800 dark:text-green-100 mb-2">It's your turn!</h3>
          <p className="text-green-700 dark:text-green-200 font-medium">Please proceed to the entrance counter now.</p>
        </div>
      )}

      <div className="bg-white dark:bg-maroon-900 rounded-3xl shadow-2xl overflow-hidden border-2 border-maroon-100 dark:border-maroon-800 transform transition-all">
        <div className="bg-gradient-to-r from-maroon-800 to-maroon-600 text-white p-8 text-center shadow-inner">
          <h2 className="text-3xl font-black tracking-tight mb-2">E-Ticket</h2>
          <p className="opacity-80 font-mono tracking-widest bg-black/20 inline-block px-3 py-1 rounded-full text-sm">{ticket._id.slice(-8).toUpperCase()}</p>
        </div>
        
        <div className="p-8">
          <div className="flex justify-center bg-white p-4 rounded-2xl shadow-inner border border-gray-100 mb-8">
            <QRCodeSVG value={ticket.qrCodeData} size={220} level="H" />
          </div>
          
          <div className="space-y-4 text-sm font-medium">
            <div className="flex justify-between items-center bg-maroon-50 dark:bg-maroon-950 p-3 rounded-lg">
              <span className="text-maroon-600 dark:text-maroon-400 uppercase text-xs font-bold">Date</span>
              <span className="font-bold text-base">{new Date(ticket.visitDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex justify-between items-center bg-maroon-50 dark:bg-maroon-950 p-3 rounded-lg">
              <span className="text-maroon-600 dark:text-maroon-400 uppercase text-xs font-bold">Time Slot</span>
              <span className="font-bold text-base">{ticket.slotStart} - {ticket.slotEnd}</span>
            </div>
            <div className="flex justify-between items-center bg-maroon-50 dark:bg-maroon-950 p-3 rounded-lg">
              <span className="text-maroon-600 dark:text-maroon-400 uppercase text-xs font-bold">Status</span>
              <span className={`font-black uppercase text-base ${ticket.status === 'valid' ? 'text-green-600' : 'text-red-600'}`}>{ticket.status}</span>
            </div>
            {ticket.tokenNumber && (
              <div className="flex justify-between items-center bg-maroon-100 dark:bg-maroon-800 p-4 rounded-lg mt-4 border-2 border-maroon-200 dark:border-maroon-700">
                <span className="text-maroon-800 dark:text-maroon-200 uppercase text-sm font-black">Queue Token</span>
                <span className="text-3xl font-black text-maroon-900 dark:text-maroon-50">#{ticket.tokenNumber}</span>
              </div>
            )}
          </div>

          <Link to="/my-tickets" className="block text-center w-full bg-maroon-700 text-white py-4 rounded-xl font-bold hover:bg-maroon-600 transition-colors mt-8 shadow-md">
            View Ticket History
          </Link>
        </div>
      </div>
    </div>
  );
}