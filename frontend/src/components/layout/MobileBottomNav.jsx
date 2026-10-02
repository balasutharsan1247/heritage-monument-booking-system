import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Compass, Ticket, Home, Users, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

export const MobileBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Hide on public kiosk queue page (`/queue/:id`)
  if (location.pathname.startsWith('/queue/')) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-sandstone-200 shadow-heritage px-2 py-1.5 safe-area-bottom">
      <nav className="flex items-center justify-around">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold transition-colors',
              isActive && location.pathname === '/' ? 'text-maroon-800' : 'text-charcoal-500 hover:text-charcoal-800'
            )
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/monuments"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold transition-colors',
              isActive ? 'text-maroon-800' : 'text-charcoal-500 hover:text-charcoal-800'
            )
          }
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span>Explore</span>
        </NavLink>

        {user?.role === 'visitor' && (
          <NavLink
            to="/my-tickets"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold transition-colors',
                isActive ? 'text-maroon-800' : 'text-charcoal-500 hover:text-charcoal-800'
              )
            }
          >
            <Ticket className="w-5 h-5 mb-0.5" />
            <span>My Tickets</span>
          </NavLink>
        )}

        {user?.role === 'staff' && (
          <NavLink
            to="/staff/queue"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold transition-colors',
                isActive ? 'text-maroon-800' : 'text-charcoal-500 hover:text-charcoal-800'
              )
            }
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span>Counter</span>
          </NavLink>
        )}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold transition-colors',
                isActive ? 'text-maroon-800' : 'text-charcoal-500 hover:text-charcoal-800'
              )
            }
          >
            <Settings className="w-5 h-5 mb-0.5" />
            <span>Admin</span>
          </NavLink>
        )}
      </nav>
    </div>
  );
};
