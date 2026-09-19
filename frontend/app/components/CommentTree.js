'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../lib/api';
import Comment from './Comment';
import CommentForm from './CommentForm';
import LoadingSpinner from './LoadingSpinner';
import Pagination from './Pagination';
import { MessageSquare, ChevronDown, Check } from 'lucide-react';

export default function CommentTree({ postId, postOwnerId = null, initialCommentCount = 0 }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(initialCommentCount);

  const [sortBy, setSortBy] = useState('Best');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const fetchComments = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      setError('');
      const data = await api(`/posts/${postId}/comments?page=${p}&limit=50`);
      if (data.success && data.data) {
        setComments(data.data.comments || []);
        setPage(data.data.page || 1);
        setTotalPages(data.data.pages || 1);
        setTotalComments(data.data.totalComments ?? data.data.totalTopLevel ?? 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  const handleTopLevelCommentAdded = (newComment) => {
    newComment.replies = [];
    setComments((prev) => [newComment, ...prev]);
    setTotalComments((prev) => prev + 1);
  };

  const addReplyToTree = (list, newReply, parentId) => {
    return list.map((item) => {
      if (item._id === parentId) {
        return {
          ...item,
          replies: [...(item.replies || []), { ...newReply, replies: [] }],
        };
      }
      if (item.replies && item.replies.length > 0) {
        return {
          ...item,
          replies: addReplyToTree(item.replies, newReply, parentId),
        };
      }
      return item;
    });
  };

  const handleReplyAdded = (newReply, parentId) => {
    setComments((prev) => addReplyToTree(prev, newReply, parentId));
    setTotalComments((prev) => prev + 1);
  };

  const updateCommentInTree = (list, updated) => {
    return list.map((item) => {
      if (item._id === updated._id) {
        return { ...item, content: updated.content, updatedAt: updated.updatedAt };
      }
      if (item.replies && item.replies.length > 0) {
        return { ...item, replies: updateCommentInTree(item.replies, updated) };
      }
      return item;
    });
  };

  const handleCommentUpdated = (updated) => {
    setComments((prev) => updateCommentInTree(prev, updated));
  };

  const deleteCommentInTree = (list, deletedId) => {
    return list
      .map((item) => {
        if (item._id === deletedId) {
          if (item.replies && item.replies.length > 0) {
            return {
              ...item,
              content: null,
              author: null,
              isDeleted: true,
              deletedAt: new Date().toISOString(),
            };
          }
          return null;
        }
        if (item.replies && item.replies.length > 0) {
          return { ...item, replies: deleteCommentInTree(item.replies, deletedId) };
        }
        return item;
      })
      .filter(Boolean);
  };

  const handleCommentDeleted = (deletedId) => {
    setComments((prev) => deleteCommentInTree(prev, deletedId));
    setTotalComments((prev) => Math.max(0, prev - 1));
  };

  // Filter and sort comments
  const processedComments = useMemo(() => {
    let list = [...comments];

    if (sortBy === 'New') {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'Best' || sortBy === 'Top') {
      list.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (b.likeCount || 0) - (a.likeCount || 0);
      });
    }

    return list;
  }, [comments, sortBy]);

  return (
    <div className="pt-3 space-y-4">
      {/* Join the Conversation Form */}
      <div>
        <CommentForm postId={postId} onCommentAdded={handleTopLevelCommentAdded} />
      </div>

      {/* Sort By row */}
      <div className="flex items-center gap-3 pt-1 text-xs select-none">
        {/* Sort By Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            className="flex items-center gap-1 font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <span>Sort by:</span>
            <span className="text-zinc-200 font-bold">{sortBy}</span>
            <ChevronDown size={14} className={`transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {sortDropdownOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setSortDropdownOpen(false)} />
              <div className="absolute left-0 top-full mt-1.5 w-32 rounded-xl bg-[#141419] border border-white/10 p-1 shadow-xl z-30 space-y-0.5">
                {['Best', 'Top', 'New'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSortBy(s);
                      setSortDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between text-xs text-zinc-200 transition-colors cursor-pointer"
                  >
                    <span>{s}</span>
                    {sortBy === s && <Check size={12} className="text-white" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Comment List */}
      {loading ? (
        <div className="py-12">
          <LoadingSpinner size="md" />
        </div>
      ) : error ? (
        <div className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</div>
      ) : processedComments.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-600">
            <MessageSquare size={18} />
          </div>
          <p className="font-semibold text-xs text-zinc-300">
            {searchQuery ? 'No matching comments found' : 'No comments yet'}
          </p>
          <p className="text-[11px] text-zinc-500">
            {searchQuery ? 'Try another keyword' : 'Be the first to share your thoughts on this topic.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {processedComments.map((comment) => (
            <div key={comment._id}>
              <Comment
                comment={comment}
                postId={postId}
                postOwnerId={postOwnerId}
                onReplyAdded={handleReplyAdded}
                onCommentUpdated={handleCommentUpdated}
                onCommentDeleted={handleCommentDeleted}
                depth={0}
              />
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 pt-4 border-t border-white/5">
          <Pagination
            page={page}
            pages={totalPages}
            baseUrl={`/post/${postId}`}
            queryParams={{}}
          />
        </div>
      )}
    </div>
  );
}
