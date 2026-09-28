import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function SocketStatus({ state, onRefresh }) {
  const isConnected = state === 'connected';
  const isReconnecting = state === 'reconnecting';

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium border ${
        isConnected ? 'bg-green-50 text-green-700 border-green-200' :
        isReconnecting ? 'bg-amber-50 text-amber-700 border-amber-200' :
        'bg-red-50 text-red-700 border-red-200'
      }`}>
        {isConnected ? <Wifi className="w-4 h-4" /> : 
         isReconnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 
         <WifiOff className="w-4 h-4" />}
        {isConnected ? 'Live' : 
         isReconnecting ? 'Reconnecting...' : 
         'Disconnected'}
      </div>
      
      {onRefresh && (
        <button 
          onClick={onRefresh}
          className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm transition-colors"
          title="Manual Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
