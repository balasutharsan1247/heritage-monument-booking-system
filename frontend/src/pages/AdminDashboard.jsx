import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import AdminPredictionView from '../components/AdminPredictionView';
import { Activity, Ticket, Users, Landmark } from 'lucide-react';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminSummary().then(res => {
      if (res.success) setSummary(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-xl font-bold animate-pulse">Loading analytics...</div>;
  if (!summary) return <div className="p-12 text-center text-red-500 font-bold">Failed to load dashboard data</div>;

  const chartData = [
    { name: 'Total Tickets', value: summary.totalTickets || 0 },
    { name: 'Valid', value: summary.validTickets || 0 },
    { name: 'Used', value: summary.usedTickets || 0 },
    { name: 'Cancelled', value: summary.cancelledTickets || 0 },
  ];

  const COLORS = ['#9f293b', '#22c55e', '#64748b', '#ef4444'];

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 border-b-2 border-maroon-100 dark:border-maroon-800 pb-4">
        <Activity className="w-8 h-8 text-maroon-700" />
        <h1 className="text-4xl font-black text-maroon-800 dark:text-maroon-50">Admin Overview</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-maroon-700 to-maroon-900 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
          <Activity className="absolute right-[-10px] bottom-[-10px] w-24 h-24 opacity-10" />
          <div className="text-sm font-bold uppercase tracking-wider mb-2 opacity-80">Total Revenue</div>
          <div className="text-4xl font-black">₹{summary.totalRevenue || 0}</div>
        </div>
        <div className="bg-white dark:bg-maroon-900 p-6 rounded-2xl shadow-lg border border-maroon-100 dark:border-maroon-800 relative overflow-hidden">
          <Ticket className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-maroon-100 dark:text-maroon-800 opacity-50" />
          <div className="text-sm font-bold uppercase tracking-wider mb-2 text-maroon-600 dark:text-maroon-400">Total Bookings</div>
          <div className="text-4xl font-black text-maroon-900 dark:text-maroon-50">{summary.totalTickets || 0}</div>
        </div>
        <div className="bg-white dark:bg-maroon-900 p-6 rounded-2xl shadow-lg border border-maroon-100 dark:border-maroon-800 relative overflow-hidden">
          <Landmark className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-maroon-100 dark:text-maroon-800 opacity-50" />
          <div className="text-sm font-bold uppercase tracking-wider mb-2 text-maroon-600 dark:text-maroon-400">Active Monuments</div>
          <div className="text-4xl font-black text-maroon-900 dark:text-maroon-50">{summary.totalMonuments || 0}</div>
        </div>
        <div className="bg-white dark:bg-maroon-900 p-6 rounded-2xl shadow-lg border border-maroon-100 dark:border-maroon-800 relative overflow-hidden">
          <Users className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-maroon-100 dark:text-maroon-800 opacity-50" />
          <div className="text-sm font-bold uppercase tracking-wider mb-2 text-maroon-600 dark:text-maroon-400">Registered Users</div>
          <div className="text-4xl font-black text-maroon-900 dark:text-maroon-50">{summary.totalUsers || 0}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-maroon-900 p-8 rounded-2xl shadow-lg border border-maroon-100 dark:border-maroon-800">
          <h2 className="text-2xl font-black mb-8 text-maroon-900 dark:text-maroon-50">Ticket Statistics</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis dataKey="name" stroke="currentColor" className="text-xs font-bold" />
                <YAxis stroke="currentColor" className="text-xs font-bold" />
                <Tooltip cursor={{fill: 'rgba(159, 41, 59, 0.05)'}} contentStyle={{backgroundColor: '#712330', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold'}} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-maroon-900 p-8 rounded-2xl shadow-lg border border-maroon-100 dark:border-maroon-800">
          <h2 className="text-2xl font-black mb-8 text-maroon-900 dark:text-maroon-50">Prediction Overview</h2>
          <div className="border border-maroon-100 dark:border-maroon-800 rounded-xl overflow-hidden shadow-inner bg-gray-50 dark:bg-maroon-950">
            {/* Incorporating the existing Prediction Module */}
            <AdminPredictionView />
          </div>
        </div>
      </div>
    </div>
  );
}