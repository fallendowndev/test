'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function VoteControls({
  postId,
  initialScore = 0,
  initialVote = null,
  horizontal = false,
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialVote);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (value) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    const prevScore = score;
    const prevVote = userVote;

    if (userVote === value) {
      setUserVote(null);
      setScore((prev) => prev - value);
    } else if (userVote === null) {
      setUserVote(value);
      setScore((prev) => prev + value);
    } else {
      setUserVote(value);
      setScore((prev) => prev + value * 2);
    }

    try {
      if (prevVote === value) {
        const data = await api(`/posts/${postId}/vote`, { method: 'DELETE' });
        if (data.success && data.data) {
          setScore(data.data.score);
          setUserVote(data.data.userVote);
        }
      } else {
        const data = await api(`/posts/${postId}/vote`, {
          method: 'POST',
          body: { value },
        });
        if (data.success && data.data) {
          setScore(data.data.score);
          setUserVote(data.data.userVote);
        }
      }
    } catch (err) {
      setUserVote(prevVote);
      setScore(prevScore);
      console.error('Vote failed:', err);
    } finally {
      setIsVoting(false);
    }
  };

  const isUpvoted = userVote === 1;
  const isDownvoted = userVote === -1;

  return (
    <div
      className={`flex items-center ${
        horizontal ? 'flex-row gap-2' : 'flex-col gap-0.5'
      } bg-[#f8f9fa] rounded p-1`}
    >
      <button
        type="button"
        onClick={() => handleVote(1)}
        disabled={isVoting}
        aria-label="Upvote"
        className={`p-1 rounded hover:bg-[#edeff1] transition-colors ${
          isUpvoted ? 'text-[#ff4500]' : 'text-[#7c7c7c] hover:text-[#ff4500]'
        }`}
      >
        <ArrowUp
          className={`w-5 h-5 transition-transform active:scale-125 ${isUpvoted ? 'fill-current' : ''}`}
          strokeWidth={isUpvoted ? 0 : 2}
          fill={isUpvoted ? 'currentColor' : 'none'}
        />
      </button>

      <span
        className={`text-xs font-bold px-1 select-none min-w-[20px] text-center ${
          isUpvoted
            ? 'text-[#ff4500]'
            : isDownvoted
            ? 'text-[#7193ff]'
            : 'text-[#1c1c1c]'
        }`}
      >
        {score}
      </span>

      <button
        type="button"
        onClick={() => handleVote(-1)}
        disabled={isVoting}
        aria-label="Downvote"
        className={`p-1 rounded hover:bg-[#edeff1] transition-colors ${
          isDownvoted ? 'text-[#7193ff]' : 'text-[#7c7c7c] hover:text-[#7193ff]'
        }`}
      >
        <ArrowDown
          className={`w-5 h-5 transition-transform active:scale-125 ${isDownvoted ? 'fill-current' : ''}`}
          strokeWidth={isDownvoted ? 0 : 2}
          fill={isDownvoted ? 'currentColor' : 'none'}
        />
      </button>
    </div>
  );
}
