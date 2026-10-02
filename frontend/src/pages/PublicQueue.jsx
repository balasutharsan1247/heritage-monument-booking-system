import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Landmark, ArrowLeft, Users } from 'lucide-react';

export default function PublicQueue() {
  const { id } = useParams();
  const [monument, setMonument] = useState(null);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await api.getPublicQueue(id);
      if (res.success) {
        setQueue(res.data);
      } else {
        setQueue({ current: null, waiting: [] });
      }
    } catch (err) {
      setQueue({ current: null, waiting: [] });
    }
  }, [id]);

  const { socketState } = useQueueSocket(id, fetchQueue);

  useEffect(() => {
    api.getMonument(id)
      .then((res) => {
        if (res.success) setMonument(res.data);
      })
      .finally(() => setLoading(false));

    fetchQueue();
  }, [id, fetchQueue]);

  if (loading || !monument) {
    return (
      <div className="fixed inset-0 bg-charcoal-950 text-white flex flex-col items-center justify-center p-8 space-y-3">
        <div className="w-12 h-12 rounded-xl border-4 border-t-gold-400 border-charcoal-800 animate-spin" />
        <p className="text-base font-serif text-sandstone-300">
          Loading Queue Display...
        </p>
      </div>
    );
  }

  const currentToken = queue?.current?.tokenNumber;
  const waitingList = queue?.waiting || [];

  return (
    <div className="fixed inset-0 z-50 bg-charcoal-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-charcoal-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/monuments"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sandstone-300 transition-colors border border-white/10"
            title="Exit"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-maroon-900 border border-gold-500/40 flex items-center justify-center text-gold-400">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold font-serif uppercase tracking-wide text-white">
              {monument.name}
            </h1>
            <p className="text-xs text-sandstone-400">Live Virtual Queue</p>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-2 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-bold">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 uppercase tracking-wider text-[11px]">
            {socketState === 'connected' ? 'Live' : 'Connecting'}
          </span>
        </div>
      </div>

      {/* Center: NOW SERVING */}
      <div className="flex-1 flex flex-col items-center justify-center text-center my-6">
        <div className="text-base sm:text-xl font-bold uppercase tracking-[0.25em] text-gold-400 mb-2">
          Now Serving
        </div>

        <div className="text-[100px] sm:text-[150px] md:text-[200px] leading-none font-black font-serif text-white tracking-tight">
          {currentToken ? `#${currentToken}` : '--'}
        </div>
      </div>

      {/* Bottom: NEXT IN LINE */}
      <div className="bg-charcoal-900 rounded-2xl border border-charcoal-800 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold uppercase tracking-wider text-sandstone-300 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gold-400" /> Next Tokens
          </span>
          <span className="text-sandstone-400 font-medium">
            {waitingList.length} waiting
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {waitingList.slice(0, 6).map((w, index) => (
            <div
              key={w._id || index}
              className="flex-1 min-w-[110px] bg-white/5 border border-white/10 rounded-xl p-3 text-center"
            >
              <div className="text-[10px] text-sandstone-400 uppercase font-semibold">
                Pos {index + 1}
              </div>
              <div className="text-2xl sm:text-3xl font-black font-serif text-white mt-0.5">
                #{w.tokenNumber}
              </div>
            </div>
          ))}

          {waitingList.length === 0 && (
            <div className="w-full text-center py-2 text-sandstone-400 text-sm">
              Queue is empty
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
