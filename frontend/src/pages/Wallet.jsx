import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Wallet as WalletIcon, 
  PlusCircle, 
  MinusCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw, 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Landmark, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000];

export default function Wallet() {
  const auth = useAuth?.() || {};
  const user = auth.user;

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'credit', 'debit'

  const isAdmin = user?.role === 'admin' || wallet?.isTreasury;

  // Top-up Modal State
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState('');

  // Debit Modal State
  const [isDebitOpen, setIsDebitOpen] = useState(false);
  const [debitAmount, setDebitAmount] = useState('');
  const [debitReason, setDebitReason] = useState('');
  const [debitLoading, setDebitLoading] = useState(false);
  const [debitError, setDebitError] = useState('');

  const toast = useToast();

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await api.getWallet();
      if (res.success) {
        setWallet(res.data);
      } else {
        toast.error(res.message || 'Failed to load wallet');
      }
    } catch (err) {
      toast.error('Network error loading wallet details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleTopup = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(topupAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTopupError('Please enter a valid top-up amount.');
      return;
    }

    setTopupLoading(true);
    setTopupError('');

    try {
      const res = await api.topupWallet({
        amount: amountNum,
        paymentMethod,
        description: `Top-up via ${paymentMethod}`,
      });

      if (res.success) {
        toast.success(res.message || `Added ₹${amountNum.toLocaleString()} to wallet!`);
        setIsTopupOpen(false);
        setTopupAmount('');
        fetchWallet();
      } else {
        setTopupError(res.message || 'Top-up failed. Please try again.');
      }
    } catch {
      setTopupError('Network error processing top-up.');
    } finally {
      setTopupLoading(false);
    }
  };

  const handleDebit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(debitAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setDebitError('Please enter a valid amount to debit.');
      return;
    }

    if (amountNum > (wallet?.balance || 0)) {
      setDebitError(`Insufficient balance. Maximum debitable amount is ₹${(wallet?.balance || 0).toLocaleString()}`);
      return;
    }

    setDebitLoading(true);
    setDebitError('');

    try {
      const res = await api.debitWallet({
        amount: amountNum,
        purpose: 'manual_debit',
        description: debitReason.trim() || 'Manual Wallet Debit',
      });

      if (res.success) {
        toast.success(res.message || `Debited ₹${amountNum.toLocaleString()} from wallet.`);
        setIsDebitOpen(false);
        setDebitAmount('');
        setDebitReason('');
        fetchWallet();
      } else {
        setDebitError(res.message || 'Debit failed.');
      }
    } catch {
      setDebitError('Network error processing debit.');
    } finally {
      setDebitLoading(false);
    }
  };

  if (loading && !wallet) {
    return <PageLoader message="Loading Virtual Wallet..." />;
  }

  const transactions = wallet?.transactions || [];
  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'credit') return t.type === 'credit';
    if (filter === 'debit') return t.type === 'debit';
    return true;
  });

  const balance = wallet?.balance ?? 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-14">
      
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: isAdmin ? 'Treasury Wallet' : 'Virtual Wallet' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sandstone-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold font-sans text-charcoal-900 flex items-center gap-2.5">
            <WalletIcon className="w-7 h-7 text-maroon-800" />
            <span>{isAdmin ? 'Central Treasury Wallet' : 'Virtual Wallet'}</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            {isAdmin 
              ? 'Real-time revenue accumulated automatically from visitor ticket bookings and central treasury operations.' 
              : 'Prepaid balance for seamless monument bookings and instant refunds'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {isAdmin ? (
            <>
              <Link to="/admin/treasury">
                <Button variant="secondary" size="sm" icon={Landmark}>
                  Treasury Overview
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                icon={PlusCircle}
                onClick={() => {
                  setTopupError('');
                  setIsTopupOpen(true);
                }}
              >
                Record Allocation
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={MinusCircle}
                onClick={() => {
                  setDebitError('');
                  setIsDebitOpen(true);
                }}
                disabled={balance <= 0}
              >
                Disburse Funds
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={RotateCcw}
                onClick={async () => {
                  try {
                    const res = await api.reconcileTreasury();
                    if (res.success) {
                      toast.success(`Treasury reconciled! Balance synced to ₹${(res.data?.currentBalance ?? 0).toLocaleString()}`);
                      fetchWallet();
                    }
                  } catch {
                    toast.error('Reconciliation failed.');
                  }
                }}
                title="Audit & sync treasury balance"
              >
                Reconcile
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={PlusCircle}
                onClick={() => {
                  setTopupError('');
                  setIsTopupOpen(true);
                }}
              >
                Add Money
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={MinusCircle}
                onClick={() => {
                  setDebitError('');
                  setIsDebitOpen(true);
                }}
                disabled={balance <= 0}
              >
                Debit Funds
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Main Digital Wallet Card */}
        <div className="md:col-span-2 rounded-3xl p-7 bg-gradient-to-br from-maroon-900 via-maroon-850 to-charcoal-950 text-white shadow-heritage-lg relative overflow-hidden border border-gold-500/30 flex flex-col justify-between min-h-[200px]">
          <div className="absolute right-[-15px] bottom-[-20px] opacity-10 pointer-events-none">
            <Landmark className="w-56 h-56 text-gold-300" />
          </div>

          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gold-300 backdrop-blur-sm border border-white/10">
                <WalletIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-gold-300">
                {isAdmin ? 'Central Treasury Reserve' : 'Heritage Cash Card'}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-sandstone-200 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAdmin ? 'Auto-Credit Active' : 'Instant Checkout Active'}</span>
            </div>
          </div>

          <div className="my-4 z-10">
            <span className="text-[11px] uppercase tracking-wider text-sandstone-300 font-semibold block">
              {isAdmin ? 'Accumulated Ticket Revenue' : 'Available Balance'}
            </span>
            <div data-testid="wallet-balance" className="text-4xl sm:text-5xl font-black font-sans tracking-tight text-ivory-50 mt-1">
              ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-sandstone-300 border-t border-white/10 pt-3 z-10">
            <span>Currency: INR (₹)</span>
            <span>{isAdmin ? 'Audited System Revenue' : 'Zero Processing Fees'}</span>
          </div>
        </div>

        {/* Quick Top-up Box (Visitors) vs Automated Treasury Box (Admin) */}
        {isAdmin ? (
          <div className="bg-white rounded-3xl border border-sandstone-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 flex items-center gap-1.5 mb-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Automated Treasury
              </h3>
              <p className="text-xs text-charcoal-600 mb-4 leading-relaxed">
                Visitor ticket deductions are credited directly into this treasury wallet in real time.
              </p>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs text-emerald-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Zero Manual Actions
                </div>
                <p className="text-[11px] text-emerald-700 leading-normal">
                  No manual top-up required. Bookings credit here directly; cancellations are deducted automatically.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-sandstone-100 text-[11px] text-charcoal-500 flex items-center justify-between">
              <span>Account Status</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Active System Collector
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-sandstone-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 flex items-center gap-1.5 mb-3">
                <Sparkles className="w-4 h-4 text-gold-500" />
                Quick Top-Up
              </h3>
              <p className="text-xs text-charcoal-500 mb-4">
                Instantly recharge your wallet to skip payment forms at ticket checkout.
              </p>

              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.slice(0, 3).map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setTopupAmount(amt.toString());
                      setIsTopupOpen(true);
                    }}
                    className="py-2 px-1 text-center rounded-xl bg-sandstone-50 hover:bg-maroon-50 border border-sandstone-200 hover:border-maroon-300 font-bold text-xs text-charcoal-900 hover:text-maroon-900 transition-colors cursor-pointer"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-sandstone-100">
              <Button
                variant="gold"
                size="sm"
                fullWidth
                icon={PlusCircle}
                onClick={() => {
                  setTopupAmount('500');
                  setIsTopupOpen(true);
                }}
                className="text-xs font-bold"
              >
                Add ₹500 Now
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* Transactions Section */}
      <div className="bg-white rounded-3xl border border-sandstone-200 shadow-sm p-6 sm:p-7 space-y-6">
        
        {/* Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sandstone-100 pb-4">
          <div>
            <h2 className="text-xl font-extrabold font-sans text-charcoal-900">
              Transaction History
            </h2>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Live ledger of deposits, ticket debits, and cancellation refunds
            </p>
          </div>

          <div className="flex gap-1.5 bg-sandstone-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-charcoal-900 shadow-xs font-bold'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('credit')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'credit'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              Credits (+)
            </button>
            <button
              type="button"
              onClick={() => setFilter('debit')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'debit'
                  ? 'bg-white text-red-700 shadow-xs font-bold'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              Debits (-)
            </button>
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={WalletIcon}
            title={filter === 'all' ? 'No transactions yet' : `No ${filter} transactions`}
            description={
              filter === 'all'
                ? (isAdmin ? 'Audited revenue transactions will appear here as visitors book and cancel tickets.' : 'Your deposit, booking debit, and refund history will appear here.')
                : 'No transactions match this category.'
            }
          />
        ) : (
          <div className="divide-y divide-sandstone-100">
            {filteredTransactions.map((tx) => {
              const isCredit = tx.type === 'credit';
              const formattedDate = new Date(tx.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={tx._id} data-testid="transaction-item" className="py-4 flex items-center justify-between gap-4 hover:bg-sandstone-50/60 transition-colors px-2 rounded-xl">
                  
                  {/* Left: Icon & Description */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-charcoal-900 truncate">
                          {tx.description || (isCredit ? 'Wallet Top-up' : 'Wallet Debit')}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            tx.purpose === 'ticket_refund' || tx.purpose === 'ticket_refund_deduction'
                              ? 'bg-rose-100 text-rose-800'
                              : tx.purpose === 'ticket_purchase'
                              ? 'bg-amber-100 text-amber-800'
                              : tx.purpose === 'ticket_revenue'
                              ? 'bg-emerald-100 text-emerald-800'
                              : isCredit
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-charcoal-100 text-charcoal-800'
                          }`}
                        >
                          {tx.purpose?.replace(/_/g, ' ') || tx.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-charcoal-500 mt-0.5">
                        <Clock className="w-3 h-3 text-charcoal-400" />
                        <span>{formattedDate}</span>
                        {tx.paymentMethod && <span>• {tx.paymentMethod}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Balance After */}
                  <div className="text-right shrink-0">
                    <div
                      className={`text-base font-black font-mono ${
                        isCredit ? 'text-emerald-700' : 'text-charcoal-900'
                      }`}
                    >
                      {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-charcoal-500 font-mono mt-0.5">
                      Bal: ₹{tx.balanceAfter?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODALS: TOP-UP / ALLOCATION & DEBIT / DISBURSEMENT */}
      <Modal
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
        title={isAdmin ? "Record Treasury Allocation / Grant" : "Add Money to Wallet"}
        description={
          isAdmin
            ? "Deposit capital, state grant, or preservation subsidy into the Central Treasury reserve."
            : "Choose a preset amount or enter a custom sum to deposit into your virtual wallet."
        }
      >
        <form onSubmit={handleTopup} className="space-y-5">
          {topupError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{topupError}</span>
            </div>
          )}

          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 block mb-2">
              Quick Select Amount
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopupAmount(amt.toString())}
                  className={`py-2 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    topupAmount === amt.toString()
                      ? 'bg-maroon-800 text-white border-maroon-900 shadow-xs'
                      : 'bg-sandstone-50 hover:bg-sandstone-100 text-charcoal-800 border-sandstone-200'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          <Input
            label={isAdmin ? "Allocation Sum (₹)" : "Custom Amount (₹)"}
            type="number"
            min="1"
            max={isAdmin ? 10000000 : 50000}
            step="1"
            required
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            placeholder="e.g. 5000"
          />

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 block mb-2">
              {isAdmin ? "Capital Transfer Channel" : "Payment Gateway"}
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                { id: 'Card', label: 'Card', icon: CreditCard },
                { id: 'NetBanking', label: 'Net Banking', icon: Landmark },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 text-xs font-bold ${
                      isSelected
                        ? 'border-maroon-800 bg-maroon-50 text-maroon-900'
                        : 'border-sandstone-200 bg-white hover:border-sandstone-300 text-charcoal-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsTopupOpen(false)}
              disabled={topupLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={topupLoading}
              icon={PlusCircle}
            >
              {topupLoading 
                ? 'Processing...' 
                : isAdmin 
                ? `Record ₹${parseFloat(topupAmount || 0).toLocaleString()} Allocation` 
                : `Deposit ₹${parseFloat(topupAmount || 0).toLocaleString()}`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DEBIT / DISBURSEMENT MODAL */}
      <Modal
        isOpen={isDebitOpen}
        onClose={() => setIsDebitOpen(false)}
        title={isAdmin ? "Disburse Treasury Maintenance Funds" : "Debit Wallet Funds"}
        description={
          isAdmin
            ? "Authorize and disburse capital for monument preservation, facilities, or repairs."
            : "Withdraw or deduct money from your current wallet balance."
        }
      >
        <form onSubmit={handleDebit} className="space-y-4">
          {debitError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{debitError}</span>
            </div>
          )}

          <div className="bg-sandstone-50 p-3 rounded-xl border border-sandstone-200 text-xs flex justify-between items-center">
            <span className="text-charcoal-600">Available Treasury Reserve:</span>
            <span className="font-bold text-maroon-900 font-mono text-sm">
              ₹{balance.toLocaleString()}
            </span>
          </div>

          <Input
            label={isAdmin ? "Disbursement Amount (₹)" : "Amount to Debit (₹)"}
            type="number"
            min="1"
            max={balance}
            step="1"
            required
            value={debitAmount}
            onChange={(e) => setDebitAmount(e.target.value)}
            placeholder="e.g. 500"
          />

          <Input
            label={isAdmin ? "Maintenance Purpose / Reference" : "Purpose / Note (Optional)"}
            type="text"
            value={debitReason}
            onChange={(e) => setDebitReason(e.target.value)}
            placeholder={isAdmin ? "e.g. Qutub Minar ticket counter upkeep" : "e.g. Manual Withdrawal / Payment"}
          />

          <div className="pt-2 flex justify-end gap-2.5">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsDebitOpen(false)}
              disabled={debitLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="submit"
              loading={debitLoading}
              icon={MinusCircle}
            >
              {debitLoading ? 'Processing...' : isAdmin ? 'Confirm Disbursement' : 'Confirm Debit'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
