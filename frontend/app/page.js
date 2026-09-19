'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import { api } from './lib/api';
import PostCard from './components/PostCard';
import Avatar from './components/Avatar';
import LoadingSpinner from './components/LoadingSpinner';
import Pagination from './components/Pagination';
import { ImageIcon } from 'lucide-react';

function HomeFeed() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef(null);

  const sort = searchParams.get('sort') || 'latest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handlePicClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        sessionStorage.setItem('pendingPostMedia', reader.result);
        sessionStorage.setItem('pendingPostMediaName', file.name);
        sessionStorage.setItem('pendingPostMediaType', file.type);
      } catch {}
      router.push('/create');
    };
    reader.readAsDataURL(file);
  };

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api(`/posts?sort=${sort}&page=${page}&limit=15`);
      if (res.success && res.data) {
        setPosts(res.data.posts || []);
        setTotalPages(res.data.pages || 1);
        setTotalPosts(res.data.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [sort, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
    setTotalPosts((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="max-w-2xl mx-auto py-2 space-y-3.5">
      <div className="bg-[#0d0d11] px-3 py-3 rounded-3xl flex items-center gap-3">
        <Avatar src={user?.avatar} username={user?.username} size={38} />
        <input
          type="text"
          readOnly
          onClick={() => router.push(user ? '/create' : '/login')}
          placeholder={user ? `What's on your mind, ${user.displayName || user.username}?` : "Sign in to publish a post..."}
          className="flex-1 bg-[#1a1a22] hover:bg-[#202028] rounded-3xl px-4 py-3 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors outline-none border-0"
        />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
          className="hidden"
          onChange={handleFileSelected}
        />
        <button
          type="button"
          onClick={handlePicClick}
          className="shrink-0 -ml-2 p-1 text-rose-500/85 hover:text-rose-400 transition-colors cursor-pointer"
          title="Add photo or video"
        >
          <ImageIcon size={26} />
        </button>
      </div>

      {loading ? (
        <div className="py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-[#0d0d11] p-6 rounded-2xl border border-red-500/20 text-center text-red-400">
          <p className="font-semibold text-sm">{error}</p>
          <button
            onClick={fetchPosts}
            className="mt-3 px-5 py-2.5 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Try Again
          </button>
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
            baseUrl="/"
            queryParams={{ sort }}
          />
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>}>
      <HomeFeed />
    </Suspense>
  );
}
