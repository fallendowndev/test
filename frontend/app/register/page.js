'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { toast } = useNotification();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !displayName.trim() || !email.trim() || !password) {
      toast.warning('Please fill in all registration fields.');
      return;
    }

    if (password.length < 8) {
      toast.warning('Password must be at least 8 characters.');
      return;
    }

    try {
      setLoading(true);
      await register({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      toast.success('Account created! Welcome to Just Blog!');
      router.push('/');
      router.refresh();
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="bg-[#0d0d11] p-6 sm:p-8 rounded-2xl border border-white/5 w-full max-w-md shadow-2xl shadow-black space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-black font-extrabold text-2xl shadow-lg">
            JB
          </div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Create your account</h1>
          <p className="text-xs text-zinc-400">
            Join the community to publish posts, comment, and vote.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label
              htmlFor="reg-username"
              className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1"
            >
              Username (lowercase, letters, numbers, _)
            </label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="e.g. johndoe"
              pattern="^[a-zA-Z0-9_]+$"
              minLength={3}
              maxLength={30}
              required
              className="w-full bg-[#141419] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 outline-none transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="reg-display-name"
              className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1"
            >
              Display Name
            </label>
            <input
              id="reg-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. John Doe"
              maxLength={50}
              required
              className="w-full bg-[#141419] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 outline-none transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1"
            >
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@example.com"
              required
              className="w-full bg-[#141419] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 outline-none transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1"
            >
              Password (min 8 characters)
            </label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              required
              className="w-full bg-[#141419] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !email.trim() || !password}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-all disabled:opacity-40 cursor-pointer shadow-sm mt-1"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="pt-4 border-t border-white/5 text-center text-xs text-zinc-500">
          Already registered?{' '}
          <Link href="/login" className="text-white font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
