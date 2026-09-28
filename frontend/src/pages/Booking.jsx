import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [monument, setMonument] = useState(null);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMonument(id).then(res => {
      if (res.success) setMonument(res.data);
    });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const [slotStart, slotEnd] = slot.split('-');
      const res = await api.bookTicket({
        monumentId: id,
        visitDate: date,
        slotStart,
        slotEnd
      });
      if (res.success) {
        navigate(`/tickets/${res.data._id}`);
      } else {
        setError(res.message || 'Booking failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!monument) return <div className="p-12 text-center animate-pulse">Loading booking details...</div>;

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-maroon-900 rounded-3xl shadow-xl p-10 border border-maroon-100 dark:border-maroon-800">
      <h2 className="text-3xl font-extrabold mb-2 text-maroon-900 dark:text-maroon-50 text-center">Secure Your Entry</h2>
      <p className="text-center text-maroon-600 dark:text-maroon-300 mb-8 font-medium">Booking for <span className="font-bold">{monument.name}</span></p>
      
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 font-semibold border border-red-200 text-center">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold mb-2 text-maroon-800 dark:text-maroon-200">Visit Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} className="w-full p-4 border rounded-xl dark:bg-maroon-950 dark:border-maroon-700 focus:ring-2 focus:ring-maroon-500 outline-none text-lg" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-maroon-800 dark:text-maroon-200">Time Slot</label>
          <select value={slot} onChange={e => setSlot(e.target.value)} required className="w-full p-4 border rounded-xl dark:bg-maroon-950 dark:border-maroon-700 focus:ring-2 focus:ring-maroon-500 outline-none text-lg bg-white dark:bg-maroon-950">
            <option value="">Select a preferred time</option>
            <option value="09:00-11:00">09:00 AM - 11:00 AM</option>
            <option value="11:00-13:00">11:00 AM - 01:00 PM</option>
            <option value="13:00-15:00">01:00 PM - 03:00 PM</option>
            <option value="15:00-17:00">03:00 PM - 05:00 PM</option>
          </select>
        </div>
        <div className="bg-maroon-50 dark:bg-maroon-950 p-6 rounded-xl mt-6 flex justify-between items-center border border-maroon-100 dark:border-maroon-800">
          <p className="font-bold text-maroon-700 dark:text-maroon-300 uppercase text-sm">Total Payable</p>
          <p className="font-black text-3xl text-maroon-900 dark:text-maroon-50">₹{monument.baseTicketPrice}</p>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-maroon-700 text-white p-4 rounded-xl hover:bg-maroon-600 font-bold shadow-lg transition-transform hover:-translate-y-1 text-lg mt-4 disabled:opacity-50 disabled:transform-none">
          {loading ? 'Processing Booking...' : 'Confirm & Generate Ticket'}
        </button>
      </form>
    </div>
  );
}