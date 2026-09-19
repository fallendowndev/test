'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Avatar from '../components/Avatar';
import { api } from '../lib/api';
import { Camera, Image as ImageIcon } from 'lucide-react';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { toast } = useNotification();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const hasChanges = Boolean(
    (user && displayName !== (user.displayName || '')) ||
    (user && bio !== (user.bio || '')) ||
    avatarFile !== null ||
    bannerFile !== null
  );

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be under 5MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleBannerSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Banner must be under 5MB');
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleReset = () => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setBannerFile(null);
    setBannerPreview(null);
  };

  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    try {
      setSaving(true);
      let updatedUser = user;

      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const resAvatar = await api('/users/me/avatar', {
          method: 'PATCH',
          body: formData,
          isFormData: true,
        });

        if (resAvatar.success && resAvatar.data?.user) {
          updatedUser = resAvatar.data.user;
        }
      }

      if (bannerFile) {
        const formData = new FormData();
        formData.append('banner', bannerFile);
        const resBanner = await api('/users/me/banner', {
          method: 'PATCH',
          body: formData,
          isFormData: true,
        });

        if (resBanner.success && resBanner.data?.user) {
          updatedUser = resBanner.data.user;
        }
      }

      if (displayName !== (user?.displayName || '') || bio !== (user?.bio || '')) {
        const resProfile = await api('/users/me/profile', {
          method: 'PATCH',
          body: {
            displayName: displayName.trim(),
            bio: bio.trim(),
          },
        });

        if (resProfile.success && resProfile.data?.user) {
          updatedUser = resProfile.data.user;
        }
      }

      setUser(updatedUser);
      setAvatarFile(null);
      setAvatarPreview(null);
      setBannerFile(null);
      setBannerPreview(null);
      toast.success('Changes saved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto py-4 space-y-6 pb-24">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">Account Settings</h1>
          <p className="text-xs text-zinc-500">Customize your public identity, banner, and profile bio</p>
        </div>

        <div className="bg-[#0d0d11] p-6 rounded-2xl border border-white/5 space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pb-2 border-b border-white/5">
            Avatar Picture
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar
                src={avatarPreview || user?.avatar}
                username={user?.username}
                size={80}
              />
            </div>

            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div>
                <label className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-semibold rounded-full border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-200 hover:text-white cursor-pointer transition-colors select-none">
                  <Camera size={14} className="text-zinc-300" />
                  <span>Choose New Avatar</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-zinc-500 mt-1.5">JPG, PNG, WEBP, or GIF. Max 5MB.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0d0d11] p-6 rounded-2xl border border-white/5 space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pb-2 border-b border-white/5">
            Profile Banner
          </h2>

          <div className="space-y-3">
            <div className="h-32 rounded-xl overflow-hidden border border-white/10 relative bg-gradient-to-r from-zinc-900 via-zinc-950 to-black">
              {(bannerPreview || user?.banner) ? (
                <img
                  src={bannerPreview || user?.banner}
                  alt="Banner preview"
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                  Default gradient banner
                </div>
              )}
            </div>

            <div>
              <label className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-semibold rounded-full border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-200 hover:text-white cursor-pointer transition-colors select-none">
                <ImageIcon size={14} className="text-zinc-300" />
                <span>Choose New Banner</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleBannerSelect}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-zinc-500 mt-1.5">Wide landscape image recommended. Max 5MB.</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0d0d11] p-6 rounded-2xl border border-white/5 space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pb-2 border-b border-white/5">
            Public Information
          </h2>

          <form onSubmit={handleSaveChanges} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full bg-[#141419] border border-white/5 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-500 cursor-not-allowed select-none"
              />
              <p className="text-[11px] text-zinc-600 mt-1">Usernames cannot be altered.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Display Name ({displayName.length}/50)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                required
                className="w-full bg-[#141419] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 focus:border-white/30 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Bio ({bio.length}/500)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Tell the community about yourself, your interests, or work..."
                className="w-full bg-[#141419] border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 outline-none transition-colors resize-y leading-relaxed"
              />
            </div>
          </form>
        </div>

        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl bg-[#111216] border border-white/10 rounded-2xl px-5 py-4 shadow-2xl shadow-black/90 flex items-center justify-between gap-4 backdrop-blur-xl select-none"
            >
              <span className="text-xs sm:text-sm font-semibold text-zinc-200 truncate">
                Careful — you have unsaved changes!
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:underline transition-all cursor-pointer disabled:opacity-50"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={saving || !displayName.trim()}
                  className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
