import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'visitor' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.register(formData);
      if (res.success) {
        navigate('/login');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white dark:bg-maroon-900 p-8 rounded-2xl shadow-xl border border-maroon-100 dark:border-maroon-800">
      <h2 className="text-3xl font-extrabold mb-6 text-maroon-800 dark:text-maroon-50 text-center">Create Account</h2>
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 border border-red-200 font-medium text-center">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-1">Full Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full p-3 border rounded-lg dark:bg-maroon-950 dark:border-maroon-700 focus:ring-2 focus:ring-maroon-500 outline-none" placeholder="John Doe" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Email Address</label>
          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="w-full p-3 border rounded-lg dark:bg-maroon-950 dark:border-maroon-700 focus:ring-2 focus:ring-maroon-500 outline-none" placeholder="john@example.com" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Password</label>
          <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="w-full p-3 border rounded-lg dark:bg-maroon-950 dark:border-maroon-700 focus:ring-2 focus:ring-maroon-500 outline-none" placeholder="••••••••" />
        </div>
        <button type="submit" className="w-full bg-maroon-700 text-white p-3 rounded-lg hover:bg-maroon-600 font-bold shadow-md transition-colors text-lg mt-2">Sign Up</button>
      </form>
    </div>
  );
}