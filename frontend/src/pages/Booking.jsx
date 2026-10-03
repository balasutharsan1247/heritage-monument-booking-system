import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Ticket as TicketIcon, 
  CheckCircle2, 
  AlertCircle,
  Wallet as WalletIcon, 
  CreditCard, 
  Plus,
  Minus,
  Users,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { PageLoader } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';

const AVAILABLE_SLOTS = [
  { value: '09:00-11:00', label: '09:00 AM – 11:00 AM' },
  { value: '11:00-13:00', label: '11:00 AM – 01:00 PM' },
  { value: '13:00-15:00', label: '01:00 PM – 03:00 PM' },
  { value: '15:00-17:00', label: '03:00 PM – 05:00 PM' },
];

const QUICK_QUANTITIES = [
  { count: 1, label: '1 Ticket' },
  { count: 2, label: '2 Tickets' },
  { count: 4, label: '4 (Family)' },
  { count: 6, label: '6 (Group)' },
];

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [monument, setMonument] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [loadingMonument, setLoadingMonument] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([
      api.getMonument(id),
      api.getWallet().catch(() => ({ success: false })),
    ])
      .then(([mRes, wRes]) => {
        if (mRes.success) {
          setMonument(mRes.data);
          setDate(today);
        } else {
          setError(mRes.message || 'Could not load monument');
        }

        if (wRes?.success) {
          setWallet(wRes.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load booking info:', err);
        setError('Network error loading monument');
      })
      .finally(() => setLoadingMonument(false));
  }, [id, today]);

  const unitPrice = monument?.baseTicketPrice || 0;
  const totalCost = unitPrice * quantity;
  const walletBalance = wallet?.balance ?? 0;
  const hasInsufficientWallet = paymentMethod === 'wallet' && walletBalance < totalCost;

  const handleQuantityChange = (newQty) => {
    const clamped = Math.max(1, Math.min(10, newQty));
    setQuantity(clamped);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!slot) {
      setError('Please select an entry time slot.');
      return;
    }

    if (hasInsufficientWallet) {
      setError(`Insufficient wallet balance. Total is ₹${totalCost.toLocaleString()}, but your balance is ₹${walletBalance.toLocaleString()}. Please top up your wallet or choose Direct Gateway.`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const [slotStart, slotEnd] = slot.split('-');
      const res = await api.bookTicket({
        monumentId: id,
        visitDate: date,
        slotStart,
        slotEnd,
        quantity,
        paymentMethod,
      });

      if (res.success) {
        const ticketId = res.primaryTicketId || (Array.isArray(res.data) ? res.data[0]._id : res.data?._id);
        navigate(`/tickets/${ticketId}`);
      } else {
        setError(res.message || 'Reservation could not be completed');
      }
    } catch (err) {
      setError('A network error occurred while booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMonument) return <PageLoader message="Loading booking..." />;

  if (!monument) {
    return (
      <div className="py-12">
        <ErrorState
          error={error || 'Monument record not found'}
          title="Booking Unavailable"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const selectedSlotObj = AVAILABLE_SLOTS.find((s) => s.value === slot);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Monuments', href: '/monuments' },
          { label: monument.name, href: `/monuments/${monument._id}` },
          { label: 'Book Ticket' },
        ]}
      />

      {/* Header */}
      <div className="border-b border-sandstone-200 pb-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-sans text-charcoal-900">
          Book Entry Tickets
        </h1>
        <p className="text-xs text-charcoal-500 mt-0.5">
          {monument.name} • {monument.location}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left: Form */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-sandstone-200 p-6 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Visit Date */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-maroon-800" />
                  Visit Date
                </label>
                {/* Quick Date Pills */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDate(today)}
                    className="px-2 py-0.5 rounded-md bg-sandstone-100 hover:bg-amber-100 text-charcoal-700 font-bold transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tom = new Date();
                      tom.setDate(tom.getDate() + 1);
                      setDate(tom.toISOString().split('T')[0]);
                    }}
                    className="px-2 py-0.5 rounded-md bg-sandstone-100 hover:bg-amber-100 text-charcoal-700 font-bold transition-colors cursor-pointer"
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl bg-white text-charcoal-900 border border-sandstone-300 px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-maroon-700 focus:ring-2 focus:ring-maroon-600/20"
              />
            </div>

            {/* Time Slot */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-maroon-800" />
                Select Time Slot
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AVAILABLE_SLOTS.map((s) => {
                  const isSelected = slot === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSlot(s.value)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-sm ${
                        isSelected
                          ? 'border-maroon-800 bg-maroon-50 text-maroon-900 font-bold'
                          : 'border-sandstone-200 bg-white hover:border-sandstone-300 text-charcoal-800 font-medium'
                      }`}
                    >
                      <span>{s.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-maroon-800 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-sandstone-50/70 border border-sandstone-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-maroon-800" />
                  Number of Tickets
                </label>
                <span className="text-xs font-semibold text-charcoal-500">
                  ₹{unitPrice} per visitor
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 pt-1">
                {/* Stepper */}
                <div className="flex items-center bg-white border border-sandstone-300 rounded-xl p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoal-700 hover:bg-sandstone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-base font-mono text-charcoal-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= 10}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoal-700 hover:bg-sandstone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_QUANTITIES.map((q) => (
                    <button
                      key={q.count}
                      type="button"
                      onClick={() => handleQuantityChange(q.count)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        quantity === q.count
                          ? 'bg-maroon-800 text-white shadow-2xs'
                          : 'bg-white text-charcoal-700 hover:bg-sandstone-200 border border-sandstone-200'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-charcoal-500 pt-0.5">
                Up to 10 tickets per booking. Individual digital QR passes will be generated for each attendee.
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-maroon-800" />
                  Payment Method
                </label>
                {wallet && (
                  <Link
                    to="/wallet"
                    target="_blank"
                    className="text-maroon-800 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <Plus className="w-3 h-3" /> Top-up Wallet
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Virtual Wallet Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between text-xs ${
                    paymentMethod === 'wallet'
                      ? 'border-maroon-800 bg-maroon-50 text-maroon-900 font-bold'
                      : 'border-sandstone-200 bg-white hover:border-sandstone-300 text-charcoal-800 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-1.5 font-bold text-sm">
                      <WalletIcon className="w-4 h-4 text-maroon-800" />
                      Virtual Wallet
                    </span>
                    {paymentMethod === 'wallet' && <CheckCircle2 className="w-4 h-4 text-maroon-800 shrink-0" />}
                  </div>
                  <span className={`mt-1.5 font-mono text-[11px] ${
                    hasInsufficientWallet
                      ? 'text-red-700 font-bold'
                      : 'text-charcoal-600'
                  }`}>
                    Balance: ₹{walletBalance.toLocaleString()}
                    {hasInsufficientWallet && ` (Need ₹${totalCost.toLocaleString()})`}
                  </span>
                </button>

                {/* Direct Gateway Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('direct')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between text-xs ${
                    paymentMethod === 'direct'
                      ? 'border-maroon-800 bg-maroon-50 text-maroon-900 font-bold'
                      : 'border-sandstone-200 bg-white hover:border-sandstone-300 text-charcoal-800 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-1.5 font-bold text-sm">
                      <CreditCard className="w-4 h-4 text-maroon-800" />
                      Direct Gateway
                    </span>
                    {paymentMethod === 'direct' && <CheckCircle2 className="w-4 h-4 text-maroon-800 shrink-0" />}
                  </div>
                  <span className="mt-1.5 text-[11px] text-charcoal-600">
                    Pay via UPI / Card at booking
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                type="submit"
                fullWidth
                loading={submitting}
                disabled={submitting || !date || !slot || hasInsufficientWallet}
                icon={TicketIcon}
              >
                {submitting ? 'Generating Passes...' : `Confirm & Book ${quantity} Ticket${quantity > 1 ? 's' : ''}`}
              </Button>
            </div>

          </form>
        </div>

        {/* Right: Summary */}
        <div className="bg-white rounded-2xl border border-sandstone-200 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-700 border-b border-sandstone-100 pb-2">
            Booking Summary
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-charcoal-500">Monument</span>
              <span className="font-semibold text-charcoal-800 truncate max-w-[140px]">{monument.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-charcoal-500">Date</span>
              <span className="font-semibold text-charcoal-800">
                {date ? new Date(date).toLocaleDateString() : '—'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-charcoal-500">Slot</span>
              <span className="font-semibold text-charcoal-800">
                {selectedSlotObj ? selectedSlotObj.label : '—'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-charcoal-500">Ticket Quantity</span>
              <span className="font-bold text-charcoal-900 bg-sandstone-100 px-2 py-0.5 rounded-md">
                {quantity} {quantity === 1 ? 'Person' : 'People'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-charcoal-500">Base Price</span>
              <span className="font-semibold text-charcoal-800">₹{unitPrice} / ticket</span>
            </div>

            <div className="flex justify-between">
              <span className="text-charcoal-500">Payment Via</span>
              <span className="font-semibold text-charcoal-800">
                {paymentMethod === 'wallet' ? 'Virtual Wallet' : 'Direct Gateway'}
              </span>
            </div>

            <div className="flex justify-between border-t border-sandstone-200 pt-3 text-sm">
              <span className="font-bold text-charcoal-900">Total Payable</span>
              <span className="font-black text-maroon-900 font-mono text-base">₹{totalCost.toLocaleString()}</span>
            </div>

            {paymentMethod === 'wallet' && (
              <div className="p-2.5 rounded-xl bg-sandstone-50 border border-sandstone-200 text-[11px] space-y-1">
                <div className="flex justify-between text-charcoal-600">
                  <span>Current Balance:</span>
                  <span className="font-mono font-semibold">₹{walletBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-charcoal-700 font-bold border-t border-sandstone-200/60 pt-1">
                  <span>Balance After:</span>
                  <span className={`font-mono ${walletBalance >= totalCost ? 'text-emerald-700' : 'text-red-700'}`}>
                    ₹{Math.max(0, walletBalance - totalCost).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}