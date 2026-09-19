'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
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
  XCircle,
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

  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await api('/admin/stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  }, []);

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
      showNotification('error', err.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [usersSearch, usersRoleFilter]);

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
      showNotification('error', err.message || 'Failed to load posts');
    } finally {
      setPostsLoading(false);
    }
  }, [postsSearch]);

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
      showNotification('error', err.message || 'Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  }, [reportsFilter]);

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
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="card bg-white p-8 rounded-xl border border-red-200 shadow-sm">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-sm text-gray-600 mb-6">
            Administrator privileges are required to access this dashboard.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-full bg-[#0079d3] text-white text-sm font-semibold hover:bg-[#006cbd] transition-colors"
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
        showNotification('success', `Role updated to ${newRole} for @${targetUser.username}`);
        fetchUsers(usersPage);
        fetchStats();
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (
      !confirm(
        `WARNING: Deleting @${targetUser.username} will delete all their posts, comments, votes, and records permanently. Proceed?`
      )
    ) {
      return;
    }

    try {
      const res = await api(`/admin/users/${targetUser._id}`, { method: 'DELETE' });
      if (res.success) {
        showNotification('success', `User @${targetUser.username} and all content removed.`);
        fetchUsers(usersPage);
        fetchStats();
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to delete user');
    }
  };

  const handleDeletePost = async (postId, postTitle) => {
    if (!confirm(`Are you sure you want to permanently delete post "${postTitle}"?`)) {
      return;
    }

    try {
      const res = await api(`/admin/posts/${postId}`, { method: 'DELETE' });
      if (res.success) {
        showNotification('success', 'Post deleted successfully by admin.');
        fetchPosts(postsPage);
        fetchStats();
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to delete post');
    }
  };

  const handleUpdateReport = async (reportId, status) => {
    try {
      const res = await api(`/admin/reports/${reportId}`, {
        method: 'PATCH',
        body: { status },
      });
      if (res.success) {
        showNotification('success', `Report marked as ${status}`);
        fetchReports(reportsPage);
        fetchStats();
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to update report');
    }
  };

  const handleDeleteReportTarget = async (reportId) => {
    if (!confirm('Are you sure you want to remove this reported content from the platform?')) {
      return;
    }

    try {
      const res = await api(`/admin/reports/${reportId}/target`, { method: 'DELETE' });
      if (res.success) {
        showNotification('success', 'Reported content removed and report resolved.');
        fetchReports(reportsPage);
        fetchStats();
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to remove reported content');
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
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-sm font-medium ${
            notification.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#edeff1]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#0079d3] to-[#005596] rounded-xl flex items-center justify-center text-white shadow-sm">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1c1c1c] flex items-center gap-2">
              <span>Admin Dashboard</span>
              <span className="text-xs bg-[#0079d3]/10 text-[#0079d3] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Full Access
              </span>
            </h1>
            <p className="text-xs text-[#7c7c7c]">
              Comprehensive control center for user management, system metrics, and content moderation.
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
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#ccc] hover:bg-white text-xs font-semibold text-[#1c1c1c] transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw size={14} className={statsLoading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      <div className="flex border-b border-[#edeff1] space-x-1 sm:space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'overview'
              ? 'border-[#0079d3] text-[#0079d3]'
              : 'border-transparent text-[#7c7c7c] hover:text-[#1c1c1c]'
          }`}
        >
          <LayoutDashboard size={16} />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'users'
              ? 'border-[#0079d3] text-[#0079d3]'
              : 'border-transparent text-[#7c7c7c] hover:text-[#1c1c1c]'
          }`}
        >
          <Users size={16} />
          <span>Users</span>
          {stats?.metrics?.totalUsers !== undefined && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {stats.metrics.totalUsers}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'posts'
              ? 'border-[#0079d3] text-[#0079d3]'
              : 'border-transparent text-[#7c7c7c] hover:text-[#1c1c1c]'
          }`}
        >
          <FileText size={16} />
          <span>Posts</span>
          {stats?.metrics?.totalPosts !== undefined && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {stats.metrics.totalPosts}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'reports'
              ? 'border-[#0079d3] text-[#0079d3]'
              : 'border-transparent text-[#7c7c7c] hover:text-[#1c1c1c]'
          }`}
        >
          <AlertTriangle size={16} />
          <span>Moderation Reports</span>
          {stats?.metrics?.pendingReports > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
              {stats.metrics.pendingReports}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="card bg-white p-4 rounded-xl border border-[#ccc] shadow-sm">
              <div className="flex items-center justify-between text-[#7c7c7c] mb-2">
                <span className="text-xs font-semibold uppercase">Users</span>
                <Users size={18} className="text-[#0079d3]" />
              </div>
              <div className="text-2xl font-black text-[#1c1c1c]">
                {stats?.metrics?.totalUsers ?? '...'}
              </div>
              <div className="text-[11px] text-[#7c7c7c] mt-1">Registered members</div>
            </div>

            <div className="card bg-white p-4 rounded-xl border border-[#ccc] shadow-sm">
              <div className="flex items-center justify-between text-[#7c7c7c] mb-2">
                <span className="text-xs font-semibold uppercase">Posts</span>
                <FileText size={18} className="text-[#0079d3]" />
              </div>
              <div className="text-2xl font-black text-[#1c1c1c]">
                {stats?.metrics?.totalPosts ?? '...'}
              </div>
              <div className="text-[11px] text-[#7c7c7c] mt-1">Community posts</div>
            </div>

            <div className="card bg-white p-4 rounded-xl border border-[#ccc] shadow-sm">
              <div className="flex items-center justify-between text-[#7c7c7c] mb-2">
                <span className="text-xs font-semibold uppercase">Comments</span>
                <MessageSquare size={18} className="text-[#0079d3]" />
              </div>
              <div className="text-2xl font-black text-[#1c1c1c]">
                {stats?.metrics?.totalComments ?? '...'}
              </div>
              <div className="text-[11px] text-[#7c7c7c] mt-1">Discussion replies</div>
            </div>

            <div className="card bg-white p-4 rounded-xl border border-[#ccc] shadow-sm">
              <div className="flex items-center justify-between text-[#7c7c7c] mb-2">
                <span className="text-xs font-semibold uppercase">Votes</span>
                <ThumbsUp size={18} className="text-[#ff4500]" />
              </div>
              <div className="text-2xl font-black text-[#1c1c1c]">
                {stats?.metrics?.totalVotes ?? '...'}
              </div>
              <div className="text-[11px] text-[#7c7c7c] mt-1">Community ratings</div>
            </div>

            <div className="card bg-white p-4 rounded-xl border border-[#ccc] shadow-sm">
              <div className="flex items-center justify-between text-[#7c7c7c] mb-2">
                <span className="text-xs font-semibold uppercase">Reports</span>
                <AlertTriangle size={18} className="text-amber-500" />
              </div>
              <div className="text-2xl font-black text-[#1c1c1c]">
                {stats?.metrics?.totalReports ?? '...'}
              </div>
              <div className="text-[11px] text-[#7c7c7c] mt-1">Flagged total</div>
            </div>

            <div className="card bg-white p-4 rounded-xl border border-[#ccc] shadow-sm">
              <div className="flex items-center justify-between text-[#7c7c7c] mb-2">
                <span className="text-xs font-semibold uppercase">Pending</span>
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div className="text-2xl font-black text-red-600">
                {stats?.metrics?.pendingReports ?? '...'}
              </div>
              <div className="text-[11px] text-red-500 mt-1 font-medium">Needs review</div>
            </div>
          </div>

          <div className="card bg-white p-5 rounded-xl border border-[#ccc] shadow-sm">
            <h2 className="text-sm font-bold text-[#1c1c1c] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Server size={18} className="text-[#0079d3]" />
              <span>Server &amp; Platform Health</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-[#f8f9fa] rounded-lg">
                <div className="text-xs text-[#7c7c7c] flex items-center gap-1.5 mb-1">
                  <Clock size={14} />
                  <span>Uptime</span>
                </div>
                <div className="text-sm font-bold text-[#1c1c1c]">
                  {stats?.system ? formatUptime(stats.system.uptimeSeconds) : '...'}
                </div>
              </div>

              <div className="p-3 bg-[#f8f9fa] rounded-lg">
                <div className="text-xs text-[#7c7c7c] flex items-center gap-1.5 mb-1">
                  <Cpu size={14} />
                  <span>Node Version</span>
                </div>
                <div className="text-sm font-bold text-[#1c1c1c]">
                  {stats?.system?.nodeVersion || '...'}
                </div>
              </div>

              <div className="p-3 bg-[#f8f9fa] rounded-lg">
                <div className="text-xs text-[#7c7c7c] flex items-center gap-1.5 mb-1">
                  <Server size={14} />
                  <span>Memory (Heap / RSS)</span>
                </div>
                <div className="text-sm font-bold text-[#1c1c1c]">
                  {stats?.system ? `${stats.system.memoryHeapMb} MB / ${stats.system.memoryRssMb} MB` : '...'}
                </div>
              </div>

              <div className="p-3 bg-[#f8f9fa] rounded-lg">
                <div className="text-xs text-[#7c7c7c] flex items-center gap-1.5 mb-1">
                  <Shield size={14} />
                  <span>Environment</span>
                </div>
                <div className="text-sm font-bold text-[#1c1c1c] capitalize">
                  {stats?.system?.environment || '...'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card bg-white p-5 rounded-xl border border-[#ccc] shadow-sm">
              <h3 className="text-sm font-bold text-[#1c1c1c] mb-3 pb-2 border-b border-[#edeff1] flex items-center justify-between">
                <span>Recent Registrations</span>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-xs text-[#0079d3] hover:underline font-normal"
                >
                  View all
                </button>
              </h3>
              <div className="space-y-3">
                {stats?.recentUsers?.length ? (
                  stats.recentUsers.map((u) => (
                    <div key={u._id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar src={u.avatar} username={u.username} size={28} />
                        <div className="min-w-0">
                          <Link href={`/profile/${u.username}`} className="font-semibold text-[#1c1c1c] hover:underline block truncate">
                            {u.displayName || u.username}
                          </Link>
                          <span className="text-[#7c7c7c] block truncate">u/{u.username}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#7c7c7c]">No users found</p>
                )}
              </div>
            </div>

            <div className="card bg-white p-5 rounded-xl border border-[#ccc] shadow-sm">
              <h3 className="text-sm font-bold text-[#1c1c1c] mb-3 pb-2 border-b border-[#edeff1] flex items-center justify-between">
                <span>Recent Posts</span>
                <button
                  onClick={() => setActiveTab('posts')}
                  className="text-xs text-[#0079d3] hover:underline font-normal"
                >
                  View all
                </button>
              </h3>
              <div className="space-y-3">
                {stats?.recentPosts?.length ? (
                  stats.recentPosts.map((p) => (
                    <div key={p._id} className="text-xs space-y-1">
                      <Link
                        href={`/post/${p._id}`}
                        className="font-semibold text-[#1c1c1c] hover:text-[#0079d3] line-clamp-1"
                      >
                        {p.title}
                      </Link>
                      <div className="flex items-center gap-2 text-[#7c7c7c] text-[11px]">
                        <span>u/{p.author?.username || 'unknown'}</span>
                        <span>•</span>
                        <span>{p.score || 0} votes</span>
                        <span>•</span>
                        <span>{p.commentCount || 0} comments</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#7c7c7c]">No posts found</p>
                )}
              </div>
            </div>

            <div className="card bg-white p-5 rounded-xl border border-[#ccc] shadow-sm">
              <h3 className="text-sm font-bold text-[#1c1c1c] mb-3 pb-2 border-b border-[#edeff1] flex items-center justify-between">
                <span>Recent Reports</span>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="text-xs text-[#0079d3] hover:underline font-normal"
                >
                  View all
                </button>
              </h3>
              <div className="space-y-3">
                {stats?.recentReports?.length ? (
                  stats.recentReports.map((r) => (
                    <div key={r._id} className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold capitalize text-[#1c1c1c]">
                          {r.targetType} reported
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-[#7c7c7c] line-clamp-1 italic text-[11px]">&ldquo;{r.reason}&rdquo;</p>
                      <span className="text-[10px] text-[#7c7c7c] block">
                        by u/{r.reporter?.username || 'unknown'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#7c7c7c]">No pending reports. Platform clean!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="card bg-white p-4 rounded-xl border border-[#ccc] flex flex-col sm:flex-row gap-3 items-center justify-between">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchUsers(1);
              }}
              className="flex-1 w-full relative"
            >
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c7c7c]" />
              <input
                type="text"
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                placeholder="Search users by username, email, or display name..."
                className="w-full pl-9 pr-4 py-2 border border-[#ccc] rounded-lg text-sm focus:border-[#0079d3] transition-colors"
              />
            </form>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={usersRoleFilter}
                onChange={(e) => setUsersRoleFilter(e.target.value)}
                className="px-3 py-2 border border-[#ccc] rounded-lg text-sm bg-white focus:border-[#0079d3]"
              >
                <option value="">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>

              <button
                type="button"
                onClick={() => fetchUsers(1)}
                className="px-4 py-2 bg-[#0079d3] hover:bg-[#006cbd] text-white rounded-lg text-sm font-semibold transition-colors shrink-0"
              >
                Filter
              </button>
            </div>
          </div>

          <div className="card bg-white rounded-xl border border-[#ccc] overflow-hidden shadow-sm">
            {usersLoading ? (
              <div className="py-16">
                <LoadingSpinner size="lg" />
              </div>
            ) : usersList.length === 0 ? (
              <div className="py-12 text-center text-[#7c7c7c] text-sm">
                No users found matching the query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f8f9fa] border-b border-[#edeff1] text-xs font-semibold text-[#7c7c7c] uppercase">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edeff1]">
                    {usersList.map((u) => (
                      <tr key={u._id} className="hover:bg-[#f8f9fa]/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar src={u.avatar} username={u.username} size={32} />
                            <div>
                              <Link
                                href={`/profile/${u.username}`}
                                className="font-semibold text-[#1c1c1c] hover:underline block"
                              >
                                {u.displayName || u.username}
                              </Link>
                              <span className="text-xs text-[#7c7c7c]">u/{u.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#7c7c7c]">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#7c7c7c]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRoleToggle(u)}
                              disabled={u._id === user._id}
                              title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                              className="px-2.5 py-1 text-xs font-medium rounded border border-[#ccc] hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {u.role === 'admin' ? <UserX size={13} /> : <UserCheck size={13} />}
                              <span>{u.role === 'admin' ? 'Demote' : 'Make Admin'}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={u._id === user._id}
                              title="Delete user and all content"
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Trash2 size={16} />
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
              <div className="p-4 border-t border-[#edeff1] flex justify-center">
                <div className="flex gap-2">
                  <button
                    disabled={usersPage <= 1}
                    onClick={() => fetchUsers(usersPage - 1)}
                    className="px-3 py-1.5 text-xs rounded border hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-xs text-[#7c7c7c]">
                    Page {usersPage} of {usersPages}
                  </span>
                  <button
                    disabled={usersPage >= usersPages}
                    onClick={() => fetchUsers(usersPage + 1)}
                    className="px-3 py-1.5 text-xs rounded border hover:bg-gray-50 disabled:opacity-50"
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
          <div className="card bg-white p-4 rounded-xl border border-[#ccc]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchPosts(1);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c7c7c]" />
                <input
                  type="text"
                  value={postsSearch}
                  onChange={(e) => setPostsSearch(e.target.value)}
                  placeholder="Search posts by title..."
                  className="w-full pl-9 pr-4 py-2 border border-[#ccc] rounded-lg text-sm focus:border-[#0079d3] transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0079d3] hover:bg-[#006cbd] text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          <div className="card bg-white rounded-xl border border-[#ccc] overflow-hidden shadow-sm">
            {postsLoading ? (
              <div className="py-16">
                <LoadingSpinner size="lg" />
              </div>
            ) : postsList.length === 0 ? (
              <div className="py-12 text-center text-[#7c7c7c] text-sm">
                No posts found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f8f9fa] border-b border-[#edeff1] text-xs font-semibold text-[#7c7c7c] uppercase">
                    <tr>
                      <th className="px-4 py-3">Post Title</th>
                      <th className="px-4 py-3">Author</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Comments</th>
                      <th className="px-4 py-3">Published</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edeff1]">
                    {postsList.map((p) => (
                      <tr key={p._id} className="hover:bg-[#f8f9fa]/80 transition-colors">
                        <td className="px-4 py-3 max-w-sm">
                          <Link
                            href={`/post/${p._id}`}
                            className="font-semibold text-[#1c1c1c] hover:text-[#0079d3] line-clamp-1"
                          >
                            {p.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <Link
                            href={`/profile/${p.author?.username}`}
                            className="hover:underline text-[#1c1c1c]"
                          >
                            u/{p.author?.username || 'unknown'}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-[#1c1c1c]">{p.score || 0}</td>
                        <td className="px-4 py-3 text-xs text-[#7c7c7c]">{p.commentCount || 0}</td>
                        <td className="px-4 py-3 text-xs text-[#7c7c7c]">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/post/${p._id}`}
                              className="p-1.5 text-gray-500 hover:text-gray-900 rounded hover:bg-gray-100"
                              title="View post"
                            >
                              <ExternalLink size={16} />
                            </Link>
                            <button
                              onClick={() => handleDeletePost(p._id, p.title)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete post permanently"
                            >
                              <Trash2 size={16} />
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
              <div className="p-4 border-t border-[#edeff1] flex justify-center">
                <div className="flex gap-2">
                  <button
                    disabled={postsPage <= 1}
                    onClick={() => fetchPosts(postsPage - 1)}
                    className="px-3 py-1.5 text-xs rounded border hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-xs text-[#7c7c7c]">
                    Page {postsPage} of {postsPages}
                  </span>
                  <button
                    disabled={postsPage >= postsPages}
                    onClick={() => fetchPosts(postsPage + 1)}
                    className="px-3 py-1.5 text-xs rounded border hover:bg-gray-50 disabled:opacity-50"
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
          <div className="card bg-white p-4 rounded-xl border border-[#ccc] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#7c7c7c] uppercase">Filter Status:</span>
              <div className="flex gap-1">
                {['pending', 'resolved', 'dismissed', 'all'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setReportsFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      reportsFilter === st
                        ? 'bg-[#0079d3] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-xs text-[#7c7c7c]">{reportsTotal} reports total</span>
          </div>

          <div className="space-y-3">
            {reportsLoading ? (
              <div className="py-16">
                <LoadingSpinner size="lg" />
              </div>
            ) : reportsList.length === 0 ? (
              <div className="card bg-white p-12 text-center rounded-xl border border-[#ccc]">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <h3 className="font-bold text-gray-900 mb-1">Clean Slate</h3>
                <p className="text-xs text-gray-500">No moderation reports found in this category.</p>
              </div>
            ) : (
              reportsList.map((rep) => (
                <div key={rep._id} className="card bg-white p-5 rounded-xl border border-[#ccc] shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#edeff1]">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-100 text-[#0079d3]">
                        {rep.targetType}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        rep.status === 'pending'
                          ? 'bg-red-100 text-red-700'
                          : rep.status === 'resolved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {rep.status}
                      </span>
                      <span className="text-xs text-[#7c7c7c]">
                        Reported {new Date(rep.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-[#7c7c7c]">
                      Reporter: <strong className="text-gray-900">u/{rep.reporter?.username || 'unknown'}</strong>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-[#7c7c7c] uppercase mb-1">Reason:</div>
                    <div className="p-3 bg-red-50 text-red-800 rounded-lg text-sm leading-relaxed border border-red-100">
                      {rep.reason}
                    </div>
                  </div>

                  {rep.target && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1">
                      <div className="font-semibold text-gray-700">
                        Reported Content Preview ({rep.targetType}):
                      </div>
                      {rep.targetType === 'post' ? (
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{rep.target.title}</div>
                          <div className="text-gray-600 line-clamp-2 mt-1">{rep.target.content}</div>
                          <Link
                            href={`/post/${rep.targetId}`}
                            className="text-[#0079d3] hover:underline mt-2 inline-flex items-center gap-1"
                          >
                            <span>Open Post</span>
                            <ExternalLink size={12} />
                          </Link>
                        </div>
                      ) : (
                        <div>
                          <div className="text-gray-700 italic">
                            {rep.target.deletedAt ? '[Comment already deleted]' : rep.target.content}
                          </div>
                          {rep.target.post && (
                            <Link
                              href={`/post/${rep.target.post}`}
                              className="text-[#0079d3] hover:underline mt-2 inline-flex items-center gap-1"
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
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                          Dismiss Report
                        </button>
                        <button
                          onClick={() => handleUpdateReport(rep._id, 'resolved')}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                        >
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => handleDeleteReportTarget(rep._id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 size={13} />
                          <span>Delete Content &amp; Resolve</span>
                        </button>
                      </>
                    )}

                    {rep.status !== 'pending' && (
                      <button
                        onClick={() => handleUpdateReport(rep._id, 'pending')}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
                      >
                        Reopen Report
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {reportsPages > 1 && (
              <div className="p-4 flex justify-center">
                <div className="flex gap-2">
                  <button
                    disabled={reportsPage <= 1}
                    onClick={() => fetchReports(reportsPage - 1)}
                    className="px-3 py-1.5 text-xs rounded border hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-xs text-[#7c7c7c]">
                    Page {reportsPage} of {reportsPages}
                  </span>
                  <button
                    disabled={reportsPage >= reportsPages}
                    onClick={() => fetchReports(reportsPage + 1)}
                    className="px-3 py-1.5 text-xs rounded border hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
