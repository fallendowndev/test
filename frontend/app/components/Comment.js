'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatRelativeTime } from '../lib/format';
import Avatar from './Avatar';
import CommentForm from './CommentForm';
import { api } from '../lib/api';
import { ChevronDown, ChevronRight, Reply, Edit3, Trash2, Flag, X, Send, Pin, ThumbsUp } from 'lucide-react';

export default function Comment({
  comment,
  postId,
  postOwnerId = null,
  onReplyAdded,
  onCommentUpdated,
  onCommentDeleted,
  depth = 0,
}) {
  const { user } = useAuth();
  const { toast } = useNotification();
  const [collapsed, setCollapsed] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || '');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Like & Pin state
  const [likeCount, setLikeCount] = useState(comment.likeCount ?? (comment.likes?.length || 0));
  const [isLiked, setIsLiked] = useState(Boolean(comment.isLiked));
  const [isLiking, setIsLiking] = useState(false);
  const [isPinned, setIsPinned] = useState(Boolean(comment.isPinned));
  const [isPinning, setIsPinning] = useState(false);

  const author = comment.author;
  const isDeleted = Boolean(comment.deletedAt || comment.isDeleted);
  const isAuthor = !isDeleted && user && author && (user.id === author._id || user._id === author._id || user.username === author.username);
  const isOP = postOwnerId && author && (author._id === postOwnerId || author.id === postOwnerId);
  const isPostOwner = user && postOwnerId && (user.id === postOwnerId || user._id === postOwnerId);

  const handleToggleLike = async () => {
    if (!user) {
      toast.info('Please log in to like comments');
      return;
    }
    try {
      setIsLiking(true);
      const res = await api(`/comments/${comment._id}/like`, { method: 'POST' });
      if (res.success && res.data) {
        setLikeCount(res.data.likeCount);
        setIsLiked(res.data.isLiked);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to like comment');
    } finally {
      setIsLiking(false);
    }
  };

  const handleTogglePin = async () => {
    if (!isPostOwner) return;
    try {
      setIsPinning(true);
      const res = await api(`/comments/${comment._id}/pin`, { method: 'POST' });
      if (res.success && res.data) {
        setIsPinned(res.data.isPinned);
        toast.success(res.data.isPinned ? 'Comment pinned to top' : 'Comment unpinned');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to toggle pin');
    } finally {
      setIsPinning(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    try {
      setIsSubmittingEdit(true);
      const res = await api(`/comments/${comment._id}`, {
        method: 'PATCH',
        body: { content: editContent.trim() },
      });

      if (res.success && res.data?.comment) {
        setIsEditing(false);
        toast.success('Comment updated');
        if (onCommentUpdated) {
          onCommentUpdated(res.data.comment);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update comment');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      setIsDeleting(true);
      await api(`/comments/${comment._id}`, { method: 'DELETE' });
      toast.success('Comment deleted');
      if (onCommentDeleted) {
        onCommentDeleted(comment._id);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete comment');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    try {
      setReportSubmitting(true);
      await api('/reports', {
        method: 'POST',
        body: {
          targetType: 'comment',
          targetId: comment._id,
          reason: reportReason.trim(),
        },
      });
      toast.success('Comment reported to moderation');
      setShowReportModal(false);
      setReportReason('');
    } catch (err) {
      toast.error(err.message || 'Failed to report comment');
    } finally {
      setReportSubmitting(false);
    }
  };

  const replies = comment.replies || [];

  return (
    <div className={`text-xs sm:text-sm ${depth > 0 ? 'mt-2 pl-3 md:pl-4 border-l border-white/10 hover:border-white/30 transition-colors' : 'mt-3'}`}>
      <div className="flex items-center gap-2 text-xs text-zinc-400 py-1 select-none flex-wrap">
        {!isDeleted && author ? (
          <Link
            href={`/profile/${author.username}`}
            className="flex items-center gap-1.5 font-semibold text-zinc-100 hover:text-white transition-colors"
          >
            <Avatar src={author.avatar} username={author.username} size={20} />
            <span className="hover:underline">{author.displayName || author.username}</span>
          </Link>
        ) : (
          <span className="italic text-zinc-500">[deleted user]</span>
        )}

        {isOP && (
          <span className="text-[10px] font-bold text-blue-400 px-1 select-none">
            Creator
          </span>
        )}

        {isPinned && (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 rounded-full flex items-center gap-1 select-none">
            <Pin size={10} className="fill-amber-400 text-amber-400" />
            <span>Pinned</span>
          </span>
        )}

        <span className="text-zinc-600">•</span>
        <span title={new Date(comment.createdAt).toLocaleString()} className="text-zinc-500">
          {formatRelativeTime(comment.createdAt)}
        </span>

        {comment.updatedAt && comment.createdAt && (new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 10000) && !isDeleted && (
          <span className="text-zinc-600 text-[11px]">(edited)</span>
        )}
      </div>

      <div className="pt-0.5">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="my-2 space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  dir="auto"
                  required
                  className="w-full bg-[#121217] border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-zinc-100 focus:border-white/30 outline-none resize-none leading-relaxed"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit || !editContent.trim()}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-zinc-200 text-black transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingEdit ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <div
                dir="auto"
                className={`leading-relaxed text-zinc-200 break-words whitespace-pre-line py-1.5 ${
                  isDeleted ? 'italic text-zinc-500' : ''
                }`}
              >
                {isDeleted ? '[This comment has been deleted]' : comment.content}
              </div>
            )}

            {!isDeleted && (
              <div className="flex items-center gap-3.5 text-xs text-zinc-400 font-medium py-1 select-none">
                {/* Like Button */}
                <button
                  type="button"
                  onClick={handleToggleLike}
                  disabled={isLiking}
                  className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isLiked ? 'text-white font-bold' : 'hover:text-zinc-100'
                  }`}
                  title={isLiked ? 'Unlike comment' : 'Like comment'}
                >
                  <ThumbsUp size={13} className={isLiked ? 'fill-white text-white' : ''} />
                  <span>{likeCount > 0 ? likeCount : ''}</span>
                </button>

                {/* Reply */}
                <button
                  type="button"
                  onClick={() => setIsReplying(!isReplying)}
                  className="inline-flex items-center gap-1 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  <Reply size={13} className="text-zinc-400" />
                  <span>Reply</span>
                </button>

                {/* Pin Button (Post Owner only) */}
                {isPostOwner && (
                  <button
                    type="button"
                    onClick={handleTogglePin}
                    disabled={isPinning}
                    className={`inline-flex items-center gap-1 transition-colors cursor-pointer ${
                      isPinned ? 'text-amber-400 font-bold' : 'hover:text-amber-300'
                    }`}
                    title={isPinned ? 'Unpin comment' : 'Pin comment'}
                  >
                    <Pin size={12} className={isPinned ? 'fill-amber-400' : ''} />
                    <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>
                )}

                {isAuthor && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <Edit3 size={11} className="text-black" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </>
                )}

                {user && !isAuthor && (
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="inline-flex items-center gap-1 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <Flag size={13} />
                    <span>Report</span>
                  </button>
                )}
              </div>
            )}

            {isReplying && (
              <div className="my-2">
                <CommentForm
                  postId={postId}
                  parentCommentId={comment._id}
                  onCommentAdded={(newReply) => {
                    setIsReplying(false);
                    if (onReplyAdded) {
                      onReplyAdded(newReply, comment._id);
                    }
                  }}
                  onCancel={() => setIsReplying(false)}
                  placeholder={`Replying to u/${author?.username || 'user'}...`}
                />
              </div>
            )}

            {replies.length > 0 && (
              <div className="replies-container">
                {replies.map((reply) => (
                  <Comment
                    key={reply._id}
                    comment={reply}
                    postId={postId}
                    postOwnerId={postOwnerId}
                    onReplyAdded={onReplyAdded}
                    onCommentUpdated={onCommentUpdated}
                    onCommentDeleted={onCommentDeleted}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
      </div>

      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0e0e12] border border-white/10 rounded-2xl max-w-md w-full p-5 shadow-2xl shadow-black space-y-3"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Flag size={15} className="text-amber-400" />
                  <span>Report Comment</span>
                </h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleReport} className="space-y-3">
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Reason for reporting this comment..."
                  required
                  rows={3}
                  className="w-full bg-[#141419] border border-white/10 rounded-xl p-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-white/30 outline-none resize-none leading-relaxed"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting || !reportReason.trim()}
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>{reportSubmitting ? 'Submitting...' : 'Submit Report'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
