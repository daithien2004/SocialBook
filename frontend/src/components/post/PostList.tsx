'use client';

import PostCard from '@/src/components/post/PostCard';
import { useGetPostsQuery } from '@/src/features/posts/api/postApi';
import { Post } from '@/src/features/posts/types/post.interface';
import { useEffect, useRef, useState } from 'react';

interface PostListProps {
    currentUserId?: string;
}

const PostList: React.FC<PostListProps> = () => {
    const [page, setPage] = useState(1);
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const limit = 10;

    const observerTarget = useRef<HTMLDivElement | null>(null);

    const { data, isLoading, error, isFetching } = useGetPostsQuery(
        { page, limit },
        {
            refetchOnMountOrArgChange: true,
        }
    );

    const items = data?.data ?? [];
    const total = data?.meta?.total ?? 0;
    const prevTotalRef = useRef<number | null>(null);

    useEffect(() => {
        if (!data?.meta) return;
        const currentTotal = data.meta.total;

        if (prevTotalRef.current === null) {
            prevTotalRef.current = currentTotal;
            return;
        }

        if (currentTotal !== prevTotalRef.current) {
            prevTotalRef.current = currentTotal;
            setPage(1);
            setAllPosts([]);
        }
    }, [data?.meta?.total]);

    const hasMore = allPosts.length < total;

    useEffect(() => {
        if (!items.length) return;

        setAllPosts((prev) => {
            if (page === 1) {
                return items;
            }

            const newPosts = items.filter((post) => !prev.some((p) => p.id === post.id));
            return [...prev, ...newPosts];
        });
    }, [items, page]);

    useEffect(() => {
        const target = observerTarget.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];

                if (entry.isIntersecting && hasMore && !isFetching) {
                    setPage((prev) => prev + 1);
                }
            },
            { threshold: 0.15 }
        );

        observer.observe(target);

        return () => {
            observer.disconnect();
        };
    }, [hasMore, isFetching]);

    if (isLoading && page === 1) {
        return (
            <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-sky-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <p className="text-sm text-red-600">
                    Đã xảy ra lỗi khi tải bài viết. Vui lòng thử lại.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition"
                >
                    Thử tải lại
                </button>
            </div>
        );
    }

    if (!allPosts.length && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-10 space-y-2 text-center">
                <p className="text-sm font-medium text-slate-800">
                    Chưa có bài viết nào.
                </p>
                <p className="text-xs text-slate-500">
                    Hãy là người đầu tiên chia sẻ cảm nhận về sách 📚
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 relative">
            {allPosts.map((post: Post) => (
                <PostCard key={post.id} post={post} />
            ))}

            {isFetching && page > 1 && (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-sky-500" />
                </div>
            )}

            {hasMore && <div ref={observerTarget} className="h-10" />}

            {allPosts.length > 5 && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-8 right-8 p-3 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition z-40 text-sm"
                    aria-label="Scroll to top"
                >
                    ↑
                </button>
            )}
        </div>
    );
};

export default PostList;
