'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../lib/api';
import Avatar from '../../components/Avatar';
import PostCard from '../../components/PostCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import { Camera, Edit3, Image, Check, X } from 'lucide-react';

export default function ProfilePage() {
  const params = useParams();
  const { username } = params;
  const { user: currentUser, setUser } = useAuth();
  const { toast } = useNotification();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [savingMedia, setSavingMedia] = useState(false);

  const [previewModal, setPreviewModal] = useState(null);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const isOwnProfile = currentUser && currentUser.username === username;

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    try {
      setLoading(true);
      setError('');
      const res = await api(`/users/${username}`);
      if (res.success && res.data?.user) {
        setProfile(res.data.user);
      } else {
        setError('User not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [username]);

  const fetchUserPosts = useCallback(async (p = 1) => {
    if (!username) return;
    try {
      setPostsLoading(true);
      const res = await api(`/users/${username}/posts?page=${p}&limit=10`);
      if (res.success && res.data) {
        setPosts(res.data.posts || []);
        setPage(res.data.page || 1);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Failed to load user posts:', err);
    } finally {
      setPostsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
    fetchUserPosts(1);
  }, [fetchProfile, fetchUserPosts]);

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
    setProfile((prev) => (prev ? { ...prev, postCount: Math.max(0, (prev.postCount || 1) - 1) } : prev));
  };

  const handleAvatarClick = () => {
    if (isOwnProfile && !savingMedia) avatarInputRef.current?.click();
  };

  const handleBannerClick = () => {
    if (isOwnProfile && !savingMedia) bannerInputRef.current?.click();
  };

  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Avatar must be under 5MB'); return; }
    const url = URL.createObjectURL(file);
    setPreviewModal({ type: 'avatar', file, url });
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleBannerFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Banner must be under 5MB'); return; }
    const url = URL.createObjectURL(file);
    setPreviewModal({ type: 'banner', file, url });
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const handleModalApply = () => {
    if (!previewModal) return;
    if (previewModal.type === 'avatar') {
      setSelectedAvatarFile(previewModal.file);
      setAvatarPreview(previewModal.url);
    } else {
      setSelectedBannerFile(previewModal.file);
      setBannerPreview(previewModal.url);
    }
    setPreviewModal(null);
  };

  const handleModalCancel = () => {
    setPreviewModal(null);
  };

  const handleResetMedia = () => {
    setSelectedAvatarFile(null);
    setAvatarPreview(null);
    setSelectedBannerFile(null);
    setBannerPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const handleSaveMedia = async () => {
    try {
      setSavingMedia(true);
      let updatedUser = currentUser;

      if (selectedAvatarFile) {
        const formData = new FormData();
        formData.append('avatar', selectedAvatarFile);
        const res = await api('/users/me/avatar', { method: 'PATCH', body: formData, isFormData: true });
        if (res.success && res.data?.user) {
          updatedUser = res.data.user;
          setProfile((prev) => ({ ...prev, avatar: res.data.user.avatar }));
        }
      }

      if (selectedBannerFile) {
        const formData = new FormData();
        formData.append('banner', selectedBannerFile);
        const res = await api('/users/me/banner', { method: 'PATCH', body: formData, isFormData: true });
        if (res.success && res.data?.user) {
          updatedUser = res.data.user;
          setProfile((prev) => ({ ...prev, banner: res.data.user.banner }));
        }
      }

      setUser(updatedUser);
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
      setSelectedBannerFile(null);
      setBannerPreview(null);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingMedia(false);
    }
  };

  const formatJoinedDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const hasUnsavedChanges = Boolean(selectedAvatarFile || selectedBannerFile);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="bg-[#0d0d11] p-8 rounded-2xl border border-white/5 space-y-3">
          <h2 className="text-base font-bold text-zinc-100">{error || 'User not found'}</h2>
          <p className="text-xs text-zinc-500">The member you are looking for does not exist or has been removed.</p>
          <Link href="/" className="inline-block px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors">
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-6 pb-20">
      <div className="bg-[#0d0d11] rounded-2xl border border-white/5 overflow-hidden">

        <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarFileSelect} className="hidden" />
        <input ref={bannerInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleBannerFileSelect} className="hidden" />

        <div
          className={`h-36 sm:h-48 relative overflow-hidden border-b border-white/5 ${isOwnProfile ? 'group/banner cursor-pointer' : ''}`}
          onClick={isOwnProfile ? handleBannerClick : undefined}
        >
          {(bannerPreview || profile.banner) ? (
            <img src={bannerPreview || profile.banner} alt="Profile Banner" className="w-full h-full object-cover select-none pointer-events-none" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-zinc-900 via-zinc-950 to-black" />
          )}

          {isOwnProfile && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center gap-2 select-none">
              <Image size={20} className="text-white" />
              <span className="text-white text-sm font-semibold">Change Banner</span>
            </div>
          )}
        </div>

        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group/avatar shrink-0">
              <div
                onClick={handleAvatarClick}
                className={`relative ring-4 ring-[#0d0d11] rounded-full bg-black shadow-2xl overflow-hidden ${isOwnProfile ? 'cursor-pointer' : ''}`}
              >
                <Avatar src={avatarPreview || profile.avatar} username={profile.username} size={96} />
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 select-none">
                    {savingMedia ? (
                      <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Image size={18} className="text-white" />
                        <span className="text-[10px] font-semibold text-white">Change</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">u/{profile.username}</p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {isOwnProfile && (
              <Link
                href="/settings"
                className="px-5 py-2.5 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-200 hover:text-white text-xs font-semibold transition-all inline-flex items-center gap-2 select-none"
              >
                <Edit3 size={15} className="text-zinc-300" />
                <span>Edit Profile</span>
              </Link>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 border-t border-white/5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center pt-4">
          <div className="max-w-xl">
            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">About</h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {profile.bio || 'This member has not written a bio yet.'}
            </p>
          </div>

          <div className="flex gap-8 shrink-0 text-xs text-zinc-400">
            <div className="text-center">
              <span className="block font-bold text-zinc-100 text-base">{profile.postCount || 0}</span>
              <span className="text-[11px] uppercase tracking-wider">Discussions</span>
            </div>
            <div className="text-center">
              <span className="block font-bold text-zinc-100 text-base">{formatJoinedDate(profile.createdAt)}</span>
              <span className="text-[11px] uppercase tracking-wider">Joined</span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {previewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={handleModalCancel}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0e0e13] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h2 className="text-sm font-bold text-zinc-100">
                  {previewModal.type === 'avatar' ? 'Preview Profile Picture' : 'Preview Banner'}
                </h2>
                <button
                  type="button"
                  onClick={handleModalCancel}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5">
                {previewModal.type === 'avatar' ? (
                  <div className="flex flex-col items-center gap-5">
                    <div className="ring-4 ring-white/5 rounded-full overflow-hidden shadow-2xl">
                      <img src={previewModal.url} alt="Avatar Preview" className="w-36 h-36 object-cover select-none" />
                    </div>
                    <p className="text-xs text-zinc-400 text-center">This is how your profile picture will appear to others.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-full h-40 rounded-xl overflow-hidden border border-white/10">
                      <img src={previewModal.url} alt="Banner Preview" className="w-full h-full object-cover select-none" />
                    </div>
                    <p className="text-xs text-zinc-400 text-center">This is how your banner will appear on your profile.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleModalCancel}
                  className="px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleModalApply}
                  className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Check size={14} />
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl bg-[#111216] border border-white/10 rounded-2xl px-5 py-4 shadow-2xl shadow-black/90 flex items-center justify-between gap-4 backdrop-blur-xl"
          >
            <span className="text-xs sm:text-sm font-semibold text-zinc-200 truncate">
              Careful — you have unsaved changes!
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleResetMedia}
                disabled={savingMedia}
                className="px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:underline transition-all cursor-pointer disabled:opacity-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSaveMedia}
                disabled={savingMedia}
                className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingMedia ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
          Posts by u/{profile.username} ({profile.postCount || 0})
        </h2>

        {postsLoading ? (
          <div className="py-16"><LoadingSpinner size="md" /></div>
        ) : posts.length === 0 ? (
          <div className="bg-[#0d0d11] p-10 text-center rounded-2xl border border-white/5 text-zinc-500 text-xs">
            u/{profile.username} hasn&apos;t published any posts yet.
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onDelete={handlePostDeleted} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pt-4 flex justify-center">
            <Pagination page={page} pages={totalPages} baseUrl={`/profile/${username}`} />
          </div>
        )}
      </div>
    </div>
  );
}
