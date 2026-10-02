import { useMemo } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { bookQueries } from '@/features/books/api/books.queries';
import type { BookOrderField, BookSummary } from '@/features/books/types/book.interface';
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
    const { 
        data, 
        isLoading: isKeywordLoading, 
        isFetchingNextPage, 
        hasNextPage, 
        fetchNextPage 
    } = useInfiniteQuery({
        ...bookQueries.infiniteList({
            search: params.search,
            mode: 'keyword',
            genres: params.genres.join(','),
            tags: params.tags.join(','),
            sortBy: params.sortBy as BookOrderField,
            order: params.order as 'asc' | 'desc',
            status: params.status && params.status !== 'all' ? (params.status as 'draft' | 'published' | 'completed') : undefined,
        })
    });

    const { data: semanticData, isLoading: isSemanticLoading, isFetching: isSemanticFetching } = useQuery({
        ...bookQueries.list({
            page: 1,
            limit: 5,
            search: params.search,
            mode: 'semantic',
        }),
        enabled: !!params.search && params.search.trim().length >= 2,
    });

    const allBooks = useMemo(() => {
        if (!data || data.pages.length === 0) return [];

        const aiBooks = (semanticData?.data || []).map((b: BookSummary) => ({ ...b, isSemantic: true }));
        const result: BookSummary[] = [];
        const seenIds = new Set<string>();

        // Process page 1
        const page1Keyword = data.pages[0].data.map(b => ({ ...b }));
        page1Keyword.forEach(b => {
            result.push(b);
            seenIds.add(b.id);
        });

        // Insert AI books immediately after page 1
        aiBooks.forEach(b => {
            if (!seenIds.has(b.id)) {
                result.push(b);
                seenIds.add(b.id);
            }
        });

        // Process remaining pages
        for (let i = 1; i < data.pages.length; i++) {
            const pageKeyword = data.pages[i].data.map(b => ({ ...b }));
            pageKeyword.forEach(b => {
                if (!seenIds.has(b.id)) {
                    result.push(b);
                    seenIds.add(b.id);
                }
            });
        }
        
        return result;
    }, [data, semanticData]);

    const lastBookRef = useIntersectionPagination({
        onLoadMore: () => { void fetchNextPage(); },
        isEnabled: !isFetchingNextPage && hasNextPage,
    });

    const totalFromApi = data?.pages[0]?.meta?.total || 0;
    const metaData = {
        total: Math.max(totalFromApi, allBooks.length)
    };

    return {
        books: allBooks,
        isLoading: isKeywordLoading,
        isFetchingMore: isFetchingNextPage,
        isSemanticLoading: isSemanticLoading || isSemanticFetching,
        hasMore: hasNextPage,
        lastBookRef,
        metaData
    };
};