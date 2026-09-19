'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function CommentForm({
  postId,
  parentCommentId = null,
  onCommentAdded,
  onCancel = null,
  placeholder = 'What are your thoughts?',
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isReply = Boolean(parentCommentId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }

    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let endpoint;
      if (isReply) {
        endpoint = `/comments/${parentCommentId}/replies`;
      } else {
        endpoint = `/posts/${postId}/comments`;
      }

      const res = await api(endpoint, {
        method: 'POST',
        body: { content: content.trim() },
      });

      if (res.success && res.data?.comment) {
        setContent('');
        if (onCommentAdded) {
          onCommentAdded(res.data.comment);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to submit comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {error && (
        <div className="text-xs text-[#ea0027] bg-[#fee2e2] px-3 py-1.5 rounded mb-2">
          {error}
        </div>
      )}

      <div className="border border-[#ccc] rounded-md focus-within:border-[#0079d3] bg-white transition-colors overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={user ? placeholder : 'Log in or sign up to leave a comment'}
          rows={isReply ? 2 : 3}
          maxLength={10000}
          disabled={!user && !loading}
          onClick={() => {
            if (!user) router.push('/login');
          }}
          className="w-full p-2.5 text-sm resize-y focus:outline-none placeholder-[#7c7c7c] disabled:bg-[#f8f9fa] disabled:cursor-pointer"
        />

        <div className="flex items-center justify-between px-3 py-2 bg-[#f8f9fa] border-t border-[#edeff1]">
          <span className="text-[11px] text-[#7c7c7c]">
            {user ? `Comment as u/${user.username}` : 'Sign in to join the conversation'}
          </span>

          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-3 py-1 text-xs font-semibold rounded text-[#7c7c7c] hover:bg-[#edeff1] transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !content.trim() || !user}
              className="px-4 py-1 text-xs font-semibold rounded-full bg-[#0079d3] hover:bg-[#006cbd] text-white transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : isReply ? 'Reply' : 'Comment'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
