import { useIntersectionPagination } from '@/hooks/useIntersectionPagination';
import { PAGINATION } from '../books.constants';

interface UseInfiniteScrollProps {
    onLoadMore: () => void;
    isEnabled: boolean;
    threshold?: string;
}

export function useInfiniteScroll({
    onLoadMore,
    isEnabled,
    threshold = PAGINATION.SCROLL_THRESHOLD,
}: UseInfiniteScrollProps) {
    return useIntersectionPagination({
        onLoadMore,
        isEnabled,
        threshold,
    });
}