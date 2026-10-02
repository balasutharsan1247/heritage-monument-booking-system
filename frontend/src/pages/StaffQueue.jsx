import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { 
  Users, 
  CheckCircle2, 
  SkipForward, 
  Play, 
  Clock 
} from 'lucide-react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import SocketStatus from '../components/SocketStatus';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';

export default function StaffQueue() {
  const [monuments, setMonuments] = useState([]);
  const [selectedMonument, setSelectedMonument] = useState('');
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmSkipId, setConfirmSkipId] = useState(null);

  const toast = useToast();

  const loadQueue = useCallback(() => {
    if (!selectedMonument) return;
    setLoading(true);
    api.getStaffQueue(selectedMonument)
      .then((res) => {
        if (res.success) {
          const raw = res.data;
          if (Array.isArray(raw)) {
            const current = raw.find((item) => item.status === 'called');
            const waiting = raw.filter((item) => item.status === 'waiting');
            setQueue({ current: current || null, waiting: waiting || [], all: raw });
          } else {
            setQueue(raw);
          }
        }
      })
      .catch((err) => console.error('Failed to load staff queue:', err))
      .finally(() => setLoading(false));
  }, [selectedMonument]);

  const { socketState } = useQueueSocket(selectedMonument, () => {
    if (selectedMonument) loadQueue();
  });

  useEffect(() => {
    api.getMonuments().then((res) => {
      if (res.success) {
        const list = res.data.monuments || res.data || [];
        setMonuments(list);
        if (list.length > 0 && !selectedMonument) {
          setSelectedMonument(list[0]._id);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (selectedMonument) {
      loadQueue();
    }
  }, [selectedMonument, loadQueue]);

  const handleAction = async (action, entryId = null) => {
    setActionLoading(true);
    try {
      let res;
      if (action === 'call') {
        res = await api.callNext(selectedMonument);
        if (res?.success) toast.success(`Token #${res.data?.tokenNumber || 'Next'} called.`);
        else toast.error(res?.message || 'Could not call next visitor.');
      } else if (action === 'skip') {
        res = await api.skipVisitor(selectedMonument, entryId);
        if (res?.success) toast.info('Visitor skipped.');
        else toast.error(res?.message || 'Could not skip visitor.');
      } else if (action === 'complete') {
        res = await api.completeVisit(selectedMonument, entryId);
        if (res?.success) toast.success('Visit completed.');
        else toast.error(res?.message || 'Could not complete visit.');
      }

      if (res?.success) {
        loadQueue();
      }
    } catch (err) {
      toast.error('Network error executing action.');
    } finally {
      setActionLoading(false);
      setConfirmSkipId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-sandstone-200 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-charcoal-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-maroon-800" />
            <span>Staff Queue Operations</span>
          </h1>
        </div>

        {selectedMonument && (
          <SocketStatus state={socketState} onRefresh={loadQueue} />
        )}
      </div>

      {/* Monument Selector */}
      <div className="bg-white p-4 rounded-2xl border border-sandstone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-sm">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-600 mb-1">
            Monument
          </label>
          <select
            value={selectedMonument}
            onChange={(e) => setSelectedMonument(e.target.value)}
            className="w-full p-2.5 border border-sandstone-300 rounded-xl bg-white text-charcoal-900 font-semibold text-sm focus:outline-none focus:border-maroon-700 cursor-pointer"
          >
            <option value="">Select Monument...</option>
            {monuments.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {queue && (
          <div className="text-xs text-charcoal-600 font-semibold bg-sandstone-50 px-3 py-2 rounded-xl border border-sandstone-200 self-start sm:self-auto">
            {queue.waiting?.length || 0} Waiting in Queue
          </div>
        )}
      </div>

      {/* Workspace */}
      {loading && !queue ? (
        <div className="p-12 text-center text-charcoal-500 font-medium">
          Loading queue...
        </div>
      ) : queue ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Current Serving */}
          <div className="bg-white rounded-2xl border border-sandstone-200 shadow-xs p-6 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-700 border-b border-sandstone-100 pb-2">
              Currently Serving
            </h3>

            {queue.current ? (
              <div className="bg-sandstone-50 rounded-2xl p-6 border border-sandstone-200 text-center space-y-5">
                <div>
                  <span className="text-xs uppercase font-bold text-charcoal-500 tracking-wider">
                    Token
                  </span>
                  <div className="text-5xl sm:text-6xl font-black font-serif text-maroon-900 my-1">
                    #{queue.current.tokenNumber}
                  </div>
                  {queue.current.numberOfPeople > 1 && (
                    <div className="inline-block mt-1 px-3 py-1 bg-maroon-100 text-maroon-900 rounded-full font-bold text-xs">
                      Bulk Party: {queue.current.numberOfPeople} Visitors
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="success"
                    size="md"
                    icon={CheckCircle2}
                    fullWidth
                    disabled={actionLoading}
                    onClick={() => handleAction('complete', queue.current._id)}
                  >
                    Complete
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    icon={SkipForward}
                    fullWidth
                    disabled={actionLoading}
                    onClick={() => setConfirmSkipId(queue.current._id)}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-sandstone-50 rounded-2xl p-8 border border-sandstone-200 text-center text-charcoal-500 text-sm">
                Counter is currently idle.
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              icon={Play}
              fullWidth
              disabled={actionLoading || queue.waiting?.length === 0}
              loading={actionLoading}
              onClick={() => handleAction('call')}
              className="py-3 text-base font-bold"
            >
              Call Next ({queue.waiting?.length || 0} waiting)
            </Button>
          </div>

          {/* Waiting List */}
          <div className="bg-white rounded-2xl border border-sandstone-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-sandstone-100 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-700">
                Waiting List
              </h3>
              <span className="text-xs text-charcoal-500 font-semibold">
                {queue.waiting?.length || 0} visitors
              </span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {!queue.waiting || queue.waiting.length === 0 ? (
                <div className="p-8 text-center text-charcoal-400 text-xs">
                  Queue is empty.
                </div>
              ) : (
                queue.waiting.map((entry, index) => (
                  <div
                    key={entry._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-sandstone-50 border border-sandstone-200 text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-sandstone-200 text-charcoal-700 flex items-center justify-center font-bold text-xs">
                        {index + 1}
                      </span>
                      <span className="font-bold font-serif text-charcoal-900 text-base">
                        #{entry.tokenNumber}
                      </span>
                      {entry.numberOfPeople > 1 && (
                        <span className="text-[10px] font-bold bg-maroon-100 text-maroon-900 px-2 py-0.5 rounded-full">
                          Party of {entry.numberOfPeople}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-charcoal-500 font-mono">
                      {entry.joinedAt ? new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(confirmSkipId)}
        onClose={() => setConfirmSkipId(null)}
        onConfirm={() => handleAction('skip', confirmSkipId)}
        title="Skip Visitor?"
        message="Skip this visitor and proceed to the next token in queue?"
        confirmText="Skip"
        cancelText="Cancel"
        variant="warning"
        loading={actionLoading}
      />

    </div>
  );
}