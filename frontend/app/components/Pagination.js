'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, baseUrl, queryParams = {} }) {
  if (pages <= 1) return null;

  const buildUrl = (p) => {
    const params = new URLSearchParams(queryParams);
    params.set('page', p);
    return `${baseUrl}?${params.toString()}`;
  };

  const range = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      {page > 1 && (
        <Link
          href={buildUrl(page - 1)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/5 hover:border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300 hover:text-white transition-colors"
        >
          <ChevronLeft size={14} />
          <span>Prev</span>
        </Link>
      )}

      {range.map((p) => (
        <Link
          key={p}
          href={buildUrl(p)}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
            p === page
              ? 'bg-white text-black shadow-sm'
              : 'border border-white/5 hover:border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-white'
          }`}
        >
          {p}
        </Link>
      ))}

      {page < pages && (
        <Link
          href={buildUrl(page + 1)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/5 hover:border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300 hover:text-white transition-colors"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}
