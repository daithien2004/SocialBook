'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserSearchSidebar() {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Tìm kiếm
      </h2>
      <button
        onClick={() => router.push('/books')}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-accent/50 transition-colors text-left group"
      >
        <Search size={18} className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          Tìm sách trong thư viện
        </span>
      </button>
    </div>
  );
}
