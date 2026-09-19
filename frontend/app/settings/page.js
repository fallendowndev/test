'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Avatar from '../components/Avatar';
import { api } from '../lib/api';
import { Camera, Check, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileMessage({ type: '', text: '' });

      const res = await api('/users/me/profile', {
        method: 'PATCH',
        body: {
          displayName: displayName.trim(),
          bio: bio.trim(),
        },
      });

      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage({ type: 'error', text: 'Avatar must be under 5MB' });
      return;
    }

    setAvatarMessage({ type: '', text: '' });
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    if (!avatarFile) return;

    try {
      setAvatarSaving(true);
      setAvatarMessage({ type: '', text: '' });

      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const res = await api('/users/me/avatar', {
        method: 'PATCH',
        body: formData,
        isFormData: true,
      });

      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setAvatarFile(null);
        setAvatarPreview(null);
        setAvatarMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
      }
    } catch (err) {
      setAvatarMessage({ type: 'error', text: err.message || 'Failed to upload avatar' });
    } finally {
      setAvatarSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1c1c]">User Settings</h1>
          <p className="text-xs text-[#7c7c7c]">Manage your profile and public information</p>
        </div>

        <div className="card bg-white p-6 rounded border border-[#ccc]">
          <h2 className="text-base font-bold text-[#1c1c1c] mb-4 pb-2 border-b border-[#edeff1]">
            Profile Picture
          </h2>

          {avatarMessage.text && (
            <div
              className={`p-3 rounded text-xs mb-4 flex items-center gap-2 ${
                avatarMessage.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {avatarMessage.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              <span>{avatarMessage.text}</span>
            </div>
          )}

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
                <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full border border-[#0079d3] text-[#0079d3] hover:bg-[#0079d3]/10 cursor-pointer transition-colors">
                  <Camera size={14} />
                  <span>Choose New Image</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-[#7c7c7c] mt-1.5">JPG, PNG, WEBP, or GIF. Max 5MB.</p>
              </div>

              {avatarFile && (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={handleAvatarUpload}
                    disabled={avatarSaving}
                    className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#0079d3] text-white hover:bg-[#006cbd] disabled:opacity-50"
                  >
                    {avatarSaving ? 'Uploading...' : 'Save Avatar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full border hover:bg-[#f8f9fa]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card bg-white p-6 rounded border border-[#ccc]">
          <h2 className="text-base font-bold text-[#1c1c1c] mb-4 pb-2 border-b border-[#edeff1]">
            Profile Information
          </h2>

          {profileMessage.text && (
            <div
              className={`p-3 rounded text-xs mb-4 flex items-center gap-2 ${
                profileMessage.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {profileMessage.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#7c7c7c] uppercase mb-1">
                Username
              </label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full border border-[#edeff1] bg-[#f8f9fa] rounded px-3 py-2 text-sm text-[#7c7c7c] cursor-not-allowed"
              />
              <p className="text-[11px] text-[#7c7c7c] mt-1">Usernames cannot be changed.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#7c7c7c] uppercase mb-1">
                Display Name ({displayName.length}/50)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                required
                className="w-full border border-[#ccc] rounded px-3 py-2 text-sm focus:border-[#0079d3] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#7c7c7c] uppercase mb-1">
                Bio ({bio.length}/500)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Tell the community about yourself..."
                className="w-full border border-[#ccc] rounded px-3 py-2 text-sm focus:border-[#0079d3] transition-colors resize-y leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={profileSaving || !displayName.trim()}
                className="px-6 py-2 rounded-full bg-[#0079d3] hover:bg-[#006cbd] text-white font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {profileSaving ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
