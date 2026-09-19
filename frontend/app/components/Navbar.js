'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import SearchBar from './SearchBar';
import { Plus, ChevronDown, User, Settings, FileText, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-[var(--color-border)] sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-4 h-12 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 no-underline">
          <div className="w-8 h-8 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">JB</span>
          </div>
          <span className="text-lg font-bold text-[var(--foreground)] hidden sm:block">
            Just Blog!
          </span>
        </Link>

        <div className="flex-1 max-w-xl">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {loading ? (
            <div className="w-20 h-8 bg-gray-100 rounded animate-pulse" />
          ) : user ? (
            <>
              <Link
                href="/create"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 border border-[var(--color-border)] rounded-full text-sm font-medium text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] no-underline transition-colors"
              >
                <Plus size={16} />
                Create
              </Link>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
                >
                  <Avatar src={user.avatar} username={user.username} size={28} />
                  <span className="text-sm font-medium hidden sm:block">{user.displayName}</span>
                  <ChevronDown size={12} />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-[var(--color-border)] rounded shadow-lg z-50">
                      <Link
                        href={`/profile/${user.username}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-surface-hover)] no-underline text-[var(--foreground)]"
                        onClick={() => setMenuOpen(false)}
                      >
                        <User size={14} />
                        My Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-surface-hover)] no-underline text-[var(--foreground)]"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Settings size={14} />
                        Settings
                      </Link>
                      <Link
                        href="/create"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-surface-hover)] no-underline text-[var(--foreground)] sm:hidden"
                        onClick={() => setMenuOpen(false)}
                      >
                        <FileText size={14} />
                        Create Post
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-surface-hover)] no-underline text-[var(--color-primary)] font-semibold"
                          onClick={() => setMenuOpen(false)}
                        >
                          <LayoutDashboard size={14} />
                          Admin Dashboard
                        </Link>
                      )}
                      <hr className="border-[var(--color-border)]" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-surface-hover)] text-[var(--color-danger)] cursor-pointer"
                      >
                        <LogOut size={14} />
                        Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-1.5 text-sm font-bold text-[var(--color-primary)] border border-[var(--color-primary)] rounded-full hover:bg-blue-50 no-underline transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 text-sm font-bold text-white bg-[var(--color-primary)] rounded-full hover:bg-[var(--color-primary-hover)] no-underline transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
