'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import Comment from './Comment';
import CommentForm from './CommentForm';
import LoadingSpinner from './LoadingSpinner';
import Pagination from './Pagination';
import { MessageSquare } from 'lucide-react';

export default function CommentTree({ postId, initialCommentCount = 0 }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(initialCommentCount);

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

  return (
    <div className="card bg-white p-4 md:p-5 rounded border border-[#ccc]">
      <div className="mb-6">
        <h2 className="text-sm font-bold text-[#1c1c1c] uppercase tracking-wider mb-3">
          Comments ({totalComments})
        </h2>
        <CommentForm postId={postId} onCommentAdded={handleTopLevelCommentAdded} />
      </div>

      {loading ? (
        <div className="py-8">
          <LoadingSpinner size="md" />
        </div>
      ) : error ? (
        <div className="text-sm text-[#ea0027] bg-[#fee2e2] p-3 rounded">{error}</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-[#7c7c7c]">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 text-[#ccc]" strokeWidth={1.5} />
          <p className="font-semibold text-sm">No comments yet</p>
          <p className="text-xs">Be the first to share what you think!</p>
        </div>
      ) : (
        <div className="space-y-4 divide-y divide-[#edeff1]">
          {comments.map((comment) => (
            <div key={comment._id} className="pt-3 first:pt-0">
              <Comment
                comment={comment}
                postId={postId}
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
        <div className="mt-6 pt-4 border-t border-[#edeff1]">
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
