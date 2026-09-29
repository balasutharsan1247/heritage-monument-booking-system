import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { MapPin, Users } from 'lucide-react';

export default function Monuments() {
  const [monuments, setMonuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMonuments().then(res => {
      if (res.success) {
        setMonuments(res.data.monuments || res.data || []);
      }
    }).catch(err => {
      console.error("Failed to load monuments:", err);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-maroon-800 text-xl font-medium animate-pulse">Loading amazing monuments...</div>;
  if (!monuments.length) return <div className="p-12 text-center text-lg">No monuments found. Please check back later.</div>;

  return (
    <div className="space-y-8">
      <div className="text-center md:text-left md:flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-maroon-800 dark:text-maroon-100">Explore Monuments</h1>
          <p className="text-maroon-600 dark:text-maroon-300 mt-2 text-lg">Find your next heritage destination</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {monuments.map(m => (
          <div key={m._id} className="bg-white dark:bg-maroon-900 rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-maroon-100 dark:border-maroon-800 flex flex-col group">
            {m.imageUrl && (
              <div className="h-48 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-2xl">
                <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
            <h2 className="text-2xl font-bold text-maroon-800 dark:text-maroon-100 mb-2 group-hover:text-maroon-600 transition-colors">{m.name}</h2>
            <div className="flex items-center gap-1 text-sm font-semibold text-maroon-500 mb-3">
              <MapPin className="w-4 h-4" /> {m.location}
            </div>
            <p className="text-maroon-700 dark:text-maroon-300 mb-6 flex-1 line-clamp-3 leading-relaxed">{m.description}</p>
            
            <div className="pt-4 border-t border-maroon-100 dark:border-maroon-800 flex justify-between items-center text-sm font-medium">
              <div className="flex items-center gap-1 bg-maroon-50 dark:bg-maroon-950 px-3 py-1.5 rounded-lg text-maroon-800 dark:text-maroon-200">
                <Users className="w-4 h-4" />
                Capacity: {m.capacity}
              </div>
              <div className="text-lg font-bold text-maroon-700 dark:text-maroon-200">₹{m.baseTicketPrice}</div>
            </div>
            
            <Link to={`/monuments/${m._id}`} className="mt-6 text-center bg-maroon-100 dark:bg-maroon-800 text-maroon-800 dark:text-maroon-100 hover:bg-maroon-200 dark:hover:bg-maroon-700 font-bold py-3 rounded-xl transition-colors">
              View Details & Book
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}