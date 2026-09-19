'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime } from '../lib/format';
import Avatar from './Avatar';
import VoteControls from './VoteControls';
import { api } from '../lib/api';
import { MessageSquare, Share2, Flag, Trash2 } from 'lucide-react';

export default function PostCard({ post, onDelete, isDetail = false }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportStatus, setReportStatus] = useState(null);
  const [reportMessage, setReportMessage] = useState('');

  const author = post.author || {};
  const isAuthor = user && (user.id === author._id || user._id === author._id || user.username === author.username);

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await api(`/posts/${post._id}`, { method: 'DELETE' });
      if (onDelete) {
        onDelete(post._id);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete post');
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
          targetType: 'post',
          targetId: post._id,
          reason: reportReason.trim(),
        },
      });
      setReportStatus('success');
      setReportMessage('Report submitted. Thank you for keeping the community safe.');
      setTimeout(() => {
        setShowReportModal(false);
        setReportStatus(null);
        setReportReason('');
      }, 2000);
    } catch (err) {
      setReportStatus('error');
      setReportMessage(err.message || 'Failed to submit report');
    }
  };

  return (
    <article className="card bg-white rounded border border-[#ccc] hover:border-[#898989] transition-colors overflow-hidden flex flex-col md:flex-row">
      <div className="hidden md:flex flex-col items-center justify-start p-2 bg-[#f8f9fa] border-r border-[#edeff1] w-12 shrink-0">
        <VoteControls
          postId={post._id}
          initialScore={post.score ?? 0}
          initialVote={post.userVote ?? null}
        />
      </div>

      <div className="flex-1 p-3 md:p-4 flex flex-col min-w-0">
        <div className="flex items-center gap-2 text-xs text-[#7c7c7c] mb-2 flex-wrap">
          <Link
            href={`/profile/${author.username}`}
            className="flex items-center gap-1.5 font-medium text-[#1c1c1c] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar src={author.avatar} username={author.username} size={20} />
            <span>u/{author.username || 'unknown'}</span>
          </Link>
          <span>•</span>
          <span title={new Date(post.createdAt).toLocaleString()}>
            {formatRelativeTime(post.createdAt)}
          </span>
          {post.updatedAt && post.updatedAt !== post.createdAt && (
            <span className="italic text-[11px]">(edited)</span>
          )}
        </div>

        {isDetail ? (
          <h1 className="text-xl font-bold text-[#1c1c1c] mb-3 break-words">
            {post.title}
          </h1>
        ) : (
          <Link href={`/post/${post._id}`} className="group mb-2 block">
            <h2 className="text-lg font-semibold text-[#1c1c1c] group-hover:text-[#0079d3] transition-colors break-words">
              {post.title}
            </h2>
          </Link>
        )}

        {post.content && (
          <div
            className={`text-sm text-[#222222] whitespace-pre-line break-words mb-3 leading-relaxed ${
              !isDetail ? 'line-clamp-4' : ''
            }`}
          >
            {post.content}
          </div>
        )}

        {post.image && (
          <div className="mb-3 rounded overflow-hidden max-h-[500px] bg-black/5 flex justify-center items-center">
            <img
              src={post.image}
              alt={post.title}
              className="max-h-[500px] w-auto max-w-full object-contain rounded"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-[#7c7c7c] font-semibold mt-auto pt-2 border-t border-[#edeff1]">
          <div className="flex md:hidden items-center">
            <VoteControls
              postId={post._id}
              initialScore={post.score ?? 0}
              initialVote={post.userVote ?? null}
              horizontal
            />
          </div>

          <div className="flex items-center gap-1 md:gap-3 flex-wrap">
            <Link
              href={`/post/${post._id}`}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#edeff1] transition-colors text-[#7c7c7c] hover:text-[#1c1c1c]"
            >
              <MessageSquare size={14} />
              <span>
                {post.commentCount || 0} {post.commentCount === 1 ? 'Comment' : 'Comments'}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#edeff1] transition-colors text-[#7c7c7c] hover:text-[#1c1c1c]"
            >
              <Share2 size={14} />
              <span>{copied ? 'Copied Link!' : 'Share'}</span>
            </button>

            {user && !isAuthor && (
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#edeff1] transition-colors text-[#7c7c7c] hover:text-[#1c1c1c]"
              >
                <Flag size={14} />
                <span>Report</span>
              </button>
            )}

            {isAuthor && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#fee2e2] text-[#ea0027] transition-colors ml-auto"
              >
                <Trash2 size={14} />
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-xl">
            <h3 className="text-lg font-bold mb-2">Report Post</h3>
            <p className="text-xs text-[#7c7c7c] mb-4">
              Help us understand what is wrong with this post.
            </p>

            {reportMessage && (
              <div
                className={`p-3 rounded text-sm mb-4 ${
                  reportStatus === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {reportMessage}
              </div>
            )}

            {reportStatus !== 'success' && (
              <form onSubmit={handleReport}>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Reason for reporting (e.g. spam, harassment, inappropriate content)..."
                  required
                  rows={3}
                  className="w-full border border-[#ccc] rounded p-2 text-sm focus:outline-none focus:border-[#0079d3] mb-4 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-1.5 text-sm rounded border border-[#ccc] hover:bg-[#f8f9fa]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportStatus === 'submitting'}
                    className="px-4 py-1.5 text-sm rounded bg-[#ea0027] hover:bg-[#cc0022] text-white font-medium disabled:opacity-50"
                  >
                    {reportStatus === 'submitting' ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
