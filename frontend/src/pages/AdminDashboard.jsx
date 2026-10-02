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
  Wallet as WalletIcon
} from 'lucide-react';
import { KPICard } from '../components/admin/KPICard';
import { MonumentFormModal } from '../components/admin/MonumentFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ChartSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/Toast';
import { useLocation, Link } from 'react-router-dom';

const AnalyticsChart = lazy(() => import('../components/admin/AnalyticsChart'));
const AdminPredictionView = lazy(() => import('../components/AdminPredictionView'));

export default function AdminDashboard() {
  const location = useLocation();
  const getInitialTab = () => {
    if (location.pathname.includes('/admin/monuments')) return 'monuments';
    if (location.pathname.includes('/admin/queues')) return 'queues';
    if (location.pathname.includes('/admin/predictions')) return 'prediction';
    return 'analytics';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [summary, setSummary] = useState(null);
  const [monuments, setMonuments] = useState([]);
  const [queueOverview, setQueueOverview] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMonument, setEditingMonument] = useState(null);

  const [deletingMonument, setDeletingMonument] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [monumentSearch, setMonumentSearch] = useState('');

  const toast = useToast();

  useEffect(() => {
    if (location.pathname.includes('/admin/monuments')) setActiveTab('monuments');
    else if (location.pathname.includes('/admin/queues')) setActiveTab('queues');
    else if (location.pathname.includes('/admin/predictions')) setActiveTab('prediction');
  }, [location.pathname]);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [sumRes, monRes, qRes] = await Promise.all([
        api.getAdminSummary(),
        api.getAdminMonuments(),
        api.getAdminQueues(),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (monRes.success) setMonuments(monRes.data.monuments || monRes.data || []);
      if (qRes.success) setQueueOverview(qRes.data || []);
    } catch {
      toast.error('Could not refresh records.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
  const totalUsersCount = summary?.totalUsers ?? summary?.measured?.totalUsers ?? 0;
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
    monumentSearch ? m.name.toLowerCase().includes(monumentSearch.toLowerCase()) || m.location.toLowerCase().includes(monumentSearch.toLowerCase()) : true
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-sandstone-200 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-charcoal-900 flex items-center gap-2">
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
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/wallet" className="block group">
              <KPICard
                title="Treasury Revenue"
                value={`₹${totalRevenue.toLocaleString()}`}
                subtitle={summary?.treasuryBalance !== undefined ? `Treasury: ₹${summary.treasuryBalance.toLocaleString()} • Click to view` : "from bookings"}
                icon={WalletIcon}
                variant="maroon"
              />
            </Link>
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
                      <td className="py-3 px-4 font-bold text-charcoal-900 font-serif text-sm">
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

      {/* TAB 3: QUEUES */}
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
                    <h3 className="font-bold text-base font-serif text-charcoal-900">{item.name}</h3>
                    <StatusBadge type="monument" status={item.isActive} />
                  </div>
                  <p className="text-xs text-charcoal-500">{item.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-sandstone-50 p-3 rounded-xl border border-sandstone-200">
                    <div className="text-[10px] uppercase font-bold text-charcoal-500">Now Serving</div>
                    <div className="text-xl font-bold font-serif text-maroon-900 mt-0.5">
                      {item.currentServing ? `#${item.currentServing}` : '--'}
                    </div>
                  </div>
                  <div className="bg-sandstone-50 p-3 rounded-xl border border-sandstone-200">
                    <div className="text-[10px] uppercase font-bold text-charcoal-500">In Queue</div>
                    <div className="text-xl font-bold font-serif text-charcoal-900 mt-0.5">
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

      <MonumentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        monument={editingMonument}
        onSuccess={(msg) => {
          toast.success(msg);
          loadData();
        }}
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

    </div>
  );
}