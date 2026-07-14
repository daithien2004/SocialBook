'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import { useGetBooksQuery } from '@/features/books/api/bookApi';
import type { Book, BookOrderField } from '@/features/books/types/book.interface';
import { useIntersectionPagination } from '@/hooks/useIntersectionPagination';

interface UseBookPaginationProps {
    search?: string;
    genres: string[];
    tags: string[];
    sortBy: string;
    order: string;
    status?: string;
}

export const useBookPagination = (params: UseBookPaginationProps) => {
    const [page, setPage] = useState(1);
    const [allBooks, setAllBooks] = useState<Book[]>([]);
    const queryKeyRef = useRef('');

    const queryKey = JSON.stringify({ ...params });

    const { currentData, data, isLoading, isFetching } = useGetBooksQuery(
        {
            page,
            limit: 20,
            search: params.search,
            mode: 'keyword',
            genres: params.genres.join(','),
            tags: params.tags.join(','),
            sortBy: params.sortBy as BookOrderField,
            order: params.order as 'asc' | 'desc',
            status: params.status && params.status !== 'all' ? (params.status as 'draft' | 'published' | 'completed') : undefined,
        }
    );

    const { data: semanticData, isLoading: isSemanticLoading, isFetching: isSemanticFetching } = useGetBooksQuery(
        {
            page: 1,
            limit: 5,
            search: params.search,
            mode: 'semantic',
        },
        {
            skip: !params.search || params.search.trim().length < 2,
        }
    );

    // Xử lý logic gộp danh sách Keyword và Semantic
    useEffect(() => {
        const isReset = queryKey !== queryKeyRef.current;
        if (isReset) {
            queryKeyRef.current = queryKey;
            startTransition(() => setPage(1));
        }

        if (currentData?.data) {
            startTransition(() => {
                setAllBooks((prev) => {
                    const aiBooks = (semanticData?.data || []).map((b: Book) => ({ ...b, isSemantic: true }));

                    const keywordBooks = currentData.data.map((b: Book) => ({
                        ...b,
                        // Sách đã tìm thấy bằng Keyword thì không cần gắn mác AI nữa
                        isSemantic: b.isSemantic
                    }));
                    const keywordBookIds = new Set(keywordBooks.map((b: Book) => b.id));

                    const uniqueAiBooks = aiBooks.filter((b: Book) => !keywordBookIds.has(b.id));

                    if (isReset || page === 1) {
                        return [...keywordBooks, ...uniqueAiBooks];
                    }

                    // Cuộn trang: Thêm vào cuối, tránh trùng lặp
                    const existingIds = new Set(prev.map((b) => b.id));
                    const uniqueNewKeywordBooks = keywordBooks.filter((b: Book) => !existingIds.has(b.id));
                    const uniqueNewAiBooks = uniqueAiBooks.filter((b: Book) => !existingIds.has(b.id));

                    return [...prev, ...uniqueNewKeywordBooks, ...uniqueNewAiBooks];
                });
            });
        } else if (isReset) {
            startTransition(() => setAllBooks([]));
        }
    }, [queryKey, currentData, page, semanticData]);

    const hasMore = data ? data.meta.current < data.meta.totalPages : true;

    const lastBookRef = useIntersectionPagination({
        onLoadMore: () => setPage((prev) => prev + 1),
        isEnabled: !isFetching && hasMore,
    });

    const hasDataGap = !!data?.data?.length && allBooks.length === 0 && page === 1;

    return {
        books: allBooks,
        isLoading: ((isLoading || isFetching) && page === 1) || hasDataGap,
        isFetchingMore: isFetching && page > 1,
        isSemanticLoading: isSemanticLoading || isSemanticFetching,
        hasMore,
        lastBookRef,
        metaData: data?.meta ? {
            ...data.meta,
            total: Math.max(data.meta.total, allBooks.length)
        } : undefined
    };
};