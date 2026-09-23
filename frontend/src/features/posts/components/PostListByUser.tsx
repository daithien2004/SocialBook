'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import PostCard from '@/features/posts/components/PostCard';
import { postQueries } from '@/features/posts/api/post.queries';
import type { Post } from '@/features/posts/types/post.interface';

interface PostListProps {
  userId: string;
}

const PostListUser: React.FC<PostListProps> = ({ userId }) => {
  const limit = 10;
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const {
    data,
    isLoading,
    error,
    isFetching,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(postQueries.infiniteByUser({ userId, limit }));

  const allPosts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetching) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetching, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <p className="text-destructive">Lỗi tải dữ liệu bài viết 😢</p>
        <button
          onClick={() => void refetch()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!allPosts.length) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-muted-foreground">Chưa có bài viết nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allPosts.map((post: Post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {isFetching && hasNextPage ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : null}

      {hasNextPage ? <div ref={observerTarget} className="h-10" /> : null}

      {allPosts.length > 5 ? (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition z-40"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      ) : null}
    </div>
  );
};

export default PostListUser;
