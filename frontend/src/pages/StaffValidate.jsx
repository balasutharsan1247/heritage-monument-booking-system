import React, { useState } from 'react';
import { api } from '../api';
import { QrCode, ScanLine } from 'lucide-react';

export default function StaffValidate() {
  const [qrData, setQrData] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await api.validateTicket({ qrCodeData: qrData });
      setResult(res);
    } catch (err) {
      setResult({ success: false, message: 'Network error validating ticket' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 mt-10">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-4 bg-maroon-100 dark:bg-maroon-800 rounded-full mb-4">
          <ScanLine className="w-10 h-10 text-maroon-700 dark:text-maroon-200" />
        </div>
        <h1 className="text-4xl font-black text-maroon-800 dark:text-maroon-50">Ticket Scanner</h1>
        <p className="text-maroon-600 font-medium">Verify visitor tickets securely</p>
      </div>
      
      <div className="bg-white dark:bg-maroon-900 p-10 rounded-3xl shadow-2xl border border-maroon-100 dark:border-maroon-800">
        <form onSubmit={handleValidate} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-3 text-maroon-800 dark:text-maroon-200 uppercase tracking-wide">Enter QR Code Data</label>
            <div className="relative">
              <QrCode className="absolute left-4 top-1/2 transform -translate-y-1/2 text-maroon-400" />
              <input 
                type="text" 
                value={qrData} 
                onChange={e => setQrData(e.target.value)} 
                placeholder="Scan or type ticket code..."
                required 
                className="w-full pl-12 pr-4 py-4 border-2 rounded-xl font-mono text-lg dark:bg-maroon-950 dark:border-maroon-700 focus:ring-4 focus:ring-maroon-100 focus:border-maroon-500 outline-none transition-all"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-maroon-700 text-white py-4 rounded-xl hover:bg-maroon-600 font-black text-xl shadow-lg transition-transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none">
            {loading ? 'Verifying...' : 'Validate Entry'}
          </button>
        </form>

        {result && (
          <div className={`mt-8 p-6 rounded-2xl border-2 transition-all animate-in fade-in zoom-in-95 duration-200 ${result.success ? 'bg-green-50 text-green-900 border-green-200' : 'bg-red-50 text-red-900 border-red-200'}`}>
            <h3 className="font-black text-2xl mb-2 flex items-center gap-2">
              {result.success ? '✓ Valid Access' : '✗ Access Denied'}
            </h3>
            <p className="text-lg font-medium">{result.message}</p>
            {result.success && result.data && (
              <div className="mt-6 pt-6 border-t border-current/20 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase font-bold opacity-70 mb-1">Queue Token</div>
                  <div className="text-3xl font-black">#{result.data.tokenNumber}</div>
                </div>
                <div>
                  <div className="text-xs uppercase font-bold opacity-70 mb-1">Time Slot</div>
                  <div className="text-xl font-bold">{result.data.slotStart} - {result.data.slotEnd}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}