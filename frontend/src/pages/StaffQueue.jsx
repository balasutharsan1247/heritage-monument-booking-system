import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Users, CheckCircle, SkipForward, Play } from 'lucide-react';
import { useQueueSocket } from '../hooks/useQueueSocket';
import SocketStatus from '../components/SocketStatus';

export default function StaffQueue() {
  const [monuments, setMonuments] = useState([]);
  const [selectedMonument, setSelectedMonument] = useState('');
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(false);

  const { socketState } = useQueueSocket(selectedMonument, () => {
    if (selectedMonument) loadQueue();
  });

  useEffect(() => {
    api.getMonuments().then(res => {
      if (res.success) setMonuments(res.data);
    });
  }, []);

  useEffect(() => {
    if (selectedMonument) {
      loadQueue();
    }
  }, [selectedMonument]);

  const loadQueue = () => {
    setLoading(true);
    api.getStaffQueue(selectedMonument).then(res => {
      if (res.success) setQueue(res.data);
    }).finally(() => setLoading(false));
  };

  const handleAction = async (action, entryId = null) => {
    let res;
    if (action === 'call') res = await api.callNext(selectedMonument);
    else if (action === 'skip') res = await api.skipVisitor(selectedMonument, entryId);
    else if (action === 'complete') res = await api.completeVisit(selectedMonument, entryId);
    
    if (res?.success) loadQueue();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b-2 border-maroon-100 dark:border-maroon-800">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-maroon-700" />
          <h1 className="text-4xl font-black text-maroon-800 dark:text-maroon-50">Queue Management</h1>
        </div>
        {selectedMonument && <SocketStatus state={socketState} onRefresh={loadQueue} />}
      </div>
      
      <div className="bg-white dark:bg-maroon-900 p-8 rounded-2xl shadow-lg border border-maroon-100 dark:border-maroon-800">
        <label className="block text-sm font-bold mb-3 text-maroon-800 dark:text-maroon-200 uppercase tracking-wider">Select Assigned Monument</label>
        <select value={selectedMonument} onChange={e => setSelectedMonument(e.target.value)} className="w-full md:w-1/2 p-4 border-2 rounded-xl dark:bg-maroon-950 dark:border-maroon-700 focus:ring-4 focus:ring-maroon-100 focus:border-maroon-500 outline-none font-medium text-lg cursor-pointer">
          <option value="">-- Choose Monument --</option>
          {monuments.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
        </select>
      </div>

      {loading ? <div className="text-center p-12 text-xl font-medium animate-pulse">Syncing queue data...</div> : queue && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-maroon-900 p-8 rounded-2xl shadow-lg border border-maroon-100 dark:border-maroon-800 flex flex-col">
            <h3 className="text-2xl font-black mb-6 text-maroon-900 dark:text-maroon-50 border-b pb-2">Currently Serving</h3>
            {queue.current ? (
              <div className="bg-gradient-to-br from-maroon-50 to-maroon-100 dark:from-maroon-950 dark:to-maroon-900 p-10 rounded-2xl text-center flex-1 flex flex-col justify-center border border-maroon-200 dark:border-maroon-800 shadow-inner">
                <div className="text-sm font-bold uppercase tracking-widest text-maroon-600 dark:text-maroon-400 mb-2">Token Number</div>
                <div className="text-8xl font-black text-maroon-800 dark:text-maroon-100 mb-10 drop-shadow-sm">#{queue.current.tokenNumber}</div>
                <div className="flex justify-center gap-4">
                  <button onClick={() => handleAction('complete', queue.current._id)} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg transition-transform hover:-translate-y-1 text-lg w-full justify-center">
                    <CheckCircle className="w-6 h-6" /> Complete
                  </button>
                  <button onClick={() => handleAction('skip', queue.current._id)} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-4 rounded-xl font-bold shadow-lg transition-transform hover:-translate-y-1 text-lg w-full justify-center">
                    <SkipForward className="w-6 h-6" /> Skip
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-maroon-950 rounded-2xl border-2 border-dashed border-gray-200 dark:border-maroon-800 p-10">
                <p className="text-xl text-gray-500 dark:text-maroon-400 font-medium">Counter is idle. Call next visitor.</p>
              </div>
            )}
            
            <button onClick={() => handleAction('call')} className="w-full mt-6 flex items-center justify-center gap-2 bg-maroon-700 text-white py-5 rounded-xl font-black text-xl hover:bg-maroon-600 shadow-xl transition-transform hover:-translate-y-1">
              <Play className="w-6 h-6 fill-current" /> Call Next Visitor
            </button>
          </div>

          <div className="bg-white dark:bg-maroon-900 p-8 rounded-2xl shadow-lg border border-maroon-100 dark:border-maroon-800 flex flex-col">
            <h3 className="text-2xl font-black mb-6 text-maroon-900 dark:text-maroon-50 border-b pb-2 flex justify-between items-center">
              Waiting List 
              <span className="bg-maroon-100 text-maroon-800 dark:bg-maroon-800 dark:text-maroon-100 px-3 py-1 rounded-full text-base">{queue.waiting?.length || 0} waiting</span>
            </h3>
            <div className="flex-1 space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {!queue.waiting?.length ? (
                <div className="p-12 text-center text-gray-500 font-medium border-2 border-dashed rounded-xl">Queue is currently empty</div>
              ) : queue.waiting.map((w, i) => (
                <div key={w._id} className="flex justify-between items-center p-5 bg-white dark:bg-maroon-950 rounded-xl border border-maroon-100 dark:border-maroon-800 shadow-sm hover:border-maroon-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-maroon-300 dark:text-maroon-600">{i + 1}</span>
                    <span className="font-black text-2xl text-maroon-900 dark:text-maroon-100">#{w.tokenNumber}</span>
                  </div>
                  <span className="text-sm font-medium bg-maroon-50 dark:bg-maroon-900 px-3 py-1 rounded-lg text-maroon-700">{new Date(w.joinedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}