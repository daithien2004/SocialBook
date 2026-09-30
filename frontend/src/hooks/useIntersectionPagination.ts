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
  // Caller thường truyền arrow function inline, nên `onLoadMore` đổi identity mỗi
  // render. Nếu để nó trong deps thì ref callback cũng đổi mỗi render, React gọi
  // lại với null rồi với node → huỷ và tạo IntersectionObserver liên tục.
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!isEnabled) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            void onLoadMoreRef.current();
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
    [isEnabled, threshold]
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
