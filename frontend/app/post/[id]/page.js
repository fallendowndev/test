'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import PostCard from '../../components/PostCard';
import CommentTree from '../../components/CommentTree';
import LoadingSpinner from '../../components/LoadingSpinner';
import Avatar from '../../components/Avatar';
import { formatRelativeTime } from '../../lib/format';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    try {
      setLoading(true);
      setError('');
      const res = await api(`/posts/${postId}`);
      if (res.success && res.data?.post) {
        setPost(res.data.post);
      } else {
        setError('Post not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handlePostDeleted = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-[#0d0d11] p-8 rounded-2xl border border-white/5 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-lg font-bold text-zinc-100">{error || 'Post not found'}</h2>
          <p className="text-xs text-zinc-400">The discussion you are looking for does not exist or has been removed.</p>
          <Link
            href="/"
            className="inline-block px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors"
          >
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const author = post.author || {};

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-4">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/5 hover:border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Feed</span>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 bg-[#0d0d11] rounded-2xl border border-white/5 p-4 sm:p-5 space-y-3">
          <PostCard
            post={post}
            isDetail={true}
            onDelete={handlePostDeleted}
          />

          <CommentTree
            postId={post._id}
            postOwnerId={author._id}
            initialCommentCount={post.commentCount || 0}
          />
        </div>

        <aside className="w-full lg:w-72 space-y-4 shrink-0">
          <div className="bg-[#0d0d11] rounded-2xl border border-white/5 p-5 space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              About the Author
            </h3>
            <div className="flex items-center gap-3">
              <Avatar src={author.avatar} username={author.username} size={44} />
              <div className="min-w-0">
                <Link
                  href={`/profile/${author.username}`}
                  className="font-bold text-sm text-zinc-100 hover:text-white block truncate transition-colors"
                >
                  {author.displayName || author.username}
                </Link>
                <span className="text-xs text-zinc-500 block truncate">
                  u/{author.username}
                </span>
              </div>
            </div>

            {author.bio && (
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                {author.bio}
              </p>
            )}

            <div className="pt-3 border-t border-white/5 text-xs text-zinc-500 space-y-1">
              <div className="flex justify-between">
                <span>Published</span>
                <span className="font-semibold text-zinc-300">
                  {formatRelativeTime(post.createdAt)}
                </span>
              </div>
            </div>

            <Link
              href={`/profile/${author.username}`}
              className="block w-full text-center py-2 px-3 rounded-xl border border-white/10 hover:border-white/25 bg-white/[0.02] hover:bg-white/5 text-zinc-200 hover:text-white text-xs font-semibold transition-all"
            >
              View Author Profile
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
