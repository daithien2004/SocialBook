'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { BookOrderField } from '@/src/features/books/types/book.interface';

export const useBookParams = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const genres = useMemo(() => searchParams.get('genres')?.split(',').filter(Boolean) || [], [searchParams]);
    const tags = useMemo(() => searchParams.get('tags')?.split(',').filter(Boolean) || [], [searchParams]);
    const searchQuery = searchParams.get('search') || '';
    // When searching, default to 'score' for relevance; when browsing, default to 'createdAt'
    const defaultSort = searchQuery ? 'score' : 'createdAt';
    const sortBy = (searchParams.get('sortBy') as BookOrderField) || defaultSort;
    const order = (searchParams.get('order') as 'asc' | 'desc') || 'desc';

    const updateParams = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
        });
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [searchParams, pathname, router]);

    const toggleFilter = (type: 'genres' | 'tags', slug: string) => {
        const currentList = type === 'genres' ? genres : tags;
        const newList = currentList.includes(slug)
            ? currentList.filter((item) => item !== slug)
            : [...currentList, slug];

        updateParams({ [type]: newList.length > 0 ? newList.join(',') : null });
    };

    const setSort = (sortValue: string, sortOrder: string) => {
        updateParams({ sortBy: sortValue, order: sortOrder });
    };

    const setSearch = (term: string) => {
        updateParams({ search: term.trim() || null });
    };

    const clearFilters = () => updateParams({ genres: null, tags: null });
    const clearSearch = () => updateParams({ search: null });
    const clearAll = () => router.push(pathname);

    return {
        genres,
        tags,
        searchQuery,
        sortBy,
        order,
        toggleFilter,
        setSort,
        setSearch,
        clearFilters,
        clearSearch,
        clearAll
    };
};