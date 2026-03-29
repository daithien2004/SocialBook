'use client';

import PostCard from '@/components/post/PostCard';
import { useGetPostsByUserQuery } from '@/features/posts/api/postApi';
import { Post } from '@/features/posts/types/post.interface';
import { useEffect, useRef, useState } from 'react';

interface PostListProps {
  userId: string;
}

const PostListUser: React.FC<PostListProps> = ({ userId }) => {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const limit = 10;

  const observerTarget = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, error, isFetching } = useGetPostsByUserQuery(
    { cursor, limit, userId },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const items = data?.data ?? [];
  const hasMore = data?.meta?.hasMore ?? false;
  const nextCursor = data?.meta?.nextCursor;

  useEffect(() => {
    if (!items.length && !hasMore) return;

    setAllPosts((prev) => {
      if (cursor === undefined) {
        return items;
      }

      const newPosts = items.filter(
        (post) => !prev.some((p) => p.id === post.id)
      );

      return [...prev, ...newPosts];
    });
  }, [items, cursor, hasMore]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry.isIntersecting && hasMore && !isFetching && nextCursor) {
          setCursor(nextCursor);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isFetching]);

  if (isLoading && cursor === undefined) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <p className="text-red-600">Lỗi tải dữ liệu bài viết 😢</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!allPosts.length && !isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-600">Chưa có bài viết nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allPosts.map((post: Post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {isFetching && cursor !== undefined ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : null}

      {hasMore ? <div ref={observerTarget} className="h-10" /> : null}

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
