'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatRelativeTime } from '../lib/format';
import Avatar from './Avatar';
import { api } from '../lib/api';
import {
  MessageSquare,
  Share2,
  Flag,
  Trash2,
  X,
  Send,
  Link2,
  ExternalLink,
  MoreHorizontal,
  Edit3,
  ThumbsUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function PostCard({ post, onDelete, isDetail = false }) {
  const { user } = useAuth();
  const { toast } = useNotification();
  const router = useRouter();

  const [score, setScore] = useState(post.score ?? 0);
  const [userVote, setUserVote] = useState(post.userVote ?? null);
  const [isVoting, setIsVoting] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editContent, setEditContent] = useState(post.content || '');
  const [currentTitle, setCurrentTitle] = useState(post.title || '');
  const [currentContent, setCurrentContent] = useState(post.content || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const author = post.author || {};
  const isAuthor = user && (user.id === author._id || user._id === author._id || user.username === author.username);

  // Genuinely edited check (>10 seconds between created and updated)
  const isEdited = post.updatedAt && post.createdAt && (new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 10000);

  // Image lightbox state
  const postImages = post.images && post.images.length > 0 ? post.images : post.image ? [post.image] : [];
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const openLightbox = (index = 0) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = (e) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % postImages.length);
  };

  const prevImage = (e) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + postImages.length) % postImages.length);
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, postImages.length]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  const handleVote = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Please log in to like posts');
      router.push('/login');
      return;
    }
    if (isVoting) return;
    setIsVoting(true);

    const prevScore = score;
    const prevVote = userVote;
    const isCurrentlyUpvoted = userVote === 1;

    if (isCurrentlyUpvoted) {
      setUserVote(null);
      setScore((prev) => prev - 1);
    } else {
      setUserVote(1);
      setScore((prev) => prev + (prevVote === -1 ? 2 : 1));
    }

    try {
      if (isCurrentlyUpvoted) {
        const data = await api(`/posts/${post._id}/vote`, { method: 'DELETE' });
        if (data.success && data.data) {
          setScore(data.data.score);
          setUserVote(data.data.userVote);
        }
      } else {
        const data = await api(`/posts/${post._id}/vote`, {
          method: 'POST',
          body: { value: 1 },
        });
        if (data.success && data.data) {
          setScore(data.data.score);
          setUserVote(data.data.userVote);
        }
      }
    } catch (err) {
      setUserVote(prevVote);
      setScore(prevScore);
      toast.error(err.message || 'Vote failed');
    } finally {
      setIsVoting(false);
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
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
      toast.success('Post deleted successfully');
      if (onDelete) {
        onDelete(post._id);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    try {
      setIsSavingEdit(true);
      const res = await api(`/posts/${post._id}`, {
        method: 'PATCH',
        body: { title: editTitle.trim(), content: editContent.trim() },
      });
      if (res.success && res.data?.post) {
        setCurrentTitle(res.data.post.title);
        setCurrentContent(res.data.post.content);
        toast.success('Post updated successfully!');
        setIsEditing(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update post');
    } finally {
      setIsSavingEdit(false);
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
          targetType: 'post',
          targetId: post._id,
          reason: reportReason.trim(),
        },
      });
      toast.success('Report submitted to moderation');
      setShowReportModal(false);
      setReportReason('');
    } catch (err) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <article
      className={
        isDetail
          ? "flex flex-col"
          : "bg-[#0d0d11] hover:bg-[#121217] rounded-2xl border border-white/5 transition-colors overflow-hidden p-4 md:p-5 flex flex-col group"
      }
    >
      {/* Header: User Info + Actions + 3-Dots Menu all on same row */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5 text-xs text-zinc-400 flex-wrap min-w-0">
          <Link
            href={`/profile/${author.username}`}
            className="inline-flex items-center gap-2 text-zinc-100 hover:text-white font-semibold transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar src={author.avatar} username={author.username} size={34} />
            <span className="text-sm font-bold">{author.displayName || author.username || 'unknown'}</span>
          </Link>

          <span className="text-zinc-600">•</span>
          <span title={new Date(post.createdAt).toLocaleString()} className="text-zinc-500">
            {formatRelativeTime(post.createdAt)}
          </span>

          {isEdited && (
            <span className="text-zinc-600 text-[11px]">(edited)</span>
          )}
        </div>

        {/* Actions + 3-dots on the right */}
        <div className="flex items-center gap-3 shrink-0 text-zinc-400">

          {/* 3-dots Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="More options"
            >
              <MoreHorizontal size={18} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1 w-36 bg-[#141419] border border-white/10 rounded-xl shadow-2xl shadow-black z-30 p-1 space-y-0.5"
                >
                  {isAuthor && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuOpen(false);
                          setIsEditing(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <Edit3 size={13} />
                        <span>Edit post</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuOpen(false);
                          handleDelete(e);
                        }}
                        disabled={isDeleting}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <Trash2 size={13} />
                        <span>{isDeleting ? 'Deleting...' : 'Delete post'}</span>
                      </button>
                    </>
                  )}

                  {user && !isAuthor && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpen(false);
                        setShowReportModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      <Flag size={13} />
                      <span>Report post</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Editing Mode */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="my-2 space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
            maxLength={300}
            className="w-full bg-[#141419] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:border-white/30 outline-none"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="w-full bg-[#141419] border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-zinc-100 focus:border-white/30 outline-none resize-y"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditTitle(currentTitle);
                setEditContent(currentContent);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingEdit || !editTitle.trim()}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-white hover:bg-zinc-200 text-black cursor-pointer disabled:opacity-40"
            >
              {isSavingEdit ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Post Title */}
          {isDetail ? (
            <h1 dir="auto" className="text-xl sm:text-2xl font-black text-zinc-100 mb-3 break-words tracking-tight">
              {currentTitle}
            </h1>
          ) : (
            <Link href={`/post/${post._id}`} className="block mb-2">
              <h2 dir="auto" className="text-base sm:text-lg font-bold text-zinc-100 group-hover:text-white transition-colors break-words tracking-tight">
                {currentTitle}
              </h2>
            </Link>
          )}

          {/* Post Content */}
          {currentContent && (
            <div
              dir="auto"
              className={`text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line break-words mb-3 ${
                !isDetail ? 'line-clamp-3' : ''
              }`}
            >
              {currentContent}
            </div>
          )}
        </>
      )}

      {/* Link Attachment Preview */}
      {post.link && (
        <a
          href={post.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mb-3 p-3 rounded-xl bg-[#141419] hover:bg-[#181820] border border-white/10 hover:border-white/25 transition-all flex items-center justify-between gap-3 text-xs text-zinc-300 group/link no-underline select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-white/5 group-hover/link:bg-white/10 text-zinc-300 group-hover/link:text-white transition-colors shrink-0">
              <Link2 size={15} />
            </div>
            <span className="truncate underline font-medium text-zinc-200 group-hover/link:text-white transition-colors">
              {post.link}
            </span>
          </div>
          <ExternalLink size={14} className="text-zinc-500 shrink-0 group-hover/link:text-white transition-colors" />
        </a>
      )}

      {/* Image Attachment */}
      {postImages.length > 0 && (
        <div className="mb-3 rounded-xl overflow-hidden max-h-[460px] bg-black border border-white/5 flex justify-center items-center group/img relative">
          <img
            src={postImages[0]}
            alt={currentTitle}
            className="max-h-[460px] w-auto max-w-full object-contain rounded-lg cursor-zoom-in transition-transform group-hover/img:scale-[1.005]"
            loading="lazy"
            onClick={(e) => {
              e.stopPropagation();
              openLightbox(0);
            }}
          />
          {postImages.length > 1 && (
            <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-sm text-[11px] font-semibold text-white border border-white/15 pointer-events-none">
              1 / {postImages.length}
            </div>
          )}
        </div>
      )}

      {/* Video Attachment */}
      {post.video && (
        <div className="mb-3 rounded-xl overflow-hidden max-h-[480px] bg-black border border-white/5 flex justify-center items-center">
          <video
            src={post.video}
            controls
            preload="metadata"
            className="max-h-[480px] w-full rounded-lg bg-black"
          />
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="flex items-center gap-6 text-xs sm:text-[13px] text-zinc-400 font-medium pt-1.5 mt-1 pl-2 select-none">
        <button
          type="button"
          onClick={handleVote}
          className={`flex items-center gap-2 transition-colors cursor-pointer ${
            userVote === 1 ? 'text-white font-bold' : 'hover:text-white'
          }`}
          title={userVote === 1 ? 'Unlike' : 'Like'}
        >
          <ThumbsUp size={19} className={userVote === 1 ? 'fill-white text-white' : ''} />
          <span>{score}</span>
        </button>

        <Link
          href={`/post/${post._id}`}
          className="flex items-center gap-2 hover:text-white transition-colors select-none"
          title="Comments"
        >
          <MessageSquare size={19} />
          <span>{post.commentCount || 0}</span>
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer select-none"
          title="Share"
        >
          <Share2 size={19} />
        </button>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0e0e12] border border-white/10 rounded-2xl max-w-md w-full p-5 shadow-2xl shadow-black space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Flag size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">Report Content</h3>
                    <p className="text-[11px] text-zinc-400">Flag this post for community guidelines review</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleReport} className="space-y-3">
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Explain why this post violates community standards (e.g. spam, harassment, inappropriate content)..."
                  required
                  rows={4}
                  className="w-full bg-[#141419] border border-white/10 rounded-xl p-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-white/30 outline-none resize-none leading-relaxed"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting || !reportReason.trim()}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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

      {/* Fullscreen Image Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && postImages.length > 0 && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 select-none"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close button outside image at top-right */}
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer z-50 shadow-lg"
              title="Close (Esc)"
              aria-label="Close image preview"
            >
              <X size={24} />
            </button>

            {/* Left arrow outside image */}
            {postImages.length > 1 && (
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer z-50 shadow-lg"
                title="Previous image"
                aria-label="Previous image"
              >
                <ChevronLeft size={32} />
              </button>
            )}

            {/* Centered Image display */}
            <div
              className="relative max-w-[90vw] max-h-[88vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={activeImageIndex}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                src={postImages[activeImageIndex]}
                alt={currentTitle}
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
              />

              {postImages.length > 1 && (
                <div className="mt-3 text-xs font-semibold text-zinc-300 bg-black/60 px-3.5 py-1 rounded-full border border-white/10">
                  {activeImageIndex + 1} / {postImages.length}
                </div>
              )}
            </div>

            {/* Right arrow outside image */}
            {postImages.length > 1 && (
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer z-50 shadow-lg"
                title="Next image"
                aria-label="Next image"
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>
        )}
      </AnimatePresence>
    </article>
  );
}
