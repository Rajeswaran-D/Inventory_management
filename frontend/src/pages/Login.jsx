import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

export const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        toast.success(`Welcome, ${response.user.name}!`);
        setIsAuthenticated(true);
        navigate('/');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Swamy Envelope</h1>
            <p className="text-sm text-gray-500 mt-2 font-medium">Secure Access Portal</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2 animate-pulse">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:border-green-500 transition-all text-sm font-medium disabled:bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:border-green-500 transition-all text-sm font-medium disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 rounded-lg transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Verifying...</span>
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Secure Business Portal</p>
          </div>
        </div>
      </div>
    </div>
  );
};
