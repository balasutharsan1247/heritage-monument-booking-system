import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  Ticket,
  Compass,
  Wallet
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MonumentCard } from '../components/monuments/MonumentCard';
import { MonumentCardSkeleton } from '../components/ui/Skeleton';

export default function Home() {
  const { user } = useAuth();
  const [monuments, setMonuments] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const featured = monuments.slice(0, 3);

  return (
    <div className="space-y-10 pb-12">
      
      {/* Signed-in Visitor Greeting & Quick Links */}
      {user && (
        <div className="bg-sandstone-50 rounded-2xl border border-sandstone-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500 block">
              Signed in as
            </span>
            <span className="text-base font-bold font-serif text-charcoal-900">
              {user.name}
            </span>
            <span className="ml-2 inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-sandstone-200 text-charcoal-700 capitalize">
              {user.role}
            </span>
          </div>

          <div className="flex items-center gap-2">
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
        </div>
      )}

      {/* FEATURED MONUMENTS */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-sandstone-200 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-charcoal-900">
              Featured Monuments
            </h1>
            <p className="text-xs text-charcoal-500 mt-1">Popular destinations available for online reservation</p>
          </div>
          <Link to="/monuments" className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-maroon-800 hover:text-maroon-900">
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

      {/* Guest-only Onboarding & Benefits (hidden for signed-in users) */}
      {!user && (
        <>
          {/* HOW IT WORKS */}
          <section className="bg-white rounded-3xl border border-sandstone-200 p-8 sm:p-10 shadow-sm space-y-8">
            <div className="text-center max-w-lg mx-auto">
              <h2 className="text-2xl font-bold font-serif text-charcoal-900">
                How It Works
              </h2>
              <p className="text-xs text-charcoal-500 mt-1">
                Book your visit in four simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-sandstone-50 rounded-2xl p-5 border border-sandstone-200 text-center space-y-2">
                <div className="w-9 h-9 rounded-xl bg-maroon-800 text-white flex items-center justify-center font-serif font-bold text-sm mx-auto">
                  1
                </div>
                <h3 className="font-bold text-sm text-charcoal-900">Select Monument</h3>
                <p className="text-xs text-charcoal-600">Choose your destination and preferred visit date.</p>
              </div>

              <div className="bg-sandstone-50 rounded-2xl p-5 border border-sandstone-200 text-center space-y-2">
                <div className="w-9 h-9 rounded-xl bg-maroon-800 text-white flex items-center justify-center font-serif font-bold text-sm mx-auto">
                  2
                </div>
                <h3 className="font-bold text-sm text-charcoal-900">Choose Slot</h3>
                <p className="text-xs text-charcoal-600">Pick an entry window that fits your schedule.</p>
              </div>

              <div className="bg-sandstone-50 rounded-2xl p-5 border border-sandstone-200 text-center space-y-2">
                <div className="w-9 h-9 rounded-xl bg-maroon-800 text-white flex items-center justify-center font-serif font-bold text-sm mx-auto">
                  3
                </div>
                <h3 className="font-bold text-sm text-charcoal-900">Get Digital Pass</h3>
                <p className="text-xs text-charcoal-600">Receive an instant QR entry pass with your queue token.</p>
              </div>

              <div className="bg-sandstone-50 rounded-2xl p-5 border border-sandstone-200 text-center space-y-2">
                <div className="w-9 h-9 rounded-xl bg-gold-500 text-charcoal-950 flex items-center justify-center font-serif font-bold text-sm mx-auto">
                  4
                </div>
                <h3 className="font-bold text-sm text-charcoal-900">Scan &amp; Enter</h3>
                <p className="text-xs text-charcoal-600">Scan your pass at the gate when your token is called.</p>
              </div>
            </div>
          </section>

          {/* KEY BENEFITS */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-sandstone-200 p-7 shadow-sm flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-sandstone-100 flex items-center justify-center text-maroon-800 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-charcoal-900 font-serif">Real-Time Virtual Queues</h3>
                <p className="text-xs text-charcoal-600 leading-relaxed">
                  Track counter progress live from your device. You'll receive an instant alert when it's your turn to enter.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-sandstone-200 p-7 shadow-sm flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-sandstone-100 flex items-center justify-center text-maroon-800 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-charcoal-900 font-serif">Verified Digital Passes</h3>
                <p className="text-xs text-charcoal-600 leading-relaxed">
                  Secure QR tickets with guaranteed time-slot admission, helping prevent overcrowding and ticket fraud.
                </p>
              </div>
            </div>
          </section>
        </>
      )}

    </div>
  );
}