import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Landmark, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'visitor',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.register(formData);
      if (res.success) {
        toast.success('Account created. Please sign in.');
        navigate('/login');
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await api.googleLogin(credentialResponse.credential);
      if (res.success) {
        login(res.data, res.data.token);
        toast.success(`Account registered for ${res.data.name}`);
        navigate('/');
      } else {
        setError(res.message || 'Google sign-in failed.');
      }
    } catch {
      setError('Google authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto my-10">
      <div className="bg-white rounded-2xl border border-sandstone-200 shadow-sm p-7 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-maroon-800 text-gold-400 flex items-center justify-center mx-auto mb-2 shadow-xs">
            <Landmark className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-charcoal-900">
            Create Account
          </h2>
          <p className="text-xs text-charcoal-500">
            Register for online monument reservations
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Full Name"
            type="text"
            required
            icon={User}
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Email"
            type="email"
            required
            icon={Mail}
            placeholder="name@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'visitor', label: 'Visitor' },
              { value: 'staff', label: 'Staff' },
              { value: 'admin', label: 'Admin' },
            ]}
          />

          <Input
            label="Password"
            type="password"
            required
            icon={Lock}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={ArrowRight}
            iconPosition="right"
            className="mt-2"
          >
            {loading ? 'Creating...' : 'Register'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-sandstone-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-charcoal-400">or</span>
          </div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-in failed')}
            shape="pill"
            width="100%"
          />
        </div>

        <div className="text-center pt-2 border-t border-sandstone-100 text-xs text-charcoal-600">
          <span>Already registered? </span>
          <Link to="/login" className="font-bold text-maroon-800 hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}