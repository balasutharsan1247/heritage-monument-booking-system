import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from './Logo';
import { ShieldCheck, Clock, QrCode, Compass, Landmark } from 'lucide-react';

export const Footer = () => {
  const { user } = useAuth();

  return (
    <footer className="bg-charcoal-950 text-sandstone-300 border-t border-charcoal-800/80 pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-charcoal-800/70">
          
          {/* Brand Info with high-contrast visible Logo */}
          <div className="md:col-span-2 space-y-3.5">
            <Link to="/" className="inline-block focus-visible:outline-none">
              <Logo variant="navbar" size="md" />
            </Link>
            <p className="text-xs text-sandstone-400 leading-relaxed max-w-sm pt-1">
              Official digital admission and telemetry platform for national heritage sites, architectural monuments, and cultural destinations. Secure time-slotted admissions with live counter queues.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-charcoal-900 border border-charcoal-800 text-[11px] text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Gate Telemetry Online</span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sandstone-100">
              Explore &amp; Book
            </h4>
            <ul className="space-y-2 text-xs text-sandstone-400">
              <li>
                <Link to="/" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span>Home Overview</span>
                </Link>
              </li>
              <li>
                <Link to="/monuments" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span>Monuments Directory</span>
                </Link>
              </li>
              {user?.role === 'visitor' && (
                <>
                  <li>
                    <Link to="/my-tickets" className="hover:text-amber-300 transition-colors">
                      My Entry Passes
                    </Link>
                  </li>
                  <li>
                    <Link to="/wallet" className="hover:text-amber-300 transition-colors">
                      Virtual Wallet
                    </Link>
                  </li>
                </>
              )}
              {!user && (
                <>
                  <li>
                    <Link to="/login" className="hover:text-amber-300 transition-colors">
                      Visitor Sign In
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="hover:text-amber-300 transition-colors">
                      Create Visitor Account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Portals & Operations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sandstone-100">
              Operations &amp; Security
            </h4>
            <ul className="space-y-2 text-xs text-sandstone-400">
              {user?.role === 'staff' && (
                <>
                  <li>
                    <Link to="/staff/queue" className="hover:text-amber-300 transition-colors">
                      Live Queue Desk
                    </Link>
                  </li>
                  <li>
                    <Link to="/staff/validate" className="hover:text-amber-300 transition-colors">
                      Gate Ticket Validator
                    </Link>
                  </li>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <li>
                    <Link to="/admin/dashboard" className="hover:text-amber-300 transition-colors">
                      Admin Central Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/wallet" className="hover:text-amber-300 transition-colors">
                      Treasury Reserve
                    </Link>
                  </li>
                </>
              )}
              {(!user || user.role === 'visitor') && (
                <>
                  <li className="flex items-center gap-1.5 text-sandstone-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Live Virtual Queueing</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-sandstone-400">
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>Instant Turnstile QR Codes</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-sandstone-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Guaranteed Slot Admissions</span>
                  </li>
                </>
              )}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-sandstone-500 gap-3">
          <p>&copy; {new Date().getFullYear()} National Heritage Monument Booking System. Preserving cultural heritage with digital access.</p>
          <div className="flex items-center gap-4 text-[11px] text-sandstone-400">
            <span>Verified Secure Passes</span>
            <span>•</span>
            <span>Live Counter Telemetry</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
