'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative group">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search discussions, topics, insights..."
          className="w-full pl-10 pr-4 py-3 bg-[#0d0d11] hover:bg-[#121217] border border-white/10 group-focus-within:border-white/20 group-focus-within:bg-[#121217] rounded-full text-xs text-zinc-100 placeholder:text-zinc-500 transition-all outline-none"
        />
      </div>
    </form>
  );
}
