'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { BookOrderField } from '@/features/books/types/book.interface';

export const useBookParams = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const genres = useMemo(() => searchParams.get('genres')?.split(',').filter(Boolean) || [], [searchParams]);
    const tags = useMemo(() => searchParams.get('tags')?.split(',').filter(Boolean) || [], [searchParams]);
    const searchQuery = searchParams.get('search') || '';
    const defaultSort = searchQuery ? 'score' : 'createdAt';
    const sortBy = (searchParams.get('sortBy') as BookOrderField) || defaultSort;
    const order = (searchParams.get('order') as 'asc' | 'desc') || 'desc';
    const status = searchParams.get('status') || 'all';

    const updateParams = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
        });
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [searchParams, pathname, router]);

    const toggleFilter = useCallback((type: 'genres' | 'tags', slug: string) => {
        const currentList = type === 'genres' ? genres : tags;
        const newList = currentList.includes(slug)
            ? currentList.filter((item) => item !== slug)
            : [...currentList, slug];

        updateParams({ [type]: newList.length > 0 ? newList.join(',') : null });
    }, [genres, tags, updateParams]);

    const setSort = useCallback((sortValue: string, sortOrder: string) => {
        updateParams({ sortBy: sortValue, order: sortOrder });
    }, [updateParams]);

    const setSearch = useCallback((term: string) => {
        updateParams({ search: term.trim() || null });
    }, [updateParams]);

    const setStatus = useCallback((s: string) => {
        updateParams({ status: s === 'all' ? null : s });
    }, [updateParams]);

    const clearFilters = useCallback(() => updateParams({ genres: null, tags: null }), [updateParams]);
    const clearGenres = useCallback(() => updateParams({ genres: null }), [updateParams]);
    const clearTags = useCallback(() => updateParams({ tags: null }), [updateParams]);
    const clearSearch = useCallback(() => updateParams({ search: null }), [updateParams]);
    const clearAll = useCallback(() => router.push(pathname), [pathname, router]);

    return {
        genres,
        tags,
        searchQuery,
        sortBy,
        order,
        status,
        toggleFilter,
        setSort,
        setSearch,
        setStatus,
        clearFilters,
        clearGenres,
        clearTags,
        clearSearch,
        clearAll
    };
};