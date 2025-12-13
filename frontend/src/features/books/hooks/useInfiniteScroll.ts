import { useRef, useCallback, useEffect } from "react";
import { PAGINATION } from "../books.constants";

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
    const observerRef = useRef<IntersectionObserver | null>(null);

    const lastElementRef = useCallback(
        (node: HTMLDivElement | null) => {
            // Cleanup observer cũ
            if (observerRef.current) {
                observerRef.current.disconnect();
            }

            if (!isEnabled) return;

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting) {
                        onLoadMore();
                    }
                },
                { rootMargin: threshold }
            );

            if (node) {
                observerRef.current.observe(node);
            }
        },
        [isEnabled, onLoadMore, threshold]
    );

    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    return lastElementRef;
}