'use client';

import { cn } from '@/lib/utils';
import PostCard from '@/components/post/PostCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useGetPostsQuery } from '@/features/posts/api/postApi';
import { Post } from '@/features/posts/types/post.interface';
import { useUIStore } from '@/store/useUIStore';
import { AlertCircle, ArrowUp, LayoutGrid, List } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface PostListProps {
    currentUserId?: string;
}

const PostList: React.FC<PostListProps> = () => {
    const [page, setPage] = useState(1);
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const limit = 10;

    // Zustand Store
    const { viewMode, setViewMode } = useUIStore();

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

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

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
                <Spinner className="size-10 text-sky-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 max-w-md mx-auto">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>
                        Đã xảy ra lỗi khi tải bài viết. Vui lòng thử lại.
                    </AlertDescription>
                </Alert>
                <Button
                    onClick={() => window.location.reload()}
                    variant="default"
                >
                    Thử tải lại
                </Button>
            </div>
        );
    }

    if (!allPosts.length && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-10 space-y-2 text-center">
                <p className="text-sm font-medium text-slate-800 dark:text-gray-200">
                    Chưa có bài viết nào.
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                    Hãy là người đầu tiên chia sẻ cảm nhận về sách 📚
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            {/* View Mode Toggle */}
            <div className="flex justify-between items-center bg-white dark:bg-[#1a1a1a] p-2 rounded-xl border border-slate-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white px-2">Bảng tin</h2>
                <ToggleGroup type="single" value={viewMode} onValueChange={(val) => val && setViewMode(val as 'grid' | 'list')}>
                    <ToggleGroupItem value="list" aria-label="List view" className="h-8 w-8 p-0">
                        <List className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="grid" aria-label="Grid view" className="h-8 w-8 p-0">
                        <LayoutGrid className="h-4 w-4" />
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            {/* Posts Grid/List */}
            <div className={cn(
                mounted && viewMode === 'grid'
                    ? "grid grid-cols-1 md:grid-cols-2 gap-5"
                    : "space-y-6"
            )}>
                {allPosts.map((post: Post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>

            {isFetching && page > 1 && (
                <div className="flex justify-center py-4 w-full">
                    <Spinner className="size-8 text-sky-500" />
                </div>
            )}

            {hasMore && <div ref={observerTarget} className="h-10 w-full" />}

            {allPosts.length > 5 && (
                <Button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-8 right-8 rounded-full shadow-lg z-40 w-12 h-12"
                    size="icon"
                    aria-label="Scroll to top"
                >
                    <ArrowUp className="h-5 w-5" />
                </Button>
            )}
        </div>
    );
};

export default PostList;
