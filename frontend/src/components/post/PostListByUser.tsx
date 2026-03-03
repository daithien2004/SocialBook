'use client';

import { useState, useEffect, useRef } from 'react';
import PostCard from '@/components/post/PostCard';
import {useGetPostsByUserQuery} from '@/features/posts/api/postApi';
import { Post } from '@/features/posts/types/post.interface';

interface PostListProps {
  userId: string;
}

const PostListUser: React.FC<PostListProps> = ({userId}) => {
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const limit = 10; // để debug cho dễ nhìn

  const observerTarget = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, error, isFetching } = useGetPostsByUserQuery(
      { page, limit, userId},
      {
        // cho chắc: khi page thay đổi sẽ refetch
        refetchOnMountOrArgChange: true,
      }
  );

  const items = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  const prevTotalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!data?.meta) return;

    const currentTotal = data.meta.total;

    // lần đầu gán giá trị, không reset
    if (prevTotalRef.current === null) {
      prevTotalRef.current = currentTotal;
      return;
    }

    // nếu total thay đổi → có tạo hoặc xóa post
    if (currentTotal !== prevTotalRef.current) {
      prevTotalRef.current = currentTotal;

      // reset lại pagination & list để load mới từ page 1
      setPage(1);
      setAllPosts([]);
    }
  }, [data?.meta?.total]);
  // 👉 Còn bài để load nữa không?
  const hasMore = allPosts.length < total;

  // Gom posts vào allPosts (có reset khi page = 1)
  useEffect(() => {
    if (!items.length) return;

    setAllPosts((prev) => {
      // Lần đầu hoặc khi page quay về 1 → reset list
      if (page === 1) {
        return items;
      }

      // Load thêm page > 1 → append, tránh trùng
      const newPosts = items.filter(
          (post) => !prev.some((p) => p.id === post.id)
      );

      return [...prev, ...newPosts];
    });
  }, [items, page]);

  // Intersection Observer cho infinite scroll
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];

          // Debug thêm nếu cần
          // console.log('OBS', { entry, hasMore, isFetching, page });

          if (entry.isIntersecting && hasMore && !isFetching) {
            setPage((prev) => prev + 1);
          }
        },
        { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isFetching]);

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
        {isFetching && page > 1 && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )}

        {/* Trigger element cho infinite scroll */}
        {hasMore && <div ref={observerTarget} className="h-10" />}

        {/*/!* Thông báo hết bài viết *!/*/}
        {/*{!hasMore && allPosts.length > 0 && (*/}
        {/*    <div className="text-center py-4 text-gray-500">*/}
        {/*      Đã hiển thị tất cả {allPosts.length} bài viết*/}
        {/*    </div>*/}
        {/*)}*/}

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

export default PostListUser;
