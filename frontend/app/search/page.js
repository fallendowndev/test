'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../lib/api';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { Search } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(query);
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchResults = useCallback(async () => {
    if (!query.trim()) {
      setPosts([]);
      setTotal(0);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api(`/search?q=${encodeURIComponent(query)}&page=${page}&limit=15`);
      if (res.success && res.data) {
        setPosts(res.data.posts || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to perform search');
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    setSearchInput(query);
    fetchResults();
  }, [query, fetchResults]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
  };

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      <div className="bg-[#0d0d11] p-3.5 rounded-2xl border border-white/5">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search posts and discussions..."
              className="w-full pl-10 pr-4 py-2 bg-[#141419] border border-white/10 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {query && (
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span>
            Results for <strong className="text-zinc-100 font-semibold">&ldquo;{query}&rdquo;</strong>
          </span>
          <span>{total} {total === 1 ? 'post' : 'posts'}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-[#0d0d11] p-6 rounded-2xl border border-red-500/20 text-center text-red-400 text-xs">
          <p className="font-semibold">{error}</p>
        </div>
      ) : !query.trim() ? (
        <div className="bg-[#0d0d11] p-12 text-center rounded-2xl border border-white/5">
          <p className="text-xs text-zinc-400">Type a keyword above to find community posts and discussions.</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-[#0d0d11] p-12 text-center rounded-2xl border border-white/5 space-y-2">
          <h3 className="text-sm font-bold text-zinc-200">No matching posts found</h3>
          <p className="text-xs text-zinc-500">Try searching with broader terms or check spelling.</p>
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
            baseUrl="/search"
            queryParams={{ q: query }}
          />
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
