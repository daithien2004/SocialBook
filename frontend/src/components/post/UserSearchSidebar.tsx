'use client';

import { Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useLazySearchUsersQuery } from '@/features/users/api/usersApi';
import { UserAvatar } from '@/components/common/UserAvatar';

export default function UserSearchSidebar() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, 300);
  const [searchUsers, { data, isLoading, isFetching }] = useLazySearchUsersQuery();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedKeyword.trim().length >= 2) {
      searchUsers({ keyword: debouncedKeyword.trim(), current: 1, pageSize: 5 });
    }
  }, [debouncedKeyword, searchUsers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const results = data?.data || [];
  const isLoadingResults = isLoading || isFetching;

  return (
    <div ref={containerRef} className="relative bg-card rounded-2xl shadow-md border border-border p-4">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Tìm kiếm
      </h2>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            if (e.target.value.trim().length >= 2) setIsOpen(true);
            else setIsOpen(false);
          }}
          onFocus={() => { if (debouncedKeyword.trim().length >= 2) setIsOpen(true); }}
          placeholder="Tìm người dùng..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
        />
      </div>

      {isOpen && (
        <div className="absolute left-4 right-4 top-full mt-1.5 z-50 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {isLoadingResults ? (
            <div className="flex items-center justify-center py-6 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Đang tìm...</span>
            </div>
          ) : results.length > 0 ? (
            <ul className="py-1">
              {results.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => { setIsOpen(false); router.push(`/users/${user.id}`); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                  >
                    <UserAvatar
                      src={user.avatar}
                      name={user.username}
                      size="sm"
                      className="h-8 w-8 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.username}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 px-4 gap-1.5">
              <p className="text-sm text-muted-foreground">Không tìm thấy người dùng</p>
              <p className="text-xs text-muted-foreground/60">Thử thay đổi từ khóa tìm kiếm</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
