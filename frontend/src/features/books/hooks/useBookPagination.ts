'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGetBooksQuery } from '@/src/features/books/api/bookApi';

interface UseBookPaginationProps {
    search?: string;
    genres: string[];
    tags: string[];
    sortBy: string;
    order: string;
}

export const useBookPagination = (params: UseBookPaginationProps) => {
    const [page, setPage] = useState(1);
    const [allBooks, setAllBooks] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(true);

    const queryKey = JSON.stringify({ ...params });

    useEffect(() => {
        setPage(1);
        setAllBooks([]);
        setHasMore(true);
    }, [queryKey]);

    const { data, isLoading, isFetching } = useGetBooksQuery(
        {
            page,
            limit: 20,
            search: params.search,
            genres: params.genres.join(','),
            tags: params.tags.join(','),
            sortBy: params.sortBy as any,
            order: params.order as any,
        },
        { refetchOnMountOrArgChange: true }
    );

    useEffect(() => {
        if (data?.data) {
            if (page === 1) {
                setAllBooks(data.data);
            } else {
                setAllBooks((prev) => {
                    const existingIds = new Set(prev.map((b) => b.id));
                    const uniqueNewBooks = data.data.filter((b: any) => !existingIds.has(b.id));
                    return [...prev, ...uniqueNewBooks];
                });
            }
            setHasMore(data.meta.current < data.meta.totalPages);
        } else if (!isLoading && !isFetching && page > 1) {
            setHasMore(false);
        }
    }, [data, page, isLoading, isFetching]);

    // Logic Infinite Scroll (Intersection Observer)
    const observer = useRef<IntersectionObserver>(null);

    const lastBookRef = useCallback((node: HTMLDivElement) => {
        if (isFetching) return;

        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                setPage((prev) => prev + 1);
            }
        });

        if (node) observer.current.observe(node);
    }, [isFetching, hasMore]);

    return {
        books: allBooks,
        isLoading: isLoading && page === 1,
        isFetchingMore: isFetching && page > 1,
        hasMore,
        lastBookRef,
        metaData: data?.meta
    };
};