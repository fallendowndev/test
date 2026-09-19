'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Avatar from './Avatar';
import SearchBar from './SearchBar';
import { PlusCircle, ChevronDown, User, Settings, FileText, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { toast } = useNotification();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <nav className="bg-black/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center shrink-0 no-underline group select-none">
          <span className="text-3xl font-bold text-white tracking-tight select-none">
            orvix
          </span>
        </Link>

        <div className="flex-1 max-w-md mx-auto px-2">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {loading ? (
            <div className="w-20 h-9 bg-white/5 rounded-full animate-pulse" />
          ) : user ? (
            <>
              <Link
                href="/create"
                className="hidden sm:flex gap-1.5 items-center py-2 px-2.5 text-sm font-semibold text-white no-underline select-none hover:bg-white/10 rounded-full transition-colors"
              >
                <PlusCircle size={18} className="text-white" />
                <span className="text-sm">Create</span>
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-full hover:bg-white/[0.06] transition-colors cursor-pointer select-none"
                >
                  <Avatar src={user.avatar} username={user.username} size={32} />
                  <ChevronDown size={15} className={`text-zinc-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-52 bg-[#0c0c0f] border border-white/10 rounded-2xl shadow-2xl shadow-black z-50 p-1.5 space-y-0.5"
                      >
                        <div
                          className="absolute -top-[10px] left-1/2 -translate-x-1/2 w-0 h-0"
                          style={{
                            borderLeft: '10px solid transparent',
                            borderRight: '10px solid transparent',
                            borderBottom: '10px solid rgba(255,255,255,0.10)',
                          }}
                        />
                        <div
                          className="absolute -top-[8px] left-1/2 -translate-x-1/2 w-0 h-0"
                          style={{
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderBottom: '8px solid #0c0c0f',
                          }}
                        />
                        <div className="px-3 py-2.5 border-b border-white/5 mb-1 flex items-center gap-3">
                          <Avatar src={user.avatar} username={user.username} size={34} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-zinc-100 truncate">{user.displayName}</p>
                            <p className="text-[11px] text-zinc-500 truncate">u/{user.username}</p>
                          </div>
                        </div>

                        <Link
                          href={`/profile/${user.username}`}
                          className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-colors select-none"
                          onClick={() => setMenuOpen(false)}
                        >
                          <User size={14} className="text-zinc-400" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-colors select-none"
                          onClick={() => setMenuOpen(false)}
                        >
                          <Settings size={14} className="text-zinc-400" />
                          <span>Settings</span>
                        </Link>
                        <Link
                          href="/create"
                          className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-colors sm:hidden select-none"
                          onClick={() => setMenuOpen(false)}
                        >
                          <FileText size={14} className="text-zinc-400" />
                          <span>Create Post</span>
                        </Link>

                        {user.role === 'admin' && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white transition-colors select-none"
                            onClick={() => setMenuOpen(false)}
                          >
                            <LayoutDashboard size={14} />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}

                        <div className="border-t border-white/5 pt-1 mt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-xs font-medium rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors cursor-pointer select-none"
                          >
                            <LogOut size={14} />
                            <span>Log Out</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors select-none"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-4.5 py-2 text-xs font-bold text-black bg-white hover:bg-zinc-200 rounded-full transition-all shadow-sm hover:scale-105 select-none"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
