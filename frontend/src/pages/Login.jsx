import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Landmark, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { Logo } from '../components/layout/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login({ email, password });
      if (res.success) {
        login(res.data, res.data.token);
        toast.success(`Welcome, ${res.data.name}`);
        navigate(res.data.role === 'admin' ? '/admin/dashboard' : res.data.role === 'staff' ? '/staff/queue' : '/');
      } else {
        setError(res.message || 'Invalid email or password');
      }
    } catch {
      setError('Network error during authentication.');
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
        toast.success(`Signed in as ${res.data.name}`);
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
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white rounded-3xl border border-sandstone-200 shadow-heritage p-8 sm:p-9 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo variant="light" size="md" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight font-sans">
            Sign In to Account
          </h2>
          <p className="text-xs text-charcoal-500 max-w-xs mx-auto">
            Access your reserved monument passes, virtual queue tokens, and wallet balance
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            icon={Mail}
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            required
            icon={Lock}
            rightIcon={showPassword ? EyeOff : Eye}
            onRightIconClick={() => setShowPassword(!showPassword)}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="pt-1">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={ArrowRight}
              iconPosition="right"
              className="py-3 font-semibold shadow-xs"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-sandstone-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-charcoal-400 font-medium">or continue with</span>
          </div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-in failed')}
            shape="pill"
            width="320"
          />
        </div>

        <div className="text-center pt-2 border-t border-sandstone-100 text-xs text-charcoal-600">
          <span>Don't have an account? </span>
          <Link to="/register" className="font-bold text-maroon-800 hover:underline">
            Register Account
          </Link>
        </div>

      </div>
    </div>
  );
}