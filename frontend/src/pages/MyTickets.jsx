import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Ticket, Calendar, Clock, QrCode } from 'lucide-react';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyTickets().then(res => {
      if (res.success) setTickets(res.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this ticket?')) return;
    const res = await api.cancelTicket(id);
    if (res.success) {
      setTickets(tickets.map(t => t._id === id ? { ...t, status: 'cancelled' } : t));
    }
  };

  if (loading) return <div className="p-12 text-center text-xl animate-pulse">Loading your history...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 border-b-2 border-maroon-100 dark:border-maroon-800 pb-4">
        <Ticket className="w-8 h-8 text-maroon-700 dark:text-maroon-300" />
        <h1 className="text-4xl font-extrabold text-maroon-800 dark:text-maroon-50">My Tickets</h1>
      </div>

      {!tickets.length ? (
        <div className="bg-white dark:bg-maroon-900 p-12 text-center rounded-2xl shadow-md border border-maroon-100 dark:border-maroon-800">
          <p className="text-xl text-maroon-600 mb-6">You haven't booked any tickets yet.</p>
          <Link to="/monuments" className="bg-maroon-700 text-white px-6 py-3 rounded-lg font-bold">Book a Visit</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {tickets.map(t => (
            <div key={t._id} className="bg-white dark:bg-maroon-900 border-2 border-maroon-100 dark:border-maroon-800 rounded-2xl shadow hover:shadow-lg transition-shadow p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-maroon-50 dark:bg-maroon-950 px-4 py-2 rounded-bl-2xl font-bold font-mono text-sm border-b border-l border-maroon-100 dark:border-maroon-800">
                #{t.tokenNumber || '---'}
              </div>
              
              <h3 className="font-black text-2xl text-maroon-900 dark:text-maroon-100 mb-4 pr-16">{t.monumentId?.name || 'Monument'}</h3>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-maroon-700 dark:text-maroon-300 font-medium">
                  <Calendar className="w-4 h-4" /> {new Date(t.visitDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-maroon-700 dark:text-maroon-300 font-medium">
                  <Clock className="w-4 h-4" /> {t.slotStart} - {t.slotEnd}
                </div>
              </div>

              <div className="flex justify-between items-center mt-auto pt-4 border-t-2 border-maroon-50 dark:border-maroon-800">
                <span className={`px-4 py-1.5 text-xs font-black uppercase rounded-full tracking-widest ${t.status === 'valid' ? 'bg-green-100 text-green-800 border border-green-200' : t.status === 'used' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                  {t.status}
                </span>
                
                <div className="flex items-center gap-3">
                  {t.status === 'valid' && (
                    <button onClick={() => handleCancel(t._id)} className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">Cancel</button>
                  )}
                  <Link to={`/tickets/${t._id}`} className="flex items-center gap-1 bg-maroon-100 text-maroon-800 dark:bg-maroon-800 dark:text-maroon-100 px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-maroon-200 transition-colors">
                    <QrCode className="w-4 h-4" /> View QR
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}