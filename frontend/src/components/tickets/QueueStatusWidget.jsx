import React from 'react';
import { Users, Clock, Bell, CheckCircle2 } from 'lucide-react';

export const QueueStatusWidget = ({ queueStatus, tokenNumber }) => {
  if (!queueStatus) return null;

  const isCalled = queueStatus.status === 'called';
  const isCompleted = queueStatus.status === 'completed';

  return (
    <div className="space-y-3">
      {/* Turn Alert */}
      {isCalled && (
        <div className="bg-emerald-600 text-white rounded-2xl p-5 shadow-md flex items-center gap-3.5">
          <div className="p-2.5 bg-white/20 rounded-xl shrink-0">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              It's Your Turn! (Token #{tokenNumber || queueStatus.tokenNumber})
            </h3>
            <p className="text-emerald-100 text-xs mt-0.5">
              Please proceed to entrance counter now.
            </p>
          </div>
        </div>
      )}

      {/* Completed Alert */}
      {isCompleted && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0" />
          <p className="text-xs font-semibold">Visit completed.</p>
        </div>
      )}

      {/* Live Queue Metrics */}
      {queueStatus.status === 'waiting' && (
        <div className="bg-white rounded-2xl border border-sandstone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-sandstone-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-charcoal-700 uppercase tracking-wider text-[10px]">
                Live Queue Status
              </span>
            </div>
            <span className="text-[10px] text-charcoal-500">Real-time</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3 text-center">
            <div className="bg-sandstone-50 rounded-xl p-3 border border-sandstone-200">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-charcoal-500 mb-0.5">
                <Users className="w-3 h-3 text-maroon-700" />
                <span>People Ahead</span>
              </div>
              <div className="text-2xl font-black font-serif text-maroon-900">
                {queueStatus.entriesAhead ?? 0}
              </div>
            </div>

            <div className="bg-sandstone-50 rounded-xl p-3 border border-sandstone-200">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-charcoal-500 mb-0.5">
                <Clock className="w-3 h-3 text-maroon-700" />
                <span>Est. Wait</span>
              </div>
              <div className="text-2xl font-black font-serif text-charcoal-900">
                {queueStatus.estimatedWait ?? 0}
                <span className="text-xs font-normal text-charcoal-500 ml-1">min</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
