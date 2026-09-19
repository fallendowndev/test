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
    <div className="max-w-4xl mx-auto px-2 md:px-4 py-6 space-y-6">
      <div className="card bg-white p-4 rounded border border-[#ccc]">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c7c7c]"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2 border border-[#ccc] rounded text-sm focus:border-[#0079d3] transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded bg-[#0079d3] hover:bg-[#006cbd] text-white text-sm font-semibold transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {query && (
        <div className="flex items-center justify-between text-xs text-[#7c7c7c]">
          <span>
            Search results for <strong className="text-[#1c1c1c] font-semibold">&ldquo;{query}&rdquo;</strong>
          </span>
          <span>{total} {total === 1 ? 'post' : 'posts'} found</span>
        </div>
      )}

      {loading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="card bg-white p-6 rounded border border-red-200 text-center text-red-600">
          <p className="font-semibold">{error}</p>
        </div>
      ) : !query.trim() ? (
        <div className="card bg-white p-12 text-center rounded border border-[#ccc]">
          <p className="text-sm text-[#7c7c7c]">Enter a search term above to find posts and discussions.</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="card bg-white p-12 text-center rounded border border-[#ccc]">
          <h3 className="text-base font-bold text-[#1c1c1c] mb-1">No results found</h3>
          <p className="text-xs text-[#7c7c7c]">Try searching with different keywords or check your spelling.</p>
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
