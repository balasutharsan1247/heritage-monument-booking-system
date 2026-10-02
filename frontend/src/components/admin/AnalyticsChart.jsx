import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function AnalyticsChart({ chartData = [], colors = ['#852535', '#059669', '#2563eb', '#dc2626'] }) {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-charcoal-400 text-sm font-medium">
        No booking data available for analytics chart.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#5e5e6b" 
            className="text-xs font-semibold" 
            tickLine={false}
          />
          <YAxis 
            stroke="#5e5e6b" 
            className="text-xs font-semibold" 
            allowDecimals={false} 
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(133, 37, 53, 0.05)' }}
            contentStyle={{
              backgroundColor: '#1b1b1e',
              color: '#ffffff',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
