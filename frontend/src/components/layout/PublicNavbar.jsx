import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home,
  Ticket, 
  Users, 
  ScanLine, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Compass,
  Wallet,
  Sparkles,
  User as UserIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Logo } from './Logo';

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
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-maroon-950/95 backdrop-blur-md text-white shadow-md border-b border-gold-500/30 transition-all">
      {/* Top micro-highlight bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link 
            to="/" 
            className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-2xl transition-transform active:scale-98"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="National Heritage Monuments Home"
          >
            <Logo variant="navbar" size="md" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 font-medium text-xs sm:text-sm">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                isActive('/')
                  ? 'bg-maroon-800 text-amber-300 border border-amber-400/50 font-bold shadow-xs'
                  : 'text-sandstone-200 hover:text-white hover:bg-maroon-900/80 active:scale-98'
              }`}
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span>Home</span>
            </Link>

            <Link
              to="/monuments"
              className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                isActive('/monuments')
                  ? 'bg-maroon-800 text-amber-300 border border-amber-400/50 font-bold shadow-xs'
                  : 'text-sandstone-200 hover:text-white hover:bg-maroon-900/80 active:scale-98'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Monuments</span>
            </Link>

            {user?.role === 'visitor' && (
              <Link
                to="/my-tickets"
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                  isActive('/my-tickets')
                    ? 'bg-maroon-800 text-amber-300 border border-amber-400/50 font-bold shadow-xs'
                    : 'text-sandstone-200 hover:text-white hover:bg-maroon-900/80 active:scale-98'
                }`}
              >
                <Ticket className="w-4 h-4 text-amber-400" />
                <span>My Tickets</span>
              </Link>
            )}

            {(user?.role === 'visitor' || user?.role === 'admin') && (
              <Link
                to="/wallet"
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                  isActive('/wallet')
                    ? 'bg-maroon-800 text-amber-300 border border-amber-400/50 font-bold shadow-xs'
                    : 'text-sandstone-200 hover:text-white hover:bg-maroon-900/80 active:scale-98'
                }`}
              >
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>{user.role === 'admin' ? 'Treasury' : 'Wallet'}</span>
              </Link>
            )}

            {user?.role === 'staff' && (
              <>
                <Link
                  to="/staff/queue"
                  className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                    isActive('/staff/queue')
                      ? 'bg-maroon-800 text-amber-300 border border-amber-400/50 font-bold shadow-xs'
                      : 'text-sandstone-200 hover:text-white hover:bg-maroon-900/80 active:scale-98'
                  }`}
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Queue Desk</span>
                </Link>
                <Link
                  to="/staff/validate"
                  className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                    isActive('/staff/validate')
                      ? 'bg-maroon-800 text-amber-300 border border-amber-400/50 font-bold shadow-xs'
                      : 'text-sandstone-200 hover:text-white hover:bg-maroon-900/80 active:scale-98'
                  }`}
                >
                  <ScanLine className="w-4 h-4 text-amber-400" />
                  <span>Validate Gate</span>
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <Link
                to="/admin/dashboard"
                className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                  isActive('/admin')
                    ? 'bg-maroon-800 text-amber-300 border border-amber-400/50 font-bold shadow-xs'
                    : 'text-sandstone-200 hover:text-white hover:bg-maroon-900/80 active:scale-98'
                }`}
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Dashboard</span>
              </Link>
            )}
          </nav>

          {/* Desktop Right Side / Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sandstone-100 hover:text-white hover:bg-maroon-900/80 border border-sandstone-400/20"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/monuments">
                  <Button 
                    variant="gold" 
                    size="sm"
                    icon={Sparkles}
                    className="shadow-sm hover:shadow-heritage-glow"
                  >
                    Book Ticket
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-3 border-l border-maroon-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-charcoal-950 font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-amber-400/30">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-white tracking-tight">
                      {user.name}
                    </div>
                    <div className="text-[10.5px] text-amber-300 font-medium capitalize">
                      {user.role} {user.role === 'staff' && user.assignedMonument?.name ? `• ${user.assignedMonument.name}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-maroon-900/80 hover:bg-maroon-800 text-sandstone-200 hover:text-white transition-all border border-maroon-800 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95"
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
            className="md:hidden p-2.5 rounded-xl bg-maroon-900 border border-maroon-800 text-sandstone-100 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 transition-all"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-maroon-800 bg-maroon-950/98 backdrop-blur-xl px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold transition-all ${
              isActive('/') 
                ? 'bg-maroon-800 text-amber-300 border border-amber-400/40' 
                : 'text-sandstone-100 hover:bg-maroon-900/80'
            }`}
          >
            <Home className="w-4 h-4 text-amber-400" />
            <span>Home</span>
          </Link>

          <Link
            to="/monuments"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold transition-all ${
              isActive('/monuments') 
                ? 'bg-maroon-800 text-amber-300 border border-amber-400/40' 
                : 'text-sandstone-100 hover:bg-maroon-900/80'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Monuments Directory</span>
          </Link>

          {user?.role === 'visitor' && (
            <Link
              to="/my-tickets"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive('/my-tickets') 
                  ? 'bg-maroon-800 text-amber-300 border border-amber-400/40' 
                  : 'text-sandstone-100 hover:bg-maroon-900/80'
              }`}
            >
              <Ticket className="w-4 h-4 text-amber-400" />
              <span>My Entry Passes</span>
            </Link>
          )}

          {(user?.role === 'visitor' || user?.role === 'admin') && (
            <Link
              to="/wallet"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive('/wallet') 
                  ? 'bg-maroon-800 text-amber-300 border border-amber-400/40' 
                  : 'text-sandstone-100 hover:bg-maroon-900/80'
              }`}
            >
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>{user.role === 'admin' ? 'Treasury Reserve' : 'Virtual Wallet'}</span>
            </Link>
          )}

          {user?.role === 'staff' && (
            <>
              <Link
                to="/staff/queue"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/staff/queue') 
                    ? 'bg-maroon-800 text-amber-300 border border-amber-400/40' 
                    : 'text-sandstone-100 hover:bg-maroon-900/80'
                }`}
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>Live Queue Desk</span>
              </Link>
              <Link
                to="/staff/validate"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive('/staff/validate') 
                    ? 'bg-maroon-800 text-amber-300 border border-amber-400/40' 
                    : 'text-sandstone-100 hover:bg-maroon-900/80'
                }`}
              >
                <ScanLine className="w-4 h-4 text-amber-400" />
                <span>Turnstile Ticket Validator</span>
              </Link>
            </>
          )}

          {user?.role === 'admin' && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 p-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive('/admin') 
                  ? 'bg-maroon-800 text-amber-300 border border-amber-400/40' 
                  : 'text-sandstone-100 hover:bg-maroon-900/80'
              }`}
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Admin Central Dashboard</span>
            </Link>
          )}

          <div className="pt-3 border-t border-maroon-850">
            {!user ? (
              <div className="grid grid-cols-2 gap-2.5">
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
              <div className="flex items-center justify-between p-2 rounded-xl bg-maroon-900/70 border border-maroon-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-charcoal-950 font-bold text-xs flex items-center justify-center">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{user.name}</div>
                    <div className="text-[10px] text-amber-300 capitalize">{user.role}</div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={LogOut} 
                  onClick={handleLogout} 
                  className="text-xs py-1 px-2.5 border-sandstone-400/30 text-sandstone-100"
                >
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
