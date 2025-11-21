'use client';

import { useState, useEffect, useRef } from 'react';
import PostCard from '@/src/components/post/PostCard';
import { useGetPostsQuery } from '@/src/features/posts/api/postApi';
import { Post } from '@/src/features/posts/types/post.interface';

interface PostListProps {
  currentUserId?: string; // ID của user hiện tại
}

const PostList: React.FC<PostListProps> = ({ currentUserId }) => {
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const limit = 10;

  const observerTarget = useRef<HTMLDivElement>(null);

  const { data, isLoading, error, isFetching } = useGetPostsQuery({
    page,
    limit,
  });

  const pagination = data?.pagination;

  // Thêm posts mới vào danh sách
  useEffect(() => {
    if (data?.data) {
      setAllPosts((prev) => {
        // Tránh duplicate khi refetch
        const newPosts = data.data.filter(
          (post) => !prev.some((p) => p.id === post.id)
        );
        return [...prev, ...newPosts];
      });
    }
  }, [data]);

  // Intersection Observer cho infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination?.hasNext && !isFetching) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [pagination?.hasNext, isFetching]);

  if (isLoading && page === 1) {
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
      {/* Danh sách posts */}
      {allPosts.map((post: Post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Loading indicator khi load more */}
      {isFetching && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Trigger element cho infinite scroll */}
      {pagination?.hasNext && <div ref={observerTarget} className="h-10" />}

      {/* Thông báo hết bài viết */}
      {!pagination?.hasNext && allPosts.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          Đã hiển thị tất cả {allPosts.length} bài viết
        </div>
      )}

      {/* Nút scroll to top */}
      {allPosts.length > 5 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition z-40"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default PostList;
