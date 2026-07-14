import { useRef, useCallback, useEffect } from 'react';

interface UseIntersectionPaginationProps {
  onLoadMore: () => void | Promise<void>;
  isEnabled: boolean;
  threshold?: string | number;
}

export function useIntersectionPagination({
  onLoadMore,
  isEnabled,
  threshold = '100px',
}: UseIntersectionPaginationProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!isEnabled) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            void onLoadMore();
          }
        },
        { 
          rootMargin: typeof threshold === 'number' ? `${threshold}px` : threshold 
        }
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
