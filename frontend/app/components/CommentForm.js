'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../lib/api';
import { ImageIcon } from 'lucide-react';

export default function CommentForm({
  postId,
  parentCommentId = null,
  onCommentAdded,
  onCancel = null,
  placeholder = 'Join the conversation',
}) {
  const { user } = useAuth();
  const { toast } = useNotification();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const isReply = Boolean(parentCommentId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please log in to leave a comment');
      router.push('/login');
      return;
    }

    if (!content.trim()) {
      toast.warning('Comment cannot be empty');
      return;
    }

    try {
      setLoading(true);
      let endpoint = isReply
        ? `/comments/${parentCommentId}/replies`
        : `/posts/${postId}/comments`;

      const res = await api(endpoint, {
        method: 'POST',
        body: { content: content.trim() },
      });

      if (res.success && res.data?.comment) {
        setContent('');
        toast.success(isReply ? 'Reply posted' : 'Comment posted');
        if (onCommentAdded) {
          onCommentAdded(res.data.comment);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="border border-white/10 rounded-2xl focus-within:border-white/25 bg-[#09090d] transition-all overflow-hidden shadow-sm">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={user ? placeholder : 'Sign in to join the conversation...'}
          rows={isReply ? 2 : 3}
          maxLength={10000}
          dir="auto"
          disabled={!user && !loading}
          onClick={() => {
            if (!user) router.push('/login');
          }}
          className="w-full p-3.5 text-xs sm:text-sm bg-transparent resize-y focus:outline-none placeholder:text-zinc-500 text-zinc-100 disabled:cursor-pointer leading-relaxed"
        />

        <div className="flex items-center justify-between px-3 py-2 bg-white/[0.015] border-t border-white/5">
          {/* Left tools like Reddit: Image, GIF, Aa */}
          <div className="flex items-center gap-2 text-zinc-400">
            <button
              type="button"
              onClick={() => toast.info('Direct image comments coming soon')}
              className="p-1 rounded hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Add Image"
            >
              <ImageIcon size={17} />
            </button>
            <span className="text-xs font-semibold px-1 text-zinc-400 select-none">
              Aa
            </span>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {(onCancel || content.trim()) && (
              <button
                type="button"
                onClick={() => {
                  if (onCancel) onCancel();
                  else setContent('');
                }}
                disabled={loading}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !content.trim() || !user}
              className={`px-4.5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm select-none ${
                content.trim() && user
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-white/10 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <span>{loading ? 'Posting...' : isReply ? 'Reply' : 'Comment'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
