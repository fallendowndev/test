'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import Avatar from '../../components/Avatar';
import PostCard from '../../components/PostCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import { Edit3 } from 'lucide-react';

export default function ProfilePage() {
  const params = useParams();
  const { username } = params;
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="card bg-white p-8 rounded border border-red-200">
          <h2 className="text-xl font-bold text-[#1c1c1c] mb-2">{error || 'User not found'}</h2>
          <p className="text-xs text-[#7c7c7c] mb-4">The community member you are looking for does not exist.</p>
          <Link
            href="/"
            className="inline-block px-5 py-2 rounded-full bg-[#0079d3] text-white text-sm font-semibold"
          >
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 md:px-4 py-4 space-y-6">
      <div className="card bg-white rounded border border-[#ccc] overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#0079d3] to-[#005596]"></div>

        <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-end gap-4 -mt-12">
            <div className="ring-4 ring-white rounded-full bg-white">
              <Avatar src={profile.avatar} username={profile.username} size={88} />
            </div>
            <div className="mb-1">
              <h1 className="text-2xl font-bold text-[#1c1c1c]">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-sm text-[#7c7c7c]">u/{profile.username}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {isOwnProfile && (
              <Link
                href="/settings"
                className="px-4 py-2 rounded-full border border-[#0079d3] text-[#0079d3] hover:bg-[#0079d3]/10 text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                <Edit3 size={15} />
                <span>Edit Profile</span>
              </Link>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 border-t border-[#edeff1] flex flex-col md:flex-row gap-6 justify-between">
          <div className="max-w-2xl">
            <h3 className="text-xs font-bold text-[#7c7c7c] uppercase tracking-wider mb-1">About</h3>
            <p className="text-sm text-[#1c1c1c] leading-relaxed whitespace-pre-line">
              {profile.bio || 'This user has not set a bio yet.'}
            </p>
          </div>

          <div className="flex gap-6 shrink-0 text-sm">
            <div>
              <span className="block font-bold text-[#1c1c1c] text-lg">{profile.postCount || 0}</span>
              <span className="text-xs text-[#7c7c7c]">Posts</span>
            </div>
            <div>
              <span className="block font-bold text-[#1c1c1c] text-lg">
                {new Date(profile.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="text-xs text-[#7c7c7c]">Joined</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-[#1c1c1c] uppercase tracking-wider mb-3">
          Posts by u/{profile.username} ({profile.postCount || 0})
        </h2>

        {postsLoading ? (
          <div className="py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : posts.length === 0 ? (
          <div className="card bg-white p-8 text-center rounded border border-[#ccc]">
            <p className="text-sm text-[#7c7c7c]">u/{profile.username} hasn&apos;t posted anything yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onDelete={handlePostDeleted}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pt-4 flex justify-center">
            <Pagination
              page={page}
              pages={totalPages}
              baseUrl={`/profile/${username}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
