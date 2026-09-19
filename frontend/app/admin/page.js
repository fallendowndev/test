'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../lib/api';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Server,
  Trash2,
  Shield,
  ShieldAlert,
  CheckCircle,
  Search,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  Clock,
  Cpu,
  UserCheck,
  UserX
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useNotification();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [usersList, setUsersList] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPages, setUsersPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  const [postsList, setPostsList] = useState([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsPage, setPostsPage] = useState(1);
  const [postsPages, setPostsPages] = useState(1);
  const [postsSearch, setPostsSearch] = useState('');
  const [postsLoading, setPostsLoading] = useState(false);

  const [reportsList, setReportsList] = useState([]);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsPages, setReportsPages] = useState(1);
  const [reportsFilter, setReportsFilter] = useState('pending');
  const [reportsLoading, setReportsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await api('/admin/stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async (p = 1) => {
    try {
      setUsersLoading(true);
      let url = `/admin/users?page=${p}&limit=10`;
      if (usersSearch.trim()) url += `&search=${encodeURIComponent(usersSearch.trim())}`;
      if (usersRoleFilter) url += `&role=${usersRoleFilter}`;

      const res = await api(url);
      if (res.success && res.data) {
        setUsersList(res.data.users || []);
        setUsersTotal(res.data.total || 0);
        setUsersPage(res.data.page || 1);
        setUsersPages(res.data.pages || 1);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [usersSearch, usersRoleFilter, toast]);

  const fetchPosts = useCallback(async (p = 1) => {
    try {
      setPostsLoading(true);
      let url = `/admin/posts?page=${p}&limit=10`;
      if (postsSearch.trim()) url += `&search=${encodeURIComponent(postsSearch.trim())}`;

      const res = await api(url);
      if (res.success && res.data) {
        setPostsList(res.data.posts || []);
        setPostsTotal(res.data.total || 0);
        setPostsPage(res.data.page || 1);
        setPostsPages(res.data.pages || 1);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load posts');
    } finally {
      setPostsLoading(false);
    }
  }, [postsSearch, toast]);

  const fetchReports = useCallback(async (p = 1) => {
    try {
      setReportsLoading(true);
      let url = `/admin/reports?page=${p}&limit=10`;
      if (reportsFilter) url += `&status=${reportsFilter}`;

      const res = await api(url);
      if (res.success && res.data) {
        setReportsList(res.data.reports || []);
        setReportsTotal(res.data.total || 0);
        setReportsPage(res.data.page || 1);
        setReportsPages(res.data.pages || 1);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  }, [reportsFilter, toast]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchStats();
    }
  }, [user, fetchStats]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      if (activeTab === 'users') fetchUsers(1);
      if (activeTab === 'posts') fetchPosts(1);
      if (activeTab === 'reports') fetchReports(1);
    }
  }, [user, activeTab, fetchUsers, fetchPosts, fetchReports]);

  if (authLoading) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-[#0d0d11] p-8 rounded-2xl border border-red-500/20 shadow-2xl space-y-4">
          <ShieldAlert className="w-14 h-14 mx-auto text-red-500" />
          <h1 className="text-xl font-bold text-zinc-100">Access Restricted</h1>
          <p className="text-xs text-zinc-400">
            Administrator credentials are required to access this dashboard.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors"
          >
            Return to Feed
          </Link>
        </div>
      </div>
    );
  }

  const handleRoleToggle = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Are you sure you want to change @${targetUser.username}'s role to ${newRole.toUpperCase()}?`)) {
      return;
    }

    try {
      const res = await api(`/admin/users/${targetUser._id}/role`, {
        method: 'PATCH',
        body: { role: newRole },
      });
      if (res.success) {
        toast.success(`Role changed to ${newRole} for @${targetUser.username}`);
        fetchUsers(usersPage);
        fetchStats();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (
      !confirm(
        `WARNING: Deleting @${targetUser.username} will delete all their posts, comments, and records. Proceed?`
      )
    ) {
      return;
    }

    try {
      const res = await api(`/admin/users/${targetUser._id}`, { method: 'DELETE' });
      if (res.success) {
        toast.success(`User @${targetUser.username} removed.`);
        fetchUsers(usersPage);
        fetchStats();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const handleDeletePost = async (postId, postTitle) => {
    if (!confirm(`Are you sure you want to permanently delete post "${postTitle}"?`)) {
      return;
    }

    try {
      const res = await api(`/admin/posts/${postId}`, { method: 'DELETE' });
      if (res.success) {
        toast.success('Post removed by administrator');
        fetchPosts(postsPage);
        fetchStats();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete post');
    }
  };

  const handleUpdateReport = async (reportId, status) => {
    try {
      const res = await api(`/admin/reports/${reportId}`, {
        method: 'PATCH',
        body: { status },
      });
      if (res.success) {
        toast.success(`Report marked as ${status}`);
        fetchReports(reportsPage);
        fetchStats();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update report');
    }
  };

  const handleDeleteReportTarget = async (reportId) => {
    if (!confirm('Are you sure you want to delete this reported content?')) {
      return;
    }

    try {
      const res = await api(`/admin/reports/${reportId}/target`, { method: 'DELETE' });
      if (res.success) {
        toast.success('Reported content deleted and report resolved.');
        fetchReports(reportsPage);
        fetchStats();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove content');
    }
  };

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-7xl mx-auto py-3 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white text-black rounded-2xl flex items-center justify-center shadow-lg">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2.5">
              <span>Admin Dashboard</span>
              <span className="text-[10px] bg-white/10 text-zinc-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Full Privileges
              </span>
            </h1>
            <p className="text-xs text-zinc-500">
              OLED platform management for users, system metrics, and content moderation.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchStats();
            if (activeTab === 'users') fetchUsers(usersPage);
            if (activeTab === 'posts') fetchPosts(postsPage);
            if (activeTab === 'reports') fetchReports(reportsPage);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} className={statsLoading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      <div className="flex border-b border-white/5 space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <LayoutDashboard size={14} />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Users size={14} />
          <span>Users</span>
          {stats?.metrics?.totalUsers !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'users' ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'}`}>
              {stats.metrics.totalUsers}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <FileText size={14} />
          <span>Posts</span>
          {stats?.metrics?.totalPosts !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'posts' ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-300'}`}>
              {stats.metrics.totalPosts}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-white text-black shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <AlertTriangle size={14} />
          <span>Moderation</span>
          {stats?.metrics?.pendingReports > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500 text-white font-bold">
              {stats.metrics.pendingReports}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-[#0d0d11] p-4 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Users</span>
                <Users size={16} className="text-zinc-300" />
              </div>
              <div className="text-2xl font-black text-zinc-100">
                {stats?.metrics?.totalUsers ?? '...'}
              </div>
              <div className="text-[10px] text-zinc-500">Total accounts</div>
            </div>

            <div className="bg-[#0d0d11] p-4 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Posts</span>
                <FileText size={16} className="text-zinc-300" />
              </div>
              <div className="text-2xl font-black text-zinc-100">
                {stats?.metrics?.totalPosts ?? '...'}
              </div>
              <div className="text-[10px] text-zinc-500">Discussions</div>
            </div>

            <div className="bg-[#0d0d11] p-4 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Comments</span>
                <MessageSquare size={16} className="text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-zinc-100">
                {stats?.metrics?.totalComments ?? '...'}
              </div>
              <div className="text-[10px] text-zinc-500">Replies</div>
            </div>

            <div className="bg-[#0d0d11] p-4 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Votes</span>
                <ThumbsUp size={16} className="text-[#ff542e]" />
              </div>
              <div className="text-2xl font-black text-zinc-100">
                {stats?.metrics?.totalVotes ?? '...'}
              </div>
              <div className="text-[10px] text-zinc-500">Ratings</div>
            </div>

            <div className="bg-[#0d0d11] p-4 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Reports</span>
                <AlertTriangle size={16} className="text-amber-400" />
              </div>
              <div className="text-2xl font-black text-zinc-100">
                {stats?.metrics?.totalReports ?? '...'}
              </div>
              <div className="text-[10px] text-zinc-500">Total flags</div>
            </div>

            <div className="bg-[#0d0d11] p-4 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              <div className="text-2xl font-black text-red-400">
                {stats?.metrics?.pendingReports ?? '...'}
              </div>
              <div className="text-[10px] text-red-500 font-semibold">Needs action</div>
            </div>
          </div>

          <div className="bg-[#0d0d11] p-5 rounded-2xl border border-white/5">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Server size={15} className="text-zinc-300" />
              <span>System &amp; Server Health</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#141419] rounded-xl border border-white/5">
                <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mb-1">
                  <Clock size={13} />
                  <span>Uptime</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-zinc-200">
                  {stats?.system ? formatUptime(stats.system.uptimeSeconds) : '...'}
                </div>
              </div>

              <div className="p-3 bg-[#141419] rounded-xl border border-white/5">
                <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mb-1">
                  <Cpu size={13} />
                  <span>Node.js</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-zinc-200">
                  {stats?.system?.nodeVersion || '...'}
                </div>
              </div>

              <div className="p-3 bg-[#141419] rounded-xl border border-white/5">
                <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mb-1">
                  <Server size={13} />
                  <span>Memory</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-zinc-200">
                  {stats?.system ? `${stats.system.memoryHeapMb}MB / ${stats.system.memoryRssMb}MB` : '...'}
                </div>
              </div>

              <div className="p-3 bg-[#141419] rounded-xl border border-white/5">
                <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mb-1">
                  <Shield size={13} />
                  <span>Environment</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-zinc-200 capitalize">
                  {stats?.system?.environment || '...'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#0d0d11] p-5 rounded-2xl border border-white/5 space-y-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider pb-2 border-b border-white/5 flex items-center justify-between">
                <span>Recent Members</span>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-[11px] text-zinc-300 hover:underline font-normal cursor-pointer"
                >
                  View all
                </button>
              </h3>
              <div className="space-y-2.5">
                {stats?.recentUsers?.length ? (
                  stats.recentUsers.map((u) => (
                    <div key={u._id} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar src={u.avatar} username={u.username} size={28} />
                        <div className="min-w-0">
                          <Link href={`/profile/${u.username}`} className="font-semibold text-zinc-200 hover:text-white block truncate">
                            {u.displayName || u.username}
                          </Link>
                          <span className="text-zinc-500 block truncate text-[11px]">u/{u.username}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-white/10 text-zinc-200' : 'bg-white/5 text-zinc-400'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 py-4 text-center">No users registered</p>
                )}
              </div>
            </div>

            <div className="bg-[#0d0d11] p-5 rounded-2xl border border-white/5 space-y-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider pb-2 border-b border-white/5 flex items-center justify-between">
                <span>Recent Posts</span>
                <button
                  onClick={() => setActiveTab('posts')}
                  className="text-[11px] text-zinc-300 hover:underline font-normal cursor-pointer"
                >
                  View all
                </button>
              </h3>
              <div className="space-y-2.5">
                {stats?.recentPosts?.length ? (
                  stats.recentPosts.map((p) => (
                    <div key={p._id} className="text-xs space-y-1 py-1">
                      <Link
                        href={`/post/${p._id}`}
                        className="font-semibold text-zinc-200 hover:text-white line-clamp-1 transition-colors"
                      >
                        {p.title}
                      </Link>
                      <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
                        <span>u/{p.author?.username || 'unknown'}</span>
                        <span>•</span>
                        <span>{p.score || 0} votes</span>
                        <span>•</span>
                        <span>{p.commentCount || 0} comments</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 py-4 text-center">No posts yet</p>
                )}
              </div>
            </div>

            <div className="bg-[#0d0d11] p-5 rounded-2xl border border-white/5 space-y-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider pb-2 border-b border-white/5 flex items-center justify-between">
                <span>Recent Reports</span>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="text-[11px] text-zinc-300 hover:underline font-normal cursor-pointer"
                >
                  View all
                </button>
              </h3>
              <div className="space-y-2.5">
                {stats?.recentReports?.length ? (
                  stats.recentReports.map((r) => (
                    <div key={r._id} className="text-xs space-y-1 py-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold capitalize text-zinc-200">
                          {r.targetType}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'pending' ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-zinc-400'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-zinc-400 line-clamp-1 italic text-[11px]">&ldquo;{r.reason}&rdquo;</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 space-y-1 text-zinc-500">
                    <CheckCircle className="w-6 h-6 mx-auto text-zinc-300" />
                    <p className="text-xs">No pending reports. Platform clean!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-[#0d0d11] p-3.5 rounded-2xl border border-white/5 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchUsers(1);
              }}
              className="flex-1 w-full relative"
            >
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                placeholder="Search users by username, email, or display name..."
                className="w-full pl-10 pr-4 py-2 bg-[#141419] border border-white/10 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 outline-none transition-colors"
              />
            </form>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={usersRoleFilter}
                onChange={(e) => setUsersRoleFilter(e.target.value)}
                className="px-3 py-2 border border-white/10 rounded-xl text-xs bg-[#141419] text-zinc-300 focus:border-white/30 outline-none cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>

              <button
                type="button"
                onClick={() => fetchUsers(1)}
                className="px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Filter
              </button>
            </div>
          </div>

          <div className="bg-[#0d0d11] rounded-2xl border border-white/5 overflow-hidden">
            {usersLoading ? (
              <div className="py-16">
                <LoadingSpinner size="lg" />
              </div>
            ) : usersList.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                No users found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/5 text-[11px] font-bold text-zinc-400 uppercase">
                    <tr>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usersList.map((u) => (
                      <tr key={u._id} className="hover:bg-white/[0.015] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar src={u.avatar} username={u.username} size={30} />
                            <div>
                              <Link
                                href={`/profile/${u.username}`}
                                className="font-semibold text-zinc-200 hover:text-white block"
                              >
                                {u.displayName || u.username}
                              </Link>
                              <span className="text-[11px] text-zinc-500">u/{u.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'admin'
                                ? 'bg-white/10 text-zinc-200 border border-white/20'
                                : 'bg-white/5 text-zinc-400'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRoleToggle(u)}
                              disabled={u._id === user._id}
                              title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                              className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                            >
                              {u.role === 'admin' ? <UserX size={13} /> : <UserCheck size={13} />}
                              <span>{u.role === 'admin' ? 'Demote' : 'Make Admin'}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={u._id === user._id}
                              title="Delete user and all content"
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {usersPages > 1 && (
              <div className="p-4 border-t border-white/5 flex justify-center">
                <div className="flex gap-2">
                  <button
                    disabled={usersPage <= 1}
                    onClick={() => fetchUsers(usersPage - 1)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-xs text-zinc-500">
                    Page {usersPage} of {usersPages}
                  </span>
                  <button
                    disabled={usersPage >= usersPages}
                    onClick={() => fetchUsers(usersPage + 1)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="space-y-4">
          <div className="bg-[#0d0d11] p-3.5 rounded-2xl border border-white/5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchPosts(1);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={postsSearch}
                  onChange={(e) => setPostsSearch(e.target.value)}
                  placeholder="Search posts by title..."
                  className="w-full pl-10 pr-4 py-2 bg-[#141419] border border-white/10 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>

          <div className="bg-[#0d0d11] rounded-2xl border border-white/5 overflow-hidden">
            {postsLoading ? (
              <div className="py-16">
                <LoadingSpinner size="lg" />
              </div>
            ) : postsList.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                No posts found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/5 text-[11px] font-bold text-zinc-400 uppercase">
                    <tr>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Author</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Comments</th>
                      <th className="px-4 py-3">Published</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {postsList.map((p) => (
                      <tr key={p._id} className="hover:bg-white/[0.015] transition-colors">
                        <td className="px-4 py-3 max-w-sm">
                          <Link
                            href={`/post/${p._id}`}
                            className="font-semibold text-zinc-200 hover:text-white line-clamp-1 transition-colors"
                          >
                            {p.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          <Link
                            href={`/profile/${p.author?.username}`}
                            className="hover:underline text-zinc-300"
                          >
                            u/{p.author?.username || 'unknown'}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-bold text-zinc-200">{p.score || 0}</td>
                        <td className="px-4 py-3 text-zinc-400">{p.commentCount || 0}</td>
                        <td className="px-4 py-3 text-zinc-500">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/post/${p._id}`}
                              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
                              title="View post"
                            >
                              <ExternalLink size={15} />
                            </Link>
                            <button
                              onClick={() => handleDeletePost(p._id, p.title)}
                              className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Delete post"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {postsPages > 1 && (
              <div className="p-4 border-t border-white/5 flex justify-center">
                <div className="flex gap-2">
                  <button
                    disabled={postsPage <= 1}
                    onClick={() => fetchPosts(postsPage - 1)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-xs text-zinc-500">
                    Page {postsPage} of {postsPages}
                  </span>
                  <button
                    disabled={postsPage >= postsPages}
                    onClick={() => fetchPosts(postsPage + 1)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-[#0d0d11] p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Status:</span>
              <div className="flex gap-1">
                {['pending', 'resolved', 'dismissed', 'all'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setReportsFilter(st)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                      reportsFilter === st
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-xs text-zinc-500">{reportsTotal} reports</span>
          </div>

          <div className="space-y-3">
            {reportsLoading ? (
              <div className="py-16">
                <LoadingSpinner size="lg" />
              </div>
            ) : reportsList.length === 0 ? (
              <div className="bg-[#0d0d11] p-12 text-center rounded-2xl border border-white/5 space-y-2">
                <CheckCircle className="w-10 h-10 mx-auto text-zinc-300" />
                <h3 className="font-bold text-sm text-zinc-200">No Reports Found</h3>
                <p className="text-xs text-zinc-500">No moderation items in this filter category.</p>
              </div>
            ) : (
              reportsList.map((rep) => (
                <div key={rep._id} className="bg-[#0d0d11] p-5 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/15 text-blue-400 border border-blue-500/20">
                        {rep.targetType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        rep.status === 'pending'
                          ? 'bg-red-500/15 text-red-400'
                          : rep.status === 'resolved'
                          ? 'bg-white/10 text-zinc-300'
                          : 'bg-white/5 text-zinc-400'
                      }`}>
                        {rep.status}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {new Date(rep.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400">
                      Reporter: <strong className="text-zinc-200">u/{rep.reporter?.username || 'unknown'}</strong>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Reason:</div>
                    <div className="p-3 bg-red-500/10 text-red-300 rounded-xl text-xs leading-relaxed border border-red-500/20">
                      {rep.reason}
                    </div>
                  </div>

                  {rep.target && (
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs space-y-1">
                      <div className="font-semibold text-zinc-400">
                        Reported Content Preview ({rep.targetType}):
                      </div>
                      {rep.targetType === 'post' ? (
                        <div>
                          <div className="font-bold text-zinc-100">{rep.target.title}</div>
                          <div className="text-zinc-400 line-clamp-2 mt-1">{rep.target.content}</div>
                          <Link
                            href={`/post/${rep.targetId}`}
                            className="text-zinc-300 hover:text-white hover:underline mt-2 inline-flex items-center gap-1"
                          >
                            <span>View Full Post</span>
                            <ExternalLink size={12} />
                          </Link>
                        </div>
                      ) : (
                        <div>
                          <div className="text-zinc-300 italic">
                            {rep.target.deletedAt ? '[Comment already deleted]' : rep.target.content}
                          </div>
                          {rep.target.post && (
                            <Link
                              href={`/post/${rep.target.post}`}
                              className="text-zinc-300 hover:text-white hover:underline mt-2 inline-flex items-center gap-1"
                            >
                              <span>View Discussion Thread</span>
                              <ExternalLink size={12} />
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                    {rep.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateReport(rep._id, 'dismissed')}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 transition-colors cursor-pointer"
                        >
                          Dismiss Report
                        </button>
                        <button
                          onClick={() => handleUpdateReport(rep._id, 'resolved')}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-zinc-200 text-black transition-colors cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => handleDeleteReportTarget(rep._id)}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>Delete Content</span>
                        </button>
                      </>
                    )}

                    {rep.status !== 'pending' && (
                      <button
                        onClick={() => handleUpdateReport(rep._id, 'pending')}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 transition-colors cursor-pointer"
                      >
                        Reopen Report
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
