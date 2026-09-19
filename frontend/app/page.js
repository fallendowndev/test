'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import { api } from './lib/api';
import PostCard from './components/PostCard';
import Avatar from './components/Avatar';
import LoadingSpinner from './components/LoadingSpinner';
import Pagination from './components/Pagination';
import { Plus, Clock, Flame, FileText, Sparkles, ShieldCheck } from 'lucide-react';

function HomeFeed() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const sort = searchParams.get('sort') || 'latest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto px-2 md:px-4 py-4">
      <div className="flex-1 min-w-0 space-y-3">
        <div className="card bg-white p-3 rounded border border-[#ccc] flex items-center gap-3">
          <Avatar src={user?.avatar} username={user?.username} size={38} />
          <input
            type="text"
            readOnly
            onClick={() => router.push(user ? '/create' : '/login')}
            placeholder={user ? "Create a post" : "Log in to create a post"}
            className="flex-1 bg-[#f8f9fa] hover:bg-white border border-[#edeff1] hover:border-[#0079d3] rounded px-4 py-2 text-sm text-[#7c7c7c] cursor-pointer transition-colors"
          />
          <Link
            href={user ? '/create' : '/login'}
            className="p-2 text-[#7c7c7c] hover:bg-[#edeff1] rounded transition-colors"
            title="Create Post"
          >
            <Plus size={20} />
          </Link>
        </div>

        <div className="card bg-white p-2 rounded border border-[#ccc] flex items-center gap-2 text-sm font-semibold">
          <Link
            href={`/?sort=latest`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
              sort === 'latest'
                ? 'bg-[#edeff1] text-[#0079d3]'
                : 'text-[#7c7c7c] hover:bg-[#f8f9fa]'
            }`}
          >
            <Clock size={16} />
            <span>Latest</span>
          </Link>

          <Link
            href={`/?sort=popular`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
              sort === 'popular'
                ? 'bg-[#edeff1] text-[#0079d3]'
                : 'text-[#7c7c7c] hover:bg-[#f8f9fa]'
            }`}
          >
            <Flame size={16} />
            <span>Popular</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="card bg-white p-6 rounded border border-red-200 text-center text-red-600">
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchPosts}
              className="mt-3 px-4 py-1.5 bg-[#0079d3] text-white rounded text-sm font-semibold"
            >
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="card bg-white p-12 text-center rounded border border-[#ccc]">
            <FileText className="w-16 h-16 mx-auto mb-3 text-[#ccc]" strokeWidth={1.5} />
            <h3 className="text-base font-bold text-[#1c1c1c] mb-1">No posts found</h3>
            <p className="text-xs text-[#7c7c7c] mb-4">Be the very first community member to publish something!</p>
            <Link
              href={user ? '/create' : '/login'}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#0079d3] hover:bg-[#006cbd] text-white text-sm font-semibold"
            >
              <Plus size={16} />
              Create Post
            </Link>
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

      <aside className="w-full lg:w-80 space-y-4 shrink-0">
        <div className="card bg-white rounded border border-[#ccc] overflow-hidden">
          <div className="bg-[#0079d3] h-10 p-3"></div>
          <div className="p-4">
            <h2 className="font-bold text-base text-[#1c1c1c] mb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-[#0079d3]" />
              <span>About Just Blog!</span>
            </h2>
            <p className="text-xs text-[#7c7c7c] leading-relaxed mb-4">
              A shared community platform inspired by Reddit &amp; YouTube discussions. Share insights, debate, upvote great ideas, and reply in recursive comment threads.
            </p>

            <div className="border-t border-b border-[#edeff1] py-3 my-3 text-xs flex justify-between text-[#7c7c7c]">
              <div>
                <span className="block font-bold text-[#1c1c1c] text-sm">{totalPosts}</span>
                <span>Posts</span>
              </div>
              <div>
                <span className="block font-bold text-[#1c1c1c] text-sm">Active</span>
                <span>Community</span>
              </div>
            </div>

            <Link
              href={user ? '/create' : '/login'}
              className="block w-full text-center py-2 px-4 rounded-full bg-[#0079d3] hover:bg-[#006cbd] text-white text-sm font-semibold transition-colors"
            >
              Create Post
            </Link>
          </div>
        </div>

        <div className="card bg-white p-4 rounded border border-[#ccc]">
          <h3 className="font-bold text-sm text-[#1c1c1c] mb-3 pb-2 border-b border-[#edeff1] flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#0079d3]" />
            Community Guidelines
          </h3>
          <ol className="text-xs text-[#7c7c7c] space-y-2 list-decimal list-inside">
            <li>Be respectful and constructive in comments.</li>
            <li>No spam, excessive self-promotion, or abusive content.</li>
            <li>Keep discussions relevant to the community.</li>
            <li>Report rule-breaking content to keep the feed clean.</li>
          </ol>
        </div>

        <div className="text-[11px] text-[#7c7c7c] px-2 leading-relaxed">
          <p>© {new Date().getFullYear()} Just Blog! — Built for authentic community discussion.</p>
        </div>
      </aside>
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
