'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../lib/api';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function VoteControls({
  postId,
  initialScore = 0,
  initialVote = null,
  horizontal = false,
}) {
  const { user } = useAuth();
  const { toast } = useNotification();
  const router = useRouter();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialVote);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (value) => {
    if (!user) {
      toast.info('Please log in to vote on posts');
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
      toast.error(err.message || 'Vote failed');
    } finally {
      setIsVoting(false);
    }
  };

  const isUpvoted = userVote === 1;
  const isDownvoted = userVote === -1;

  return (
    <div
      className={`flex items-center ${
        horizontal ? 'flex-row gap-1.5' : 'flex-col gap-0.5'
      } bg-white/[0.03] border border-white/5 rounded-xl p-1`}
    >
      <motion.button
        type="button"
        whileTap={{ scale: 1.25 }}
        onClick={() => handleVote(1)}
        disabled={isVoting}
        aria-label="Upvote"
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          isUpvoted
            ? 'text-[#ff542e] bg-[#ff542e]/10'
            : 'text-zinc-500 hover:text-[#ff542e] hover:bg-white/5'
        }`}
      >
        <ArrowUp
          size={16}
          strokeWidth={isUpvoted ? 2.5 : 2}
          className={isUpvoted ? 'drop-shadow-[0_0_8px_rgba(255,84,46,0.5)]' : ''}
        />
      </motion.button>

      <span
        className={`text-xs font-bold px-1 select-none min-w-[20px] text-center transition-colors ${
          isUpvoted
            ? 'text-[#ff542e]'
            : isDownvoted
            ? 'text-[#818cf8]'
            : 'text-zinc-300'
        }`}
      >
        {score}
      </span>

      <motion.button
        type="button"
        whileTap={{ scale: 1.25 }}
        onClick={() => handleVote(-1)}
        disabled={isVoting}
        aria-label="Downvote"
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          isDownvoted
            ? 'text-[#818cf8] bg-[#818cf8]/10'
            : 'text-zinc-500 hover:text-[#818cf8] hover:bg-white/5'
        }`}
      >
        <ArrowDown
          size={16}
          strokeWidth={isDownvoted ? 2.5 : 2}
          className={isDownvoted ? 'drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]' : ''}
        />
      </motion.button>
    </div>
  );
}
