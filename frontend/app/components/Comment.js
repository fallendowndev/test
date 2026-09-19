'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime } from '../lib/format';
import Avatar from './Avatar';
import CommentForm from './CommentForm';
import { api } from '../lib/api';
import { ChevronDown, ChevronRight, Reply, Edit3, Trash2, Flag } from 'lucide-react';

export default function Comment({
  comment,
  postId,
  onReplyAdded,
  onCommentUpdated,
  onCommentDeleted,
  depth = 0,
}) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || '');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportStatus, setReportStatus] = useState(null);

  const author = comment.author;
  const isDeleted = Boolean(comment.deletedAt || comment.isDeleted);
  const isAuthor = !isDeleted && user && author && (user.id === author._id || user._id === author._id || user.username === author.username);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    try {
      setIsSubmittingEdit(true);
      setEditError('');
      const res = await api(`/comments/${comment._id}`, {
        method: 'PATCH',
        body: { content: editContent.trim() },
      });

      if (res.success && res.data?.comment) {
        setIsEditing(false);
        if (onCommentUpdated) {
          onCommentUpdated(res.data.comment);
        }
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update comment');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      setIsDeleting(true);
      await api(`/comments/${comment._id}`, { method: 'DELETE' });
      if (onCommentDeleted) {
        onCommentDeleted(comment._id);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    try {
      setReportStatus('submitting');
      await api('/reports', {
        method: 'POST',
        body: {
          targetType: 'comment',
          targetId: comment._id,
          reason: reportReason.trim(),
        },
      });
      setReportStatus('success');
      setTimeout(() => {
        setShowReportModal(false);
        setReportStatus(null);
        setReportReason('');
      }, 1800);
    } catch (err) {
      setReportStatus('error');
      alert(err.message || 'Failed to report comment');
    }
  };

  const replies = comment.replies || [];

  return (
    <div className={`text-sm ${depth > 0 ? 'mt-2 pl-3 md:pl-4 border-l-2 border-[#edeff1] hover:border-[#0079d3]/40 transition-colors' : 'mt-3'}`}>
      <div className="flex items-center gap-2 text-xs text-[#7c7c7c] py-1 select-none">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-0.5 rounded hover:bg-[#edeff1] text-[#7c7c7c] hover:text-[#1c1c1c] transition-colors"
          title={collapsed ? 'Expand comment' : 'Collapse comment'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>

        {!isDeleted && author ? (
          <Link
            href={`/profile/${author.username}`}
            className="flex items-center gap-1.5 font-medium text-[#1c1c1c] hover:underline"
          >
            <Avatar src={author.avatar} username={author.username} size={18} />
            <span>u/{author.username}</span>
          </Link>
        ) : (
          <span className="italic text-[#7c7c7c]">[deleted user]</span>
        )}

        <span>•</span>
        <span title={new Date(comment.createdAt).toLocaleString()}>
          {formatRelativeTime(comment.createdAt)}
        </span>

        {comment.updatedAt && comment.updatedAt !== comment.createdAt && !isDeleted && (
          <span className="italic text-[11px]">(edited)</span>
        )}

        {collapsed && replies.length > 0 && (
          <span className="text-[11px] font-semibold text-[#0079d3]">
            +{replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </span>
        )}
      </div>

      {!collapsed && (
        <div className="pl-6 pt-0.5">
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="my-2">
              {editError && (
                <div className="text-xs text-[#ea0027] mb-1">{editError}</div>
              )}
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                required
                className="w-full border border-[#ccc] rounded p-2 text-sm focus:border-[#0079d3]"
              />
              <div className="flex gap-2 justify-end mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 text-xs rounded border hover:bg-[#f8f9fa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit || !editContent.trim()}
                  className="px-3 py-1 text-xs rounded bg-[#0079d3] text-white hover:bg-[#006cbd]"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <div
              className={`leading-relaxed text-[#1c1c1c] break-words whitespace-pre-line py-1 ${
                isDeleted ? 'italic text-[#7c7c7c]' : ''
              }`}
            >
              {isDeleted ? '[This comment has been deleted]' : comment.content}
            </div>
          )}

          {!isDeleted && (
            <div className="flex items-center gap-3 text-xs text-[#7c7c7c] font-semibold py-1">
              <button
                type="button"
                onClick={() => setIsReplying(!isReplying)}
                className="hover:underline flex items-center gap-1.5"
              >
                <Reply size={13} />
                <span>Reply</span>
              </button>

              {isAuthor && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="hover:underline flex items-center gap-1"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="hover:underline text-[#ea0027] flex items-center gap-1"
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
                  className="hover:underline flex items-center gap-1"
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
                  onReplyAdded={onReplyAdded}
                  onCommentUpdated={onCommentUpdated}
                  onCommentDeleted={onCommentDeleted}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-xl">
            <h3 className="text-lg font-bold mb-2">Report Comment</h3>
            {reportStatus === 'success' ? (
              <div className="text-sm text-green-700 bg-green-50 p-3 rounded">
                Report submitted successfully.
              </div>
            ) : (
              <form onSubmit={handleReport}>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Reason for reporting this comment..."
                  required
                  rows={3}
                  className="w-full border border-[#ccc] rounded p-2 text-sm focus:border-[#0079d3] mb-4 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3 py-1.5 text-xs rounded border hover:bg-[#f8f9fa]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportStatus === 'submitting'}
                    className="px-3 py-1.5 text-xs rounded bg-[#ea0027] text-white hover:bg-[#cc0022]"
                  >
                    {reportStatus === 'submitting' ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
