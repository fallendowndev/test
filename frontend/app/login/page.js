'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useNotification();

  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginField.trim() || !password) {
      toast.warning('Please enter both your login and password.');
      return;
    }

    try {
      setLoading(true);
      await login(loginField.trim(), password);
      toast.success('Signed in successfully!');
      router.push('/');
      router.refresh();
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="bg-[#0d0d11] p-6 sm:p-8 rounded-2xl border border-white/5 w-full max-w-md shadow-2xl shadow-black space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-black font-extrabold text-2xl shadow-lg">
            JB
          </div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Sign In to Just Blog!</h1>
          <p className="text-xs text-zinc-400">
            Welcome back to the authentic discussion community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-field"
              className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
            >
              Username or Email
            </label>
            <input
              id="login-field"
              type="text"
              value={loginField}
              onChange={(e) => setLoginField(e.target.value)}
              placeholder="e.g. johndoe or name@example.com"
              required
              autoFocus
              className="w-full bg-[#141419] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 outline-none transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#141419] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !loginField.trim() || !password}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-all disabled:opacity-40 cursor-pointer shadow-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="pt-4 border-t border-white/5 text-center text-xs text-zinc-500">
          New to Just Blog!?{' '}
          <Link href="/register" className="text-white font-bold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
