'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !displayName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
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
          <h1 className="text-2xl font-bold text-[#1c1c1c]">Create your account</h1>
          <p className="text-xs text-[#7c7c7c] mt-1">
            Join the Just Blog! community to publish posts, comment, and vote.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 rounded text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label
              htmlFor="reg-username"
              className="block text-xs font-semibold text-[#7c7c7c] uppercase mb-1"
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
              className="w-full border border-[#ccc] rounded px-3 py-2 text-sm focus:border-[#0079d3] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="reg-display-name"
              className="block text-xs font-semibold text-[#7c7c7c] uppercase mb-1"
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
              className="w-full border border-[#ccc] rounded px-3 py-2 text-sm focus:border-[#0079d3] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-semibold text-[#7c7c7c] uppercase mb-1"
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
              className="w-full border border-[#ccc] rounded px-3 py-2 text-sm focus:border-[#0079d3] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-xs font-semibold text-[#7c7c7c] uppercase mb-1"
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
              className="w-full border border-[#ccc] rounded px-3 py-2 text-sm focus:border-[#0079d3] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !email.trim() || !password}
            className="w-full py-2.5 px-4 rounded-full bg-[#0079d3] hover:bg-[#006cbd] text-white font-semibold text-sm transition-colors disabled:opacity-50 mt-3"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#edeff1] text-center text-xs text-[#7c7c7c]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#0079d3] font-semibold hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
