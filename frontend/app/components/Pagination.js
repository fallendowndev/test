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
    <div className="flex items-center justify-center gap-1 mt-6">
      {page > 1 && (
        <Link
          href={buildUrl(page - 1)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-hover)] no-underline text-[var(--foreground)]"
        >
          <ChevronLeft size={16} />
          Prev
        </Link>
      )}

      {range.map((p) => (
        <Link
          key={p}
          href={buildUrl(p)}
          className={`px-3 py-1.5 text-sm rounded no-underline ${
            p === page
              ? 'bg-[var(--color-primary)] text-white font-medium'
              : 'border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--foreground)]'
          }`}
        >
          {p}
        </Link>
      ))}

      {page < pages && (
        <Link
          href={buildUrl(page + 1)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-hover)] no-underline text-[var(--foreground)]"
        >
          Next
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}
