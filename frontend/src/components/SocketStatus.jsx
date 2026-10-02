import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn';

export default function SocketStatus({ state, onRefresh, className = '' }) {
  const isConnected = state === 'connected';
  const isReconnecting = state === 'reconnecting';

  return (
    <div className={cn('flex items-center gap-2 text-xs font-semibold select-none', className)}>
      <div
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-2xs transition-colors duration-200',
          isConnected && 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          isReconnecting && 'bg-amber-50 text-amber-800 border-amber-200/80',
          !isConnected && !isReconnecting && 'bg-sandstone-100 text-charcoal-700 border-sandstone-300'
        )}
        title={isConnected ? 'Connected to live virtual queue stream' : 'Real-time connection inactive'}
      >
        {isConnected ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span className="uppercase tracking-wider text-[10px] font-bold">Live Synced</span>
          </>
        ) : isReconnecting ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span className="uppercase tracking-wider text-[10px] font-bold">Reconnecting...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-charcoal-400" />
            <span className="uppercase tracking-wider text-[10px] font-bold">Offline Sync</span>
          </>
        )}
      </div>

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="p-1.5 rounded-full bg-white hover:bg-sandstone-100 text-charcoal-600 hover:text-charcoal-900 border border-sandstone-300 shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-700 active:scale-95"
          title="Force refresh queue data"
          aria-label="Force refresh queue data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
