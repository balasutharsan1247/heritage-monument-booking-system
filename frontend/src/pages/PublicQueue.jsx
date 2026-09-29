import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { Users } from 'lucide-react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import SocketStatus from '../components/SocketStatus';

export default function PublicQueue() {
  const { id } = useParams();
  const [monument, setMonument] = useState(null);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const res = await api.getStaffQueue(id);
      if (res.success) {
        setQueue(res.data);
      } else {
        setQueue({ current: { tokenNumber: '--' }, waiting: [] });
      }
    } catch (err) {
      console.log('Public queue requires auth or failed, using static fallback for unauthenticated users');
      setQueue({ current: { tokenNumber: '--' }, waiting: [] });
    }
  };

  const { socketState } = useQueueSocket(id, fetchQueue);

  useEffect(() => {
    api.getMonument(id).then(res => {
      if (res.success) setMonument(res.data);
    }).finally(() => setLoading(false));
    
    fetchQueue();
    // Removed setInterval in favor of real-time Socket.io updates
  }, [id]);

  if (loading || !monument) return <div className="p-12 text-center text-xl font-medium animate-pulse">Loading Live Queue...</div>;

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 mt-10">
      {monument.imageUrl && (
        <div className="absolute inset-0 z-[-1] overflow-hidden opacity-10">
          <img src={monument.imageUrl} alt={monument.name} className="w-full h-full object-cover blur-sm" />
          <div className="absolute inset-0 bg-white dark:bg-maroon-900 opacity-80"></div>
        </div>
      )}
      <div className="flex justify-end">
        <SocketStatus state={socketState} onRefresh={fetchQueue} />
      </div>
      
      <h1 className="text-5xl font-black text-maroon-800 dark:text-maroon-50 drop-shadow-sm">{monument.name}</h1>
      <h2 className="text-3xl font-bold opacity-90 flex items-center justify-center gap-3 text-maroon-700 dark:text-maroon-200">
        <Users className="w-8 h-8" /> Live Queue Status
      </h2>

      <div className="bg-white dark:bg-maroon-900 rounded-3xl shadow-2xl p-12 border-4 border-maroon-200 dark:border-maroon-800 transform hover:scale-[1.02] transition-transform">
        <p className="text-xl font-bold text-maroon-600 dark:text-maroon-400 uppercase tracking-[0.2em] mb-6">Now Serving</p>
        <div className="text-[120px] leading-none font-black text-maroon-900 dark:text-maroon-50 mb-10 drop-shadow-lg">
          #{queue?.current?.tokenNumber || '--'}
        </div>
        
        <div className="bg-gradient-to-r from-maroon-50 to-maroon-100 dark:from-maroon-950 dark:to-maroon-900 p-6 rounded-2xl border border-maroon-200 dark:border-maroon-800 shadow-inner">
          <p className="text-sm font-black uppercase tracking-wider text-maroon-800 dark:text-maroon-200 mb-4">Next in line</p>
          <div className="flex justify-center gap-6 text-3xl font-bold">
            {queue?.waiting?.slice(0, 3).map((w, i) => (
              <span key={i} className="text-maroon-700 dark:text-maroon-300 bg-white dark:bg-maroon-900 px-4 py-2 rounded-lg shadow-sm border border-maroon-100 dark:border-maroon-700">#{w.tokenNumber}</span>
            ))}
            {!queue?.waiting?.length && <span className="opacity-50 text-xl font-medium">Empty</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
