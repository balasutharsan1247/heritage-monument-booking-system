import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { MapPin, Clock, Users, Ticket as TicketIcon } from 'lucide-react';

export default function MonumentDetails() {
  const { id } = useParams();
  const [monument, setMonument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMonument(id).then(res => {
      if (res.success) setMonument(res.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-12 text-center animate-pulse text-xl">Loading monument details...</div>;
  if (!monument) return <div className="p-12 text-center text-red-500 text-xl font-bold">Monument not found.</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-maroon-900 rounded-3xl shadow-xl overflow-hidden border border-maroon-100 dark:border-maroon-800">
      <div className="bg-maroon-800 text-white p-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-4 drop-shadow-md">{monument.name}</h1>
        <div className="flex justify-center items-center gap-2 text-maroon-200 font-medium text-lg">
          <MapPin className="w-5 h-5" /> {monument.location}
        </div>
      </div>
      
      <div className="p-8 md:p-12">
        <p className="text-xl text-maroon-800 dark:text-maroon-200 mb-10 leading-relaxed font-medium">
          {monument.description}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-maroon-50 dark:bg-maroon-950 p-6 rounded-2xl border border-maroon-100 dark:border-maroon-800 flex flex-col items-center text-center">
            <TicketIcon className="w-8 h-8 text-maroon-600 mb-3" />
            <span className="block text-sm font-bold uppercase text-maroon-500 mb-1">Base Price</span>
            <span className="text-2xl font-black text-maroon-800 dark:text-maroon-100">₹{monument.baseTicketPrice}</span>
          </div>
          <div className="bg-maroon-50 dark:bg-maroon-950 p-6 rounded-2xl border border-maroon-100 dark:border-maroon-800 flex flex-col items-center text-center">
            <Clock className="w-8 h-8 text-maroon-600 mb-3" />
            <span className="block text-sm font-bold uppercase text-maroon-500 mb-1">Timings</span>
            <span className="text-lg font-bold text-maroon-800 dark:text-maroon-100">{monument.openingTime} - {monument.closingTime}</span>
          </div>
          <div className="bg-maroon-50 dark:bg-maroon-950 p-6 rounded-2xl border border-maroon-100 dark:border-maroon-800 flex flex-col items-center text-center">
            <Users className="w-8 h-8 text-maroon-600 mb-3" />
            <span className="block text-sm font-bold uppercase text-maroon-500 mb-1">Slot Capacity</span>
            <span className="text-2xl font-black text-maroon-800 dark:text-maroon-100">{monument.capacity}</span>
          </div>
          <div className="bg-maroon-50 dark:bg-maroon-950 p-6 rounded-2xl border border-maroon-100 dark:border-maroon-800 flex flex-col items-center text-center">
            <span className={`w-8 h-8 rounded-full mb-3 ${monument.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="block text-sm font-bold uppercase text-maroon-500 mb-1">Status</span>
            <span className="text-lg font-bold text-maroon-800 dark:text-maroon-100">{monument.isActive ? 'Open Today' : 'Closed'}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={`/book/${monument._id}`} className="bg-maroon-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-maroon-600 transition-transform hover:-translate-y-1 shadow-lg text-center">
            Book Ticket Now
          </Link>
          <Link to={`/queue/${monument._id}`} className="bg-maroon-100 text-maroon-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-maroon-200 transition-transform hover:-translate-y-1 shadow text-center dark:bg-maroon-800 dark:text-maroon-100">
            View Live Queue
          </Link>
        </div>
      </div>
    </div>
  );
}