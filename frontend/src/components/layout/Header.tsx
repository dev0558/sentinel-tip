'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, User, RefreshCw } from 'lucide-react';

export default function Header() {
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/ioc?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-sentinel-border bg-sentinel-bg-secondary/80 backdrop-blur-sm">
      {/* Global Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-xl">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-sentinel-bg-primary border border-sentinel-border w-full focus-within:border-sentinel-accent/40 transition-colors">
          <Search className="w-4 h-4 text-sentinel-text-muted flex-shrink-0" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search IOCs (IP, domain, hash, URL)..."
            className="bg-transparent text-sm font-mono text-sentinel-text-primary placeholder:text-sentinel-text-muted w-full outline-none"
          />
        </div>
      </form>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3 ml-4">
        <button className="p-2 rounded text-sentinel-text-muted hover:text-sentinel-text-primary hover:bg-sentinel-bg-hover transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button className="p-2 rounded text-sentinel-text-muted hover:text-sentinel-text-primary hover:bg-sentinel-bg-hover transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-sentinel-danger rounded-full" />
        </button>
        <button className="p-2 rounded text-sentinel-text-muted hover:text-sentinel-text-primary hover:bg-sentinel-bg-hover transition-colors">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
