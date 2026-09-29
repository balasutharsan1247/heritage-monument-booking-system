import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'visitor' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.googleLogin(credentialResponse.credential);
      if (res.success) {
        login(res.data, res.data.token);
        navigate('/');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Google login failed');
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
          <label className="block text-sm font-semibold mb-1">Role</label>
          <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-3 border rounded-lg dark:bg-maroon-950 dark:border-maroon-700 focus:ring-2 focus:ring-maroon-500 outline-none">
            <option value="visitor">Visitor</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Password</label>
          <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="w-full p-3 border rounded-lg dark:bg-maroon-950 dark:border-maroon-700 focus:ring-2 focus:ring-maroon-500 outline-none" placeholder="••••••••" />
        </div>
        <button type="submit" className="w-full bg-maroon-700 text-white p-3 rounded-lg hover:bg-maroon-600 font-bold shadow-md transition-colors text-lg mt-2">Sign Up</button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-maroon-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-maroon-900 text-gray-500 dark:text-maroon-200">Or continue with</span>
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google login failed')}
          />
        </div>
      </div>
    </div>
  );
}