'use client';

export default function LoadingSpinner({ size = 'md' }) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size] || 'w-8 h-8';

  return (
    <div className="flex justify-center items-center py-8">
      <div
        className={`${sizeClass} border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin`}
      />
    </div>
  );
}
