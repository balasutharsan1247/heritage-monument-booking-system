import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.login({ email, password });
      if (res.success) {
        login(res.data, res.data.token);
        navigate('/');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white dark:bg-maroon-900 p-8 rounded-2xl shadow-xl border border-maroon-100 dark:border-maroon-800">
      <h2 className="text-3xl font-extrabold mb-6 text-maroon-800 dark:text-maroon-50 text-center">Welcome Back</h2>
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 border border-red-200 font-medium text-center">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-1 text-maroon-900 dark:text-maroon-100">Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 border rounded-lg dark:bg-maroon-950 dark:border-maroon-700 focus:ring-2 focus:ring-maroon-500 focus:outline-none transition-shadow" placeholder="john@example.com" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1 text-maroon-900 dark:text-maroon-100">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 border rounded-lg dark:bg-maroon-950 dark:border-maroon-700 focus:ring-2 focus:ring-maroon-500 focus:outline-none transition-shadow" placeholder="••••••••" />
        </div>
        <button type="submit" className="w-full bg-maroon-700 text-white p-3 rounded-lg hover:bg-maroon-600 font-bold shadow-md transition-colors text-lg mt-2">Login</button>
      </form>
    </div>
  );
}