import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Landmark, 
  Ticket, 
  Users, 
  ScanLine, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Compass,
  Wallet
} from 'lucide-react';
import { Button } from '../ui/Button';

export const PublicNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-maroon-900 text-white shadow-sm border-b border-maroon-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2.5 group focus-visible:outline-none rounded-xl"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-9 h-9 rounded-lg bg-maroon-800 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-lg text-white tracking-wide">
              Heritage Monuments
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 font-medium text-sm">
            <Link
              to="/monuments"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                isActive('/monuments')
                  ? 'bg-maroon-800 text-white font-semibold'
                  : 'text-sandstone-200 hover:text-white hover:bg-maroon-800/50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Monuments</span>
            </Link>

            {user?.role === 'visitor' && (
              <Link
                to="/my-tickets"
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive('/my-tickets')
                    ? 'bg-maroon-800 text-white font-semibold'
                    : 'text-sandstone-200 hover:text-white hover:bg-maroon-800/50'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>My Tickets</span>
              </Link>
            )}

            {(user?.role === 'visitor' || user?.role === 'admin') && (
              <Link
                to="/wallet"
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive('/wallet')
                    ? 'bg-maroon-800 text-white font-semibold'
                    : 'text-sandstone-200 hover:text-white hover:bg-maroon-800/50'
                }`}
              >
                <Wallet className="w-4 h-4 text-gold-400" />
                <span>{user.role === 'admin' ? 'Treasury' : 'Wallet'}</span>
              </Link>
            )}

            {user?.role === 'staff' && (
              <>
                <Link
                  to="/staff/queue"
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/staff/queue')
                      ? 'bg-maroon-800 text-white font-semibold'
                      : 'text-sandstone-200 hover:text-white hover:bg-maroon-800/50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Queue</span>
                </Link>
                <Link
                  to="/staff/validate"
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/staff/validate')
                      ? 'bg-maroon-800 text-white font-semibold'
                      : 'text-sandstone-200 hover:text-white hover:bg-maroon-800/50'
                  }`}
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Validate</span>
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <Link
                to="/admin/dashboard"
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive('/admin')
                    ? 'bg-maroon-800 text-white font-semibold'
                    : 'text-sandstone-200 hover:text-white hover:bg-maroon-800/50'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            )}
          </nav>

          {/* Desktop Right Side / Auth */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-sandstone-100 hover:text-white hover:bg-maroon-800">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="gold" size="sm">
                    Book Ticket
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-3 border-l border-maroon-800">
                <div className="text-right">
                  <div className="text-xs font-semibold text-white">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-gold-400 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg bg-maroon-800 hover:bg-maroon-700 text-sandstone-200 hover:text-white transition-colors focus-visible:outline-none"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-maroon-800 text-sandstone-100 hover:text-white focus-visible:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-maroon-800 bg-maroon-950 px-4 py-4 space-y-2">
          <Link
            to="/monuments"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2 rounded-lg text-sandstone-100 hover:bg-maroon-900 text-sm font-medium"
          >
            <Compass className="w-4 h-4 text-gold-400" />
            <span>Monuments</span>
          </Link>

          {user?.role === 'visitor' && (
            <Link
              to="/my-tickets"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2 rounded-lg text-sandstone-100 hover:bg-maroon-900 text-sm font-medium"
            >
              <Ticket className="w-4 h-4 text-gold-400" />
              <span>My Tickets</span>
            </Link>
          )}

          {(user?.role === 'visitor' || user?.role === 'admin') && (
            <Link
              to="/wallet"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2 rounded-lg text-sandstone-100 hover:bg-maroon-900 text-sm font-medium"
            >
              <Wallet className="w-4 h-4 text-gold-400" />
              <span>{user.role === 'admin' ? 'Treasury' : 'Wallet'}</span>
            </Link>
          )}

          {user?.role === 'staff' && (
            <>
              <Link
                to="/staff/queue"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg text-sandstone-100 hover:bg-maroon-900 text-sm font-medium"
              >
                <Users className="w-4 h-4 text-gold-400" />
                <span>Queue</span>
              </Link>
              <Link
                to="/staff/validate"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2 rounded-lg text-sandstone-100 hover:bg-maroon-900 text-sm font-medium"
              >
                <ScanLine className="w-4 h-4 text-gold-400" />
                <span>Validate</span>
              </Link>
            </>
          )}

          {user?.role === 'admin' && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2 rounded-lg text-sandstone-100 hover:bg-maroon-900 text-sm font-medium"
            >
              <Settings className="w-4 h-4 text-gold-400" />
              <span>Dashboard</span>
            </Link>
          )}

          <div className="pt-3 border-t border-maroon-800">
            {!user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" fullWidth size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="gold" fullWidth size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-sm font-semibold text-white">{user.name}</div>
                  <div className="text-xs text-sandstone-400">{user.email}</div>
                </div>
                <Button variant="outline" size="sm" icon={LogOut} onClick={handleLogout} className="text-xs">
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
