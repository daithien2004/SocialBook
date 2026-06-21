'use client';

import PostCard from '@/components/post/PostCard';
import { useGetPostsByUserQuery } from '@/features/posts/api/postApi';
import { Post } from '@/features/posts/types/post.interface';
import { useEffect, useRef, useState } from 'react';

interface PostListProps {
  userId: string;
}

const INITIAL_SENTINEL = Symbol('initial');

const PostListUser: React.FC<PostListProps> = ({ userId }) => {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [processedCursor, setProcessedCursor] = useState<string | typeof INITIAL_SENTINEL | undefined>(INITIAL_SENTINEL);
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

  if (items.length > 0 && cursor !== processedCursor) {
    setProcessedCursor(cursor);
    if (cursor === undefined) {
      setAllPosts(items);
    } else {
      const existingIds = new Set(allPosts.map((p) => p.id));
      const newPosts = items.filter((p) => !existingIds.has(p.id));
      if (newPosts.length > 0) {
        setAllPosts([...allPosts, ...newPosts]);
      }
    }
  }

  useEffect(() => {
    const handlePostUpdated = (e: Event) => {
      const updatedPost = (e as CustomEvent<Post>).detail;
      setAllPosts((prev) =>
        prev.map((post) =>
          post.id === updatedPost.id
            ? {
                ...post,
                content: updatedPost.content,
                imageUrls: updatedPost.imageUrls,
                book: updatedPost.book,
                isFlagged: updatedPost.isFlagged,
                moderationReason: updatedPost.moderationReason,
                moderationStatus: updatedPost.moderationStatus,
              }
            : post
        )
      );
    };

    window.addEventListener('post-updated', handlePostUpdated);
    return () => {
      window.removeEventListener('post-updated', handlePostUpdated);
    };
  }, []);

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
  }, [hasMore, isFetching, nextCursor]);

  if (isLoading && cursor === undefined) {
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
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!allPosts.length && !isLoading) {
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
