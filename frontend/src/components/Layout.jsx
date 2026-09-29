import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, LogOut, Ticket, Settings, Activity, Users } from 'lucide-react';

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-maroon-800 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:text-maroon-100">
            <Building2 className="w-6 h-6" />
            Heritage Bookings
          </Link>
          <nav className="hidden md:flex items-center gap-6 font-medium">
            <Link to="/monuments" className="hover:text-maroon-200 transition-colors">Monuments</Link>
            <Link to="/monuments" className="bg-white text-maroon-800 px-4 py-2 rounded-lg font-bold hover:bg-maroon-100 transition-colors shadow">Book Ticket</Link>
            {user?.role === 'visitor' && (
              <Link to="/my-tickets" className="hover:text-maroon-200 transition-colors flex items-center gap-1"><Ticket className="w-4 h-4"/> My Tickets</Link>
            )}
            {user?.role === 'staff' && (
              <>
                <Link to="/staff/queue" className="hover:text-maroon-200 transition-colors flex items-center gap-1"><Users className="w-4 h-4"/> Queue</Link>
                <Link to="/staff/validate" className="hover:text-maroon-200 transition-colors flex items-center gap-1"><Activity className="w-4 h-4"/> Validate</Link>
              </>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="hover:text-maroon-200 transition-colors flex items-center gap-1"><Settings className="w-4 h-4"/> Dashboard</Link>
            )}
            {!user ? (
              <div className="flex gap-4">
                <Link to="/login" className="hover:text-maroon-200 transition-colors py-2">Login</Link>
                <Link to="/register" className="bg-maroon-600 px-4 py-2 rounded hover:bg-maroon-500 shadow transition-colors">Register</Link>
              </div>
            ) : (
              <div className="flex items-center gap-4 border-l border-maroon-600 pl-4 ml-2">
                <div className="text-right hidden lg:block">
                  <div className="text-sm font-bold text-white">{user.name}</div>
                  <div className="text-xs text-maroon-200">{user.email}</div>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-1 bg-maroon-700 hover:bg-maroon-600 px-3 py-2 rounded-lg transition-colors text-sm font-semibold">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>
      <footer className="bg-maroon-900 text-maroon-200 py-6 text-center shadow-inner">
        <p>&copy; 2026 Heritage Monument Booking System</p>
      </footer>
    </div>
  );
};