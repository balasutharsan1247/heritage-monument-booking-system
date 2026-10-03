import React, { useEffect, useState, lazy, Suspense } from 'react';
import { api } from '../api';
import { 
  Activity, 
  Ticket, 
  Users, 
  Landmark, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  MapPin, 
  RefreshCw, 
  ExternalLink,
  Layers,
  TrendingUp,
  Search,
  Wallet as WalletIcon,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  MinusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { KPICard } from '../components/admin/KPICard';
import { MonumentFormModal } from '../components/admin/MonumentFormModal';
import { UserFormModal } from '../components/admin/UserFormModal';
import { TreasuryTransactionModal } from '../components/admin/TreasuryTransactionModal';
import { TreasuryEditModal } from '../components/admin/TreasuryEditModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ChartSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/Toast';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AnalyticsChart = lazy(() => import('../components/admin/AnalyticsChart'));
const AdminPredictionView = lazy(() => import('../components/AdminPredictionView'));

export default function AdminDashboard() {
  const location = useLocation();
  const { user: currentAdmin } = useAuth();

  const getInitialTab = () => {
    if (location.pathname.includes('/admin/monuments')) return 'monuments';
    if (location.pathname.includes('/admin/treasury')) return 'treasury';
    if (location.pathname.includes('/admin/queues')) return 'queues';
    if (location.pathname.includes('/admin/predictions')) return 'prediction';
    if (location.pathname.includes('/admin/users') || location.pathname.includes('/admin/rbac')) return 'users';
    return 'analytics';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'today', 'week', 'month'
  const [summary, setSummary] = useState(null);
  const [monuments, setMonuments] = useState([]);
  const [queueOverview, setQueueOverview] = useState([]);
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMonument, setEditingMonument] = useState(null);

  const [deletingMonument, setDeletingMonument] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [monumentSearch, setMonumentSearch] = useState('');

  // RBAC User Management State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);

  // Treasury State
  const [treasuryData, setTreasuryData] = useState(null);
  const [treasuryLoading, setTreasuryLoading] = useState(false);
  const [treasuryTxModalOpen, setTreasuryTxModalOpen] = useState(false);
  const [treasuryTxType, setTreasuryTxType] = useState('credit');
  const [editingTreasuryTx, setEditingTreasuryTx] = useState(null);
  const [reversingTx, setReversingTx] = useState(null);
  const [reversingLoading, setReversingLoading] = useState(false);
  const [isReconcileConfirmOpen, setIsReconcileConfirmOpen] = useState(false);
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [treasurySearch, setTreasurySearch] = useState('');
  const [treasuryFilter, setTreasuryFilter] = useState('all');

  const toast = useToast();

  useEffect(() => {
    if (location.pathname.includes('/admin/monuments')) setActiveTab('monuments');
    else if (location.pathname.includes('/admin/treasury')) setActiveTab('treasury');
    else if (location.pathname.includes('/admin/queues')) setActiveTab('queues');
    else if (location.pathname.includes('/admin/predictions')) setActiveTab('prediction');
    else if (location.pathname.includes('/admin/users') || location.pathname.includes('/admin/rbac')) setActiveTab('users');
  }, [location.pathname]);

  const loadTreasury = async (filter = treasuryFilter, search = treasurySearch) => {
    try {
      setTreasuryLoading(true);
      const res = await api.getTreasury({
        filterType: filter === 'all' ? undefined : filter,
        search: search.trim() || undefined,
        limit: 100,
      });
      if (res.success) {
        setTreasuryData(res.data);
      }
    } catch {
      // silently handle
    } finally {
      setTreasuryLoading(false);
    }
  };

  const loadData = async (range = timeRange) => {
    try {
      setRefreshing(true);
      let startDate = null;
      let endDate = null;

      if (range === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        startDate = todayStr;
        endDate = todayStr;
      } else if (range === 'week') {
        const d = new Date();
        endDate = d.toISOString().split('T')[0];
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString().split('T')[0];
      } else if (range === 'month') {
        const d = new Date();
        endDate = d.toISOString().split('T')[0];
        d.setDate(d.getDate() - 30);
        startDate = d.toISOString().split('T')[0];
      }

      const [sumRes, monRes, qRes, userRes, trRes] = await Promise.all([
        api.getAdminSummary(startDate, endDate),
        api.getAdminMonuments(),
        api.getAdminQueues(),
        api.getAdminUsers(),
        api.getTreasury(),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (monRes.success) setMonuments(monRes.data.monuments || monRes.data || []);
      if (qRes.success) setQueueOverview(qRes.data || []);
      if (userRes.success) setUsers(userRes.data || []);
      if (trRes?.success) setTreasuryData(trRes.data);
    } catch {
      toast.error('Could not refresh records.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(timeRange);
  }, []);

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
    loadData(newRange);
  };

  const openAddModal = () => {
    setEditingMonument(null);
    setIsModalOpen(true);
  };

  const openEditModal = (monument) => {
    setEditingMonument(monument);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMonument) return;
    setDeleteLoading(true);
    try {
      const res = await api.deleteMonument(deletingMonument._id);
      if (res.success) {
        toast.success(`Monument "${deletingMonument.name}" deleted.`);
        loadData();
      } else {
        toast.error(res.message || 'Could not delete monument.');
      }
    } catch {
      toast.error('Network error deleting monument.');
    } finally {
      setDeleteLoading(false);
      setDeletingMonument(null);
    }
  };

  const handleToggleActive = async (monument) => {
    try {
      const res = await api.updateMonument(monument._id, { isActive: !monument.isActive });
      if (res.success) {
        toast.success(`Status updated for ${monument.name}.`);
        loadData();
      } else {
        toast.error(res.message || 'Failed to update status.');
      }
    } catch {
      toast.error('Network error updating status.');
    }
  };

  const totalRevenue = summary?.totalRevenue ?? summary?.measured?.totalRevenue ?? 0;
  const totalTickets = summary?.totalTickets ?? summary?.measured?.totalTickets ?? 0;
  const totalMonumentsCount = summary?.totalMonuments ?? summary?.measured?.totalMonuments ?? monuments.length;
  const totalUsersCount = summary?.totalUsers ?? summary?.measured?.totalUsers ?? users.length;
  const validTickets = summary?.validTickets ?? summary?.measured?.validTickets ?? 0;
  const usedTickets = summary?.usedTickets ?? summary?.measured?.usedTickets ?? 0;
  const cancelledTickets = summary?.cancelledTickets ?? summary?.measured?.cancelledTickets ?? 0;

  const chartData = [
    { name: 'Total Bookings', value: totalTickets },
    { name: 'Confirmed', value: validTickets },
    { name: 'Checked In', value: usedTickets },
    { name: 'Cancelled', value: cancelledTickets },
  ];

  const filteredMonuments = monuments.filter((m) =>
    monumentSearch
      ? (m.name?.toLowerCase().includes(monumentSearch.toLowerCase()) ||
         m.location?.toLowerCase().includes(monumentSearch.toLowerCase()))
      : true
  );

  const openAddUserModal = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (u) => {
    setEditingUser(u);
    setIsUserModalOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteUserLoading(true);
    try {
      const res = await api.deleteAdminUser(deletingUser._id);
      if (res.success) {
        toast.success(res.message || 'User account deleted successfully.');
        loadData();
      } else {
        toast.error(res.message || 'Failed to delete user.');
      }
    } catch {
      toast.error('Network error deleting user.');
    } finally {
      setDeleteUserLoading(false);
      setDeletingUser(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = userSearch
      ? u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
      : true;
    const matchesRole =
      userRoleFilter === 'all'
        ? true
        : userRoleFilter === 'visitor'
        ? u.role === 'visitor' || u.role === 'user'
        : u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handleReconcile = async () => {
    try {
      setReconcileLoading(true);
      const res = await api.reconcileTreasury();
      if (res.success) {
        toast.success(`Treasury reconciled! Balance synced to ₹${(res.data?.currentBalance ?? 0).toLocaleString()}`);
        loadData();
        loadTreasury();
      } else {
        toast.error(res.message || 'Reconciliation failed.');
      }
    } catch {
      toast.error('Network error during reconciliation.');
    } finally {
      setReconcileLoading(false);
      setIsReconcileConfirmOpen(false);
    }
  };

  const handleConfirmReverseTx = async () => {
    if (!reversingTx) return;
    try {
      setReversingLoading(true);
      const res = await api.reverseTreasuryTransaction(reversingTx._id, {
        reason: 'Administrative reversal from Dashboard',
      });
      if (res.success) {
        toast.success('Transaction successfully reversed and ledger balance updated.');
        loadData();
        loadTreasury();
      } else {
        toast.error(res.message || 'Failed to reverse transaction.');
      }
    } catch {
      toast.error('Network error reversing transaction.');
    } finally {
      setReversingLoading(false);
      setReversingTx(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-sandstone-200 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-sans text-charcoal-900 flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-maroon-800" />
            <span>Dashboard</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Operations, analytics, and management overview
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          loading={refreshing}
          onClick={loadData}
          className="self-start sm:self-auto text-xs"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-sandstone-200 pb-2 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-maroon-800 text-white shadow-xs'
              : 'bg-white text-charcoal-700 hover:bg-sandstone-100 border border-sandstone-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Analytics
        </button>
        <button
          onClick={() => setActiveTab('monuments')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'monuments'
              ? 'bg-maroon-800 text-white shadow-xs'
              : 'bg-white text-charcoal-700 hover:bg-sandstone-100 border border-sandstone-200'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" /> Monuments ({monuments.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('treasury');
            loadTreasury();
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'treasury'
              ? 'bg-maroon-800 text-white shadow-xs'
              : 'bg-white text-charcoal-700 hover:bg-sandstone-100 border border-sandstone-200'
          }`}
        >
          <WalletIcon className="w-3.5 h-3.5" /> Treasury (₹{(treasuryData?.wallet?.balance ?? totalRevenue).toLocaleString()})
        </button>
        <button
          onClick={() => setActiveTab('queues')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'queues'
              ? 'bg-maroon-800 text-white shadow-xs'
              : 'bg-white text-charcoal-700 hover:bg-sandstone-100 border border-sandstone-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Queues
        </button>
        <button
          onClick={() => setActiveTab('prediction')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'prediction'
              ? 'bg-maroon-800 text-white shadow-xs'
              : 'bg-white text-charcoal-700 hover:bg-sandstone-100 border border-sandstone-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Forecasting
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-maroon-800 text-white shadow-xs'
              : 'bg-white text-charcoal-700 hover:bg-sandstone-100 border border-sandstone-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Staff & RBAC ({users.length})
        </button>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Time Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sandstone-50 p-3.5 rounded-2xl border border-sandstone-200">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-maroon-800" />
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-700">Analytics Range:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-sandstone-300 text-xs">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'Last 7 Days' },
                { id: 'month', label: 'Last 30 Days' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTimeRangeChange(t.id)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    timeRange === t.id
                      ? 'bg-maroon-800 text-white shadow-2xs font-bold'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab('treasury');
                loadTreasury();
              }}
              className="text-left block group w-full cursor-pointer"
            >
              <KPICard
                title="Treasury Revenue"
                value={`₹${totalRevenue.toLocaleString()}`}
                subtitle="From visitor bookings • Click to view treasury"
                icon={WalletIcon}
                variant="maroon"
              />
            </button>
            <KPICard
              title="Bookings"
              value={totalTickets}
              subtitle={`${usedTickets} visited`}
              icon={Ticket}
            />
            <KPICard
              title="Monuments"
              value={totalMonumentsCount}
              subtitle="in system"
              icon={Landmark}
            />
            <KPICard
              title="Users"
              value={totalUsersCount}
              subtitle="registered accounts"
              icon={Users}
            />
          </div>

          <div className="bg-white rounded-2xl border border-sandstone-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-700">
              Booking Overview
            </h3>
            <Suspense fallback={<ChartSkeleton />}>
              <AnalyticsChart chartData={chartData} />
            </Suspense>
          </div>
        </div>
      )}

      {/* TAB 2: MONUMENTS */}
      {activeTab === 'monuments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sandstone-50 p-4 rounded-2xl border border-sandstone-200">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Search..."
                value={monumentSearch}
                onChange={(e) => setMonumentSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white border border-sandstone-300 focus:outline-none focus:border-maroon-700"
              />
              <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <Button
              variant="primary"
              icon={Plus}
              size="sm"
              onClick={openAddModal}
            >
              Add Monument
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-sandstone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-sandstone-50 text-charcoal-700 uppercase font-bold border-b border-sandstone-200">
                    <th className="py-3 px-4">Monument</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Hours</th>
                    <th className="py-3 px-4">Capacity</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sandstone-100">
                  {filteredMonuments.map((m) => (
                    <tr key={m._id} className="hover:bg-sandstone-50/50">
                      <td className="py-3 px-4 font-bold text-charcoal-900 font-sans text-sm">
                        {m.name}
                      </td>
                      <td className="py-3 px-4 text-charcoal-600">
                        {m.location}
                      </td>
                      <td className="py-3 px-4 text-charcoal-600 font-mono">
                        {m.openingTime} – {m.closingTime}
                      </td>
                      <td className="py-3 px-4 font-semibold text-charcoal-800">
                        {m.capacity} / slot
                      </td>
                      <td className="py-3 px-4 font-bold text-maroon-900">
                        ₹{m.baseTicketPrice}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(m)}
                          className="cursor-pointer"
                        >
                          <StatusBadge type="monument" status={m.isActive} />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit3}
                          onClick={() => openEditModal(m)}
                          className="text-xs px-2"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeletingMonument(m)}
                          className="text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {filteredMonuments.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-charcoal-400">
                        No monuments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: TREASURY MANAGEMENT */}
      {activeTab === 'treasury' && (
        <div className="space-y-6">
          {/* Top Treasury Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Central Treasury Reserve"
              value={`₹${(treasuryData?.wallet?.balance ?? totalRevenue).toLocaleString()}`}
              subtitle="Current platform liquidity"
              icon={WalletIcon}
              variant="maroon"
            />
            <KPICard
              title="Ticket Revenue Inflow"
              value={`₹${(treasuryData?.metrics?.totalTicketRevenue ?? totalRevenue).toLocaleString()}`}
              subtitle={`${summary?.totalBookings ?? totalTickets} visitor bookings`}
              icon={TrendingUp}
            />
            <KPICard
              title="Capital Inflows / Grants"
              value={`₹${(treasuryData?.metrics?.totalGrants ?? 0).toLocaleString()}`}
              subtitle="State & preservation grants"
              icon={ArrowDownLeft}
            />
            <KPICard
              title="Maintenance Disbursed"
              value={`₹${(treasuryData?.metrics?.totalDisbursements ?? 0).toLocaleString()}`}
              subtitle="Restoration & site expenses"
              icon={ArrowUpRight}
            />
          </div>

          {/* Treasury Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sandstone-50 p-4 rounded-2xl border border-sandstone-200">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <input
                  type="text"
                  placeholder="Search ledger notes or refs..."
                  value={treasurySearch}
                  onChange={(e) => {
                    setTreasurySearch(e.target.value);
                    loadTreasury(treasuryFilter, e.target.value);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white border border-sandstone-300 focus:outline-none focus:border-maroon-700"
                />
                <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-sandstone-300 text-xs">
                {[
                  { id: 'all', label: 'All Entries' },
                  { id: 'revenue', label: 'Ticket Revenue' },
                  { id: 'grant', label: 'Grants & Inflows' },
                  { id: 'maintenance', label: 'Disbursements' },
                  { id: 'refund', label: 'Refunds' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setTreasuryFilter(f.id);
                      loadTreasury(f.id, treasurySearch);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      treasuryFilter === f.id
                        ? 'bg-maroon-800 text-white shadow-2xs'
                        : 'text-charcoal-600 hover:text-charcoal-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                onClick={() => setIsReconcileConfirmOpen(true)}
                title="Synchronize treasury balance with verified tickets and transactions"
              >
                Reconcile Treasury
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setTreasuryTxType('credit');
                  setTreasuryTxModalOpen(true);
                }}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
                Record Allocation
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={MinusCircle}
                onClick={() => {
                  setTreasuryTxType('debit');
                  setTreasuryTxModalOpen(true);
                }}
                className="bg-rose-700 hover:bg-rose-800"
              >
                Disburse Funds
              </Button>
            </div>
          </div>

          {/* Monument Revenue Contribution Table */}
          <div className="bg-white rounded-2xl border border-sandstone-200 shadow-xs p-5 space-y-3">
            <h3 className="text-sm font-bold font-sans text-charcoal-900 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-maroon-800" />
              <span>Monument Site Revenue Distribution</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-sandstone-50 text-charcoal-700 uppercase font-bold border-b border-sandstone-200">
                    <th className="py-2.5 px-3">Heritage Site</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Bookings</th>
                    <th className="py-2.5 px-3">Visitors</th>
                    <th className="py-2.5 px-3 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sandstone-100">
                  {(treasuryData?.monumentBreakdown || []).map((m) => (
                    <tr key={m.monumentId || m.name} className="hover:bg-sandstone-50/50">
                      <td className="py-2.5 px-3 font-bold text-charcoal-900">{m.name}</td>
                      <td className="py-2.5 px-3 text-charcoal-600">{m.location}</td>
                      <td className="py-2.5 px-3 font-semibold text-charcoal-800">{m.bookingsCount}</td>
                      <td className="py-2.5 px-3 text-charcoal-600">{m.visitorsCount}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-maroon-900">
                        ₹{Number(m.revenue || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {(!treasuryData?.monumentBreakdown || treasuryData.monumentBreakdown.length === 0) && (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-charcoal-400">
                        No monument revenue records yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Treasury Ledger Transactions */}
          <div className="bg-white rounded-2xl border border-sandstone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-sandstone-200 flex items-center justify-between">
              <h3 className="text-sm font-bold font-sans text-charcoal-900">
                Official Treasury Ledger ({treasuryData?.transactions?.length ?? 0} records)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-sandstone-50 text-charcoal-700 uppercase font-bold border-b border-sandstone-200">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Flow Type</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description & Ref</th>
                    <th className="py-3 px-4">Monument Site</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-right">Balance After</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sandstone-100">
                  {(treasuryData?.transactions || []).map((tx) => {
                    const isCredit = tx.type === 'credit';
                    const isReversible = tx.status !== 'reversed' && tx.status !== 'cancelled' && !['ticket_revenue', 'ticket_refund'].includes(tx.purpose);
                    return (
                      <tr key={tx._id} className="hover:bg-sandstone-50/50">
                        <td className="py-3 px-4 text-charcoal-500 font-mono text-[11px]">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                              isCredit
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {isCredit ? '+' : '–'} {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold capitalize text-charcoal-800">
                            {tx.purpose?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-medium text-charcoal-900 line-clamp-1">{tx.description}</div>
                          {tx.referenceId && (
                            <div className="text-[10px] text-charcoal-400 font-mono">Ref: {tx.referenceId}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-charcoal-600">
                          {tx.monumentId?.name || '—'}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold text-sm ${isCredit ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isCredit ? '+' : '–'}₹{Number(tx.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-charcoal-600">
                          ₹{Number(tx.balanceAfter || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit3}
                            onClick={() => setEditingTreasuryTx(tx)}
                            className="text-xs px-2"
                            title="Edit notes"
                          >
                            Edit
                          </Button>
                          {isReversible && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={RotateCcw}
                              onClick={() => setReversingTx(tx)}
                              className="text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              title="Reverse transaction"
                            >
                              Reverse
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(!treasuryData?.transactions || treasuryData.transactions.length === 0) && (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-charcoal-400">
                        No transactions recorded in the Treasury ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QUEUES */}
      {activeTab === 'queues' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queueOverview.map((item) => (
              <div
                key={item.monumentId}
                className="bg-white rounded-2xl border border-sandstone-200 shadow-xs p-5 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-base font-sans text-charcoal-900">{item.name}</h3>
                    <StatusBadge type="monument" status={item.isActive} />
                  </div>
                  <p className="text-xs text-charcoal-500">{item.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-sandstone-50 p-3 rounded-xl border border-sandstone-200">
                    <div className="text-[10px] uppercase font-bold text-charcoal-500">Now Serving</div>
                    <div className="text-xl font-bold font-sans text-maroon-900 mt-0.5">
                      {item.currentServing ? `#${item.currentServing}` : '--'}
                    </div>
                  </div>
                  <div className="bg-sandstone-50 p-3 rounded-xl border border-sandstone-200">
                    <div className="text-[10px] uppercase font-bold text-charcoal-500">In Queue</div>
                    <div className="text-xl font-bold font-sans text-charcoal-900 mt-0.5">
                      {item.waitingCount}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <a
                    href={`/queue/${item.monumentId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1"
                  >
                    <Button variant="secondary" size="sm" icon={ExternalLink} fullWidth className="text-xs">
                      Kiosk
                    </Button>
                  </a>
                  <a
                    href="/staff/queue"
                    className="flex-1"
                  >
                    <Button variant="primary" size="sm" fullWidth className="text-xs">
                      Counter
                    </Button>
                  </a>
                </div>
              </div>
            ))}

            {queueOverview.length === 0 && (
              <div className="col-span-full bg-white p-8 text-center rounded-2xl border border-sandstone-200 text-charcoal-400 text-sm">
                No active queues found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PREDICTIONS */}
      {activeTab === 'prediction' && (
        <div className="bg-white rounded-2xl border border-sandstone-200 p-6 shadow-xs">
          <Suspense fallback={<TableSkeleton rows={3} cols={4} />}>
            <AdminPredictionView />
          </Suspense>
        </div>
      )}

      {/* TAB 5: STAFF & RBAC USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Top User Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Accounts"
              value={users.length}
              subtitle="Registered in system"
              icon={Users}
            />
            <KPICard
              title="Site Staff"
              value={users.filter((u) => u.role === 'staff').length}
              subtitle="Stationed at monuments"
              icon={Landmark}
              variant="maroon"
            />
            <KPICard
              title="Administrators"
              value={users.filter((u) => u.role === 'admin').length}
              subtitle="System management"
              icon={ShieldCheck}
            />
            <KPICard
              title="Visitors / Users"
              value={users.filter((u) => u.role === 'visitor').length}
              subtitle="Public ticket accounts"
              icon={UserCheck}
            />
          </div>

          {/* User Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sandstone-50 p-4 rounded-2xl border border-sandstone-200">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white border border-sandstone-300 focus:outline-none focus:border-maroon-700"
                />
                <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-sandstone-300 text-xs">
                {['all', 'staff', 'admin', 'visitor'].map((roleKey) => (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => setUserRoleFilter(roleKey)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer capitalize ${
                      userRoleFilter === roleKey
                        ? 'bg-maroon-800 text-white shadow-2xs'
                        : 'text-charcoal-600 hover:text-charcoal-900'
                    }`}
                  >
                    {roleKey === 'visitor' ? 'Users' : roleKey}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              icon={Plus}
              size="sm"
              onClick={openAddUserModal}
            >
              Add User / Staff
            </Button>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-2xl border border-sandstone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-sandstone-50 text-charcoal-700 uppercase font-bold border-b border-sandstone-200">
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Stationed Monument Site</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sandstone-100">
                  {filteredUsers.map((u) => {
                    const isSelf = currentAdmin?._id === u._id || currentAdmin?.email === u.email;
                    return (
                      <tr key={u._id} className="hover:bg-sandstone-50/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                u.role === 'admin'
                                  ? 'bg-maroon-100 text-maroon-900'
                                  : u.role === 'staff'
                                  ? 'bg-blue-100 text-blue-900'
                                  : 'bg-sandstone-200 text-charcoal-800'
                              }`}
                            >
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-charcoal-900 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-maroon-100 text-maroon-800 font-bold">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-charcoal-500 font-mono">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] capitalize ${
                              u.role === 'admin'
                                ? 'bg-maroon-800 text-white'
                                : u.role === 'staff'
                                ? 'bg-sky-100 text-sky-900 border border-sky-300'
                                : 'bg-sandstone-100 text-charcoal-700 border border-sandstone-300'
                            }`}
                          >
                            {u.role === 'admin' ? (
                              <ShieldCheck className="w-3 h-3 text-gold-300" />
                            ) : u.role === 'staff' ? (
                              <Landmark className="w-3 h-3 text-sky-700" />
                            ) : null}
                            <span>{u.role === 'visitor' ? 'User' : u.role}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {u.role === 'staff' ? (
                            u.assignedMonument ? (
                              <div className="flex items-center gap-1.5">
                                <Landmark className="w-3.5 h-3.5 text-maroon-800 shrink-0" />
                                <span className="font-semibold text-charcoal-900">
                                  {u.assignedMonument.name}
                                </span>
                                {u.assignedMonument.location && (
                                  <span className="text-charcoal-400 text-[11px]">
                                    ({u.assignedMonument.location})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                                <AlertCircle className="w-3 h-3" />
                                <span>Unallocated</span>
                              </span>
                            )
                          ) : u.role === 'admin' ? (
                            <span className="text-charcoal-400 italic">
                              Universal Site Access
                            </span>
                          ) : (
                            <span className="text-charcoal-400">
                              — (Public Visitor)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-charcoal-500 font-mono text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </td>

                        <td className="py-3 px-4 text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit3}
                            onClick={() => openEditUserModal(u)}
                            className="text-xs px-2"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            disabled={isSelf}
                            onClick={() => setDeletingUser(u)}
                            className={`text-xs px-2 ${
                              isSelf
                                ? 'text-charcoal-300 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                            }`}
                            title={isSelf ? 'Cannot delete your own account' : 'Delete user'}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-charcoal-400">
                        No users match the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <MonumentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        monument={editingMonument}
        onSuccess={(msg) => {
          toast.success(msg);
          loadData();
        }}
      />

      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={editingUser}
        monuments={monuments}
        onSuccess={loadData}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingMonument)}
        onClose={() => setDeletingMonument(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Monument?"
        message={`Delete "${deletingMonument?.name}" permanently?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteLoading}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDeleteUser}
        title="Delete User Account?"
        message={`Permanently remove user "${deletingUser?.name}" (${deletingUser?.email})? This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Cancel"
        variant="danger"
        loading={deleteUserLoading}
      />

      <TreasuryTransactionModal
        isOpen={treasuryTxModalOpen}
        onClose={() => setTreasuryTxModalOpen(false)}
        initialType={treasuryTxType}
        monuments={monuments}
        currentBalance={treasuryData?.wallet?.balance ?? totalRevenue}
        onSuccess={(msg) => {
          toast.success(msg);
          loadData();
          loadTreasury();
        }}
      />

      <TreasuryEditModal
        isOpen={Boolean(editingTreasuryTx)}
        onClose={() => setEditingTreasuryTx(null)}
        transaction={editingTreasuryTx}
        onSuccess={(msg) => {
          toast.success(msg);
          loadTreasury();
        }}
      />

      <ConfirmDialog
        isOpen={isReconcileConfirmOpen}
        onClose={() => setIsReconcileConfirmOpen(false)}
        onConfirm={handleReconcile}
        title="Reconcile Central Treasury?"
        message="This will audit all confirmed and visited ticket bookings, grants, and maintenance debits to ensure 100% data consistency and balance synchronization. Proceed?"
        confirmText="Run Audit & Reconcile"
        cancelText="Cancel"
        loading={reconcileLoading}
      />

      <ConfirmDialog
        isOpen={Boolean(reversingTx)}
        onClose={() => setReversingTx(null)}
        onConfirm={handleConfirmReverseTx}
        title="Reverse Treasury Transaction?"
        message={`Reverse transaction "${reversingTx?.description}" for ₹${(reversingTx?.amount ?? 0).toLocaleString()}? This will update the official balance.`}
        confirmText="Reverse Entry"
        cancelText="Cancel"
        variant="danger"
        loading={reversingLoading}
      />

    </div>
  );
}