import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  Ticket, 
  Compass, 
  Wallet, 
  Sparkles, 
  QrCode, 
  Landmark, 
  Users, 
  ArrowRight,
  CheckCircle2,
  Search
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MonumentCard } from '../components/monuments/MonumentCard';
import { MonumentCardSkeleton } from '../components/ui/Skeleton';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [monuments, setMonuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroSearch, setHeroSearch] = useState('');

  useEffect(() => {
    api.getMonuments()
      .then((res) => {
        if (res.success) {
          setMonuments(res.data.monuments || res.data || []);
        }
      })
      .catch((err) => console.error('Failed to load monuments:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/monuments?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/monuments');
    }
  };

  const featured = monuments.slice(0, 3);

  return (
    <div className="space-y-12 pb-16">
      
      {/* ========================================================= */}
      {/* HERO SECTION */}
      {/* ========================================================= */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-maroon-950 via-maroon-900 to-charcoal-950 text-white border border-gold-500/30 shadow-heritage-lg p-7 sm:p-12 md:p-14">
        {/* Subtle Architectural Pattern & Atmospheric Ambient Glows */}
        <div className="absolute inset-0 heritage-pattern opacity-20 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-maroon-500/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-6">
          
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-amber-400/40 text-amber-300 text-xs font-bold tracking-wide shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Official National Cultural Heritage Portal</span>
          </div>

          {/* Headline (Plus Jakarta Sans Display) */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-sans tracking-tight leading-[1.08] text-ivory-50 text-balance">
            Step Across Centuries in Seconds.
          </h1>

          {/* Subtext */}
          <p className="text-sm sm:text-base text-sandstone-200 leading-relaxed max-w-xl font-normal">
            Book verified monument time-slots, bypass ticket lines with live virtual queues, and experience timeless national cultural wonders.
          </p>

          {/* Interactive Hero Search Bar */}
          <form onSubmit={handleHeroSearch} className="max-w-xl pt-1">
            <div className="flex items-center bg-white/95 backdrop-blur-md rounded-2xl p-1.5 shadow-lg border border-amber-400/40 focus-within:ring-2 focus-within:ring-amber-400">
              <div className="pl-3 pr-2 text-charcoal-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search monuments, cities (e.g. Taj Mahal, Agra, Delhi)..."
                className="w-full bg-transparent text-charcoal-900 placeholder:text-charcoal-400 text-sm font-medium focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs shrink-0 transition-all shadow-xs"
              >
                Search
              </button>
            </div>
          </form>

          {/* Interactive Quick Destination Pills */}
          <div className="flex items-center gap-2 flex-wrap pt-0.5 text-xs text-sandstone-300">
            <span className="font-semibold text-amber-300/90 text-[11px] uppercase tracking-wider">Top Destinations:</span>
            {['Taj Mahal', 'Red Fort', 'Meenakshi Temple', 'Qutub Minar', 'Gateway of India'].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => navigate(`/monuments?q=${encodeURIComponent(name)}`)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium border border-white/10 transition-all text-xs active:scale-95"
              >
                {name}
              </button>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link to="/monuments">
              <Button 
                variant="gold" 
                size="lg" 
                icon={Compass}
                className="shadow-sm hover:shadow-heritage-glow text-sm font-bold"
              >
                Explore All Monuments ({monuments.length})
              </Button>
            </Link>

            {!user ? (
              <Link to="/register">
                <Button 
                  variant="outline" 
                  size="lg" 
                  icon={ArrowRight}
                  iconPosition="right"
                  className="border-sandstone-300/40 text-sandstone-100 hover:text-white hover:bg-white/10 text-sm font-semibold"
                >
                  Create Visitor Account
                </Button>
              </Link>
            ) : (
              <Link to="/my-tickets">
                <Button 
                  variant="outline" 
                  size="lg" 
                  icon={Ticket}
                  className="border-sandstone-300/40 text-sandstone-100 hover:text-white hover:bg-white/10 text-sm font-semibold"
                >
                  My Entry Passes
                </Button>
              </Link>
            )}
          </div>

        </div>

        {/* Hero Trust Micro-Strip */}
        <div className="relative z-10 mt-10 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-sandstone-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">Guaranteed Slots</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">Live Virtual Queues</span>
          </div>
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">Instant Digital Passes</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">Zero Gate Surcharges</span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SIGNED-IN VISITOR SHORTCUT CARD */}
      {/* ========================================================= */}
      {user && (
        <section className="bg-sandstone-50 rounded-2xl border border-sandstone-200/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-heritage-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-maroon-800 to-maroon-950 text-amber-300 flex items-center justify-center font-bold font-sans text-sm border border-gold-500/40 shadow-xs">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold font-sans text-charcoal-900">
                  Welcome back, {user.name}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sandstone-200 text-charcoal-700 capitalize">
                  {user.role}
                </span>
              </div>
              <span className="text-xs text-charcoal-500 block">
                Manage your active passes and wallet reservations
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {user.role === 'visitor' && (
              <>
                <Link to="/wallet">
                  <Button variant="outline" size="sm" icon={Wallet} className="text-xs border-sandstone-300">
                    Wallet
                  </Button>
                </Link>
                <Link to="/my-tickets">
                  <Button variant="secondary" size="sm" icon={Ticket} className="text-xs">
                    My Tickets
                  </Button>
                </Link>
              </>
            )}
            <Link to="/monuments">
              <Button variant="primary" size="sm" icon={Compass} className="text-xs">
                Browse All ({monuments.length})
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* FEATURED MONUMENTS SECTION */}
      {/* ========================================================= */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-sandstone-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-maroon-800 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Handpicked Destinations</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-sans text-charcoal-900 tracking-tight">
              Featured Monuments
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-500 mt-0.5">
              Popular historical destinations available for direct slot reservation
            </p>
          </div>
          <Link 
            to="/monuments" 
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-maroon-800 hover:text-maroon-900 transition-colors"
          >
            <span>View All ({monuments.length})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <MonumentCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((m) => (
              <MonumentCard key={m._id} monument={m} />
            ))}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* HOW IT WORKS */}
      {/* ========================================================= */}
      <section className="bg-white rounded-3xl border border-sandstone-200 p-8 sm:p-10 shadow-heritage-sm space-y-8">
        <div className="text-center max-w-md mx-auto space-y-1">
          <h3 className="text-2xl font-extrabold font-sans text-charcoal-900 tracking-tight">
            How It Works
          </h3>
          <p className="text-xs text-charcoal-500">
            Book your cultural visit in four seamless steps
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-sandstone-50 rounded-2xl p-5 border border-sandstone-200/80 text-center space-y-2.5 hover:border-amber-400 hover:shadow-xs transition-all">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-maroon-800 to-maroon-950 text-amber-300 flex items-center justify-center font-sans font-extrabold text-sm mx-auto shadow-xs border border-amber-400/30">
              1
            </div>
            <h4 className="font-bold text-sm text-charcoal-900">Select Monument</h4>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              Choose your destination, explore visiting hours and ticket details.
            </p>
          </div>

          <div className="bg-sandstone-50 rounded-2xl p-5 border border-sandstone-200/80 text-center space-y-2.5 hover:border-amber-400 hover:shadow-xs transition-all">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-maroon-800 to-maroon-950 text-amber-300 flex items-center justify-center font-sans font-extrabold text-sm mx-auto shadow-xs border border-amber-400/30">
              2
            </div>
            <h4 className="font-bold text-sm text-charcoal-900">Choose Slot</h4>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              Pick your preferred visit date and designated entry window.
            </p>
          </div>

          <div className="bg-sandstone-50 rounded-2xl p-5 border border-sandstone-200/80 text-center space-y-2.5 hover:border-amber-400 hover:shadow-xs transition-all">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-maroon-800 to-maroon-950 text-amber-300 flex items-center justify-center font-sans font-extrabold text-sm mx-auto shadow-xs border border-amber-400/30">
              3
            </div>
            <h4 className="font-bold text-sm text-charcoal-900">Get Digital Pass</h4>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              Receive an instant encrypted QR pass with your personal queue token.
            </p>
          </div>

          <div className="bg-sandstone-50 rounded-2xl p-5 border border-sandstone-200/80 text-center space-y-2.5 hover:border-amber-400 hover:shadow-xs transition-all">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-charcoal-950 flex items-center justify-center font-sans font-extrabold text-sm mx-auto shadow-xs border border-amber-300">
              4
            </div>
            <h4 className="font-bold text-sm text-charcoal-900">Scan &amp; Enter</h4>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              Bypass physical counter lines and scan your pass at the turnstile gate.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* KEY FEATURES & BENEFITS */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-sandstone-200 p-6 shadow-heritage-sm flex flex-col justify-between space-y-4 hover:border-amber-400/40 hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-maroon-50 to-sandstone-100 flex items-center justify-center text-maroon-800 shrink-0 border border-sandstone-200">
            <Clock className="w-6 h-6 text-maroon-800" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-base text-charcoal-900 font-sans">
              Real-Time Virtual Queues
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              Track live entrance telemetry on your smartphone and arrive precisely when your token is called.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-sandstone-200 p-6 shadow-heritage-sm flex flex-col justify-between space-y-4 hover:border-amber-400/40 hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-maroon-50 to-sandstone-100 flex items-center justify-center text-maroon-800 shrink-0 border border-sandstone-200">
            <ShieldCheck className="w-6 h-6 text-maroon-800" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-base text-charcoal-900 font-sans">
              Verified Digital Passes
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              Guaranteed time-slot admission preventing gate congestion, ticket counterfeiting, and scalping.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-sandstone-200 p-6 shadow-heritage-sm flex flex-col justify-between space-y-4 hover:border-amber-400/40 hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-maroon-50 to-sandstone-100 flex items-center justify-center text-maroon-800 shrink-0 border border-sandstone-200">
            <Wallet className="w-6 h-6 text-maroon-800" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-base text-charcoal-900 font-sans">
              Instant Wallet &amp; Refunds
            </h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              One-click checkout with prepaid wallet balance and immediate automated refunds upon ticket cancellation.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}