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
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="card bg-white p-8 rounded border border-red-200">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <h2 className="text-lg font-bold text-[#1c1c1c] mb-2">{error || 'Post not found'}</h2>
          <p className="text-xs text-[#7c7c7c] mb-4">The post you are looking for might have been deleted or does not exist.</p>
          <Link
            href="/"
            className="inline-block px-5 py-2 rounded-full bg-[#0079d3] hover:bg-[#006cbd] text-white text-sm font-semibold"
          >
            Back to Home Feed
          </Link>
        </div>
      </div>
    );
  }

  const author = post.author || {};

  return (
    <div className="max-w-5xl mx-auto px-2 md:px-4 py-4">
      <div className="mb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7c7c7c] hover:text-[#1c1c1c] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Feed</span>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          <PostCard
            post={post}
            isDetail={true}
            onDelete={handlePostDeleted}
          />

          <CommentTree
            postId={post._id}
            initialCommentCount={post.commentCount || 0}
          />
        </div>

        <aside className="w-full lg:w-72 space-y-4 shrink-0">
          <div className="card bg-white rounded border border-[#ccc] p-4">
            <h3 className="text-xs font-bold text-[#7c7c7c] uppercase tracking-wider mb-3">
              About the Author
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <Avatar src={author.avatar} username={author.username} size={48} />
              <div className="min-w-0">
                <Link
                  href={`/profile/${author.username}`}
                  className="font-bold text-sm text-[#1c1c1c] hover:underline block truncate"
                >
                  {author.displayName || author.username}
                </Link>
                <span className="text-xs text-[#7c7c7c] block truncate">
                  u/{author.username}
                </span>
              </div>
            </div>

            {author.bio && (
              <p className="text-xs text-[#7c7c7c] leading-relaxed mb-3 line-clamp-3">
                {author.bio}
              </p>
            )}

            <div className="pt-3 border-t border-[#edeff1] text-xs text-[#7c7c7c] space-y-1">
              <div>
                <span>Posted: </span>
                <span className="font-semibold text-[#1c1c1c]">
                  {formatRelativeTime(post.createdAt)}
                </span>
              </div>
            </div>

            <Link
              href={`/profile/${author.username}`}
              className="mt-4 block w-full text-center py-1.5 px-3 rounded-full border border-[#0079d3] text-[#0079d3] hover:bg-[#0079d3]/10 text-xs font-semibold transition-colors"
            >
              View Profile
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
