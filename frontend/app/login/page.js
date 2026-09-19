'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginField.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(loginField.trim(), password);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="card bg-white p-6 sm:p-8 rounded-lg border border-[#ccc] w-full max-w-md shadow-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#ff4500] text-white font-black text-2xl mb-3">
            J
          </div>
          <h1 className="text-2xl font-bold text-[#1c1c1c]">Log In to Just Blog!</h1>
          <p className="text-xs text-[#7c7c7c] mt-1">
            By continuing, you agree to our User Agreement and Privacy Policy.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 rounded text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-field"
              className="block text-xs font-semibold text-[#7c7c7c] uppercase mb-1"
            >
              Username or Email
            </label>
            <input
              id="login-field"
              type="text"
              value={loginField}
              onChange={(e) => setLoginField(e.target.value)}
              placeholder="Username or email"
              required
              autoFocus
              className="w-full border border-[#ccc] rounded px-3 py-2 text-sm focus:border-[#0079d3] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-[#7c7c7c] uppercase mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full border border-[#ccc] rounded px-3 py-2 text-sm focus:border-[#0079d3] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !loginField.trim() || !password}
            className="w-full py-2.5 px-4 rounded-full bg-[#0079d3] hover:bg-[#006cbd] text-white font-semibold text-sm transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#edeff1] text-center text-xs text-[#7c7c7c]">
          New to Just Blog!?{' '}
          <Link href="/register" className="text-[#0079d3] font-semibold hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
