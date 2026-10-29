import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { Landmark, ArrowLeft, Users, Maximize2, Minimize2, Sparkles, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export default function PublicQueue() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [monument, setMonument] = useState(null);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flash, setFlash] = useState(false);
  const prevTokenRef = useRef(null);

  // Digital clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQueue = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.getPublicQueue(id);
      if (res && res.success) {
        setQueue(res.data);
      } else {
        setQueue((prev) => prev || { current: null, waiting: [] });
      }
    } catch {
      setQueue((prev) => prev || { current: null, waiting: [] });
    }
  }, [id]);

  const { socketState } = useQueueSocket(id, fetchQueue);

  // Polling heartbeat: keeps the display updated even if WebSocket is disconnected or proxy limits WS
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(() => {
      fetchQueue();
    }, 5000);
    return () => clearInterval(interval);
  }, [id, fetchQueue]);

  const loadMonument = useCallback(async (isSilent = false) => {
    if (!id) {
      setError('No Monument ID was specified.');
      setLoading(false);
      return;
    }
    if (!isSilent) setLoading(true);
    try {
      const res = await api.getMonument(id);
      if (res && res.success && res.data) {
        setMonument(res.data);
        setError(null);
      } else {
        setError(res?.message || 'Monument not found or temporarily inactive.');
      }
    } catch (err) {
      console.error('Error fetching monument:', err);
      setError(err?.message || 'Could not connect to backend server. Backend might be starting up.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMonument();
    fetchQueue();
  }, [id, loadMonument, fetchQueue]);

  // Auto-retry when initial load fails (e.g., during backend cold starts on Render/Railway)
  useEffect(() => {
    if (error && !monument && retryCount < 4) {
      const timer = setTimeout(() => {
        setRetryCount((c) => c + 1);
        loadMonument(true);
        fetchQueue();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, monument, retryCount, loadMonument, fetchQueue]);

  const currentToken = queue?.current?.tokenNumber;
  const waitingList = queue?.waiting || [];

  // Flash highlight when a new token is called
  useEffect(() => {
    if (currentToken && prevTokenRef.current && prevTokenRef.current !== currentToken) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 2000);
      return () => clearTimeout(timer);
    }
    prevTokenRef.current = currentToken;
  }, [currentToken]);

  const handleExit = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/admin/dashboard');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  if (loading && !monument) {
    return (
      <div
        className="fixed inset-0 z-50 kiosk-display-root bg-[#0d0d12] bg-charcoal-950 text-white flex flex-col items-center justify-center p-8 space-y-4"
        style={{ backgroundColor: '#0d0d12', color: '#ffffff' }}
      >
        <div className="w-14 h-14 rounded-2xl border-4 border-t-gold-400 border-charcoal-800 animate-spin" />
        <p className="text-lg font-sans font-semibold text-sandstone-300 tracking-wide">
          Loading Virtual Queue Display...
        </p>
        <p className="text-xs text-sandstone-500 font-mono">
          Connecting to live system {retryCount > 0 ? `(Attempt ${retryCount + 1}/5)` : ''}
        </p>
      </div>
    );
  }

  if (error && !monument) {
    return (
      <div
        className="fixed inset-0 z-50 kiosk-display-root bg-[#0d0d12] bg-charcoal-950 text-white flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-6"
        style={{ backgroundColor: '#0d0d12', color: '#ffffff' }}
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-sans text-white">Queue Display Unavailable</h2>
          <p className="text-sm text-sandstone-400">{error}</p>
          <p className="text-xs text-sandstone-500 font-mono">
            Monument ID: <span className="text-gold-400">{id}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              setRetryCount(0);
              loadMonument();
              fetchQueue();
            }}
            className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-charcoal-950 font-bold text-sm transition-all shadow-lg shadow-gold-500/20 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>
          <button
            onClick={handleExit}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sandstone-200 text-sm font-medium transition-all border border-white/10 cursor-pointer"
          >
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 kiosk-display-root bg-[#0d0d12] bg-charcoal-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden"
      style={{ backgroundColor: '#0d0d12', color: '#ffffff' }}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-maroon-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-charcoal-800/80 pb-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={handleExit}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sandstone-300 hover:text-white transition-colors border border-white/10"
            title="Exit Kiosk"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-xl bg-maroon-900/90 border border-gold-500/40 flex items-center justify-center text-gold-400 shadow-md">
            <Landmark className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-sans uppercase tracking-wider text-white">
              {monument.name}
            </h1>
            <p className="text-xs text-sandstone-400 flex items-center gap-2">
              <span>{monument.location || 'National Monument'}</span>
              <span className="text-charcoal-600">•</span>
              <span className="text-gold-400 font-medium">Virtual Queue Kiosk</span>
            </p>
          </div>
        </div>

        {/* Right Info: Clock, Live indicator, Fullscreen */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Live Clock */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sandstone-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-gold-400" />
            <span>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Live Indicator */}
          <div className="flex items-center gap-2 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-bold">
            <span className="relative flex h-2.5 w-2.5">
              {socketState === 'connected' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  socketState === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span
              className={`uppercase tracking-wider text-[11px] ${
                socketState === 'connected' ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {socketState === 'connected' ? 'Live' : 'Syncing'}
            </span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sandstone-300 hover:text-white transition-colors border border-white/10"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center: NOW SERVING */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center my-6 px-4">
        {/* Now Serving Badge */}
        <div
          className={`inline-flex items-center gap-2 px-6 py-2 rounded-full border text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-6 transition-all duration-500 ${
            flash
              ? 'bg-gold-500/30 border-gold-400 text-white shadow-[0_0_30px_rgba(204,165,74,0.5)] scale-105'
              : 'bg-gold-500/10 border-gold-400/40 text-gold-400 shadow-sm'
          }`}
        >
          <Sparkles className="w-4 h-4 text-gold-400 animate-pulse" />
          <span>Now Serving</span>
        </div>

        {/* Large Token Display */}
        <div className="w-full max-w-5xl">
          {currentToken ? (
            <div
              className={`text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-mono tracking-wider text-white transition-all duration-300 drop-shadow-[0_4px_30px_rgba(204,165,74,0.35)] ${
                flash ? 'scale-105 text-gold-200' : ''
              }`}
              style={{ wordBreak: 'break-word' }}
            >
              #{currentToken}
            </div>
          ) : (
            <div className="py-8">
              <div className="text-3xl sm:text-5xl font-sans font-bold text-sandstone-400/70">
                Ready for Next Visitor
              </div>
              <p className="mt-2 text-sm text-sandstone-500 font-sans">
                Counter will call the next token shortly
              </p>
            </div>
          )}
        </div>

        {/* Instructional Subtext */}
        {currentToken && (
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs sm:text-sm text-sandstone-300 font-sans tracking-wide">
            <span>Please proceed to the <strong>Turnstile / Entry Gate</strong></span>
          </div>
        )}
      </div>

      {/* Bottom: NEXT TOKENS */}
      <div
        className="relative z-10 kiosk-display-card bg-[#16161c] bg-charcoal-900 rounded-2xl border border-[#262633] border-charcoal-800 p-5 sm:p-6 shadow-xl"
        style={{ backgroundColor: '#16161c', borderColor: '#262633' }}
      >
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold uppercase tracking-wider text-sandstone-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-gold-400" /> Next in Line
          </span>
          <span className="text-sandstone-400 font-medium">
            {waitingList.length} {waitingList.length === 1 ? 'visitor waiting' : 'visitors waiting'}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {waitingList.slice(0, 6).map((w, index) => (
            <div
              key={w._id || index}
              className="flex-1 min-w-[170px] max-w-[240px] bg-white/5 border border-white/10 rounded-xl p-3 text-center transition-all hover:bg-white/10"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.08)' }}
            >
              <div className="text-[10px] text-gold-400 uppercase font-bold tracking-wider">
                Position {index + 1}
              </div>
              <div
                className="text-sm sm:text-base md:text-lg font-mono font-bold text-white mt-1 truncate"
                title={`#${w.tokenNumber}`}
              >
                #{w.tokenNumber}
              </div>
            </div>
          ))}

          {waitingList.length === 0 && (
            <div className="w-full text-center py-4 text-sandstone-400 text-sm">
              Queue is empty • Next arriving visitors will be served immediately
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
