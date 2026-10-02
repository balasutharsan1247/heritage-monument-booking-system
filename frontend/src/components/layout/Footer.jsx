import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Footer = () => {
  const { user } = useAuth();

  return (
    <footer className="bg-charcoal-950 text-sandstone-300 border-t border-charcoal-800 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-charcoal-800 text-sm">
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-maroon-900 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <Landmark className="w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-white text-base">
              Heritage Monument Booking System
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-sandstone-400">
            <Link to="/monuments" className="hover:text-white transition-colors">Monuments</Link>
            {user?.role === 'visitor' && (
              <>
                <Link to="/my-tickets" className="hover:text-white transition-colors">My Tickets</Link>
                <Link to="/wallet" className="hover:text-white transition-colors">Wallet</Link>
              </>
            )}
            {user?.role === 'staff' && (
              <>
                <Link to="/staff/queue" className="hover:text-white transition-colors">Staff Queue</Link>
                <Link to="/staff/validate" className="hover:text-white transition-colors">Validate</Link>
              </>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="hover:text-white transition-colors">Admin Dashboard</Link>
            )}
            {!user && (
              <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            )}
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-sandstone-400 gap-2">
          <p>&copy; {new Date().getFullYear()} Heritage Monument Booking System. All rights reserved.</p>
          <p className="text-[11px] text-sandstone-400">E-Ticketing &amp; Virtual Queue Management</p>
        </div>
      </div>
    </footer>
  );
};
