'use client';

import { memo } from 'react';
import PostCard from '@/components/post/PostCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { usePostsFeed } from '@/features/posts/hooks/usePostsFeed';
import { cn } from '@/lib/utils';
import { usePostListViewMode } from './hooks';
import { AlertCircle, ArrowUp, LayoutGrid, List } from 'lucide-react';

const PostList: React.FC = memo(function PostList() {
    const { viewMode, setViewMode, mounted } = usePostListViewMode();
    const { posts, isLoading, isFetching, error, hasMore, observerTarget } = usePostsFeed({
        limit: 10,
    });

    if (isLoading) {
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
                <Button onClick={() => window.location.reload()} variant="default">
                    Thử tải lại
                </Button>
            </div>
        );
    }

    if (!posts.length) {
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
            <div className="flex justify-between items-center bg-white dark:bg-[#1a1a1a] p-2 rounded-xl border border-slate-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white px-2">Bảng tin</h2>
                <div className="flex items-center gap-2">
                    {isFetching ? <Spinner className="size-4 text-sky-500" /> : null}
                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={(val) => val && setViewMode(val as 'grid' | 'list')}
                    >
                        <ToggleGroupItem value="list" aria-label="List view" className="h-8 w-8 p-0">
                            <List className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="grid" aria-label="Grid view" className="h-8 w-8 p-0">
                            <LayoutGrid className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>

            <div
                className={cn(
                    mounted && viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 gap-5'
                        : 'space-y-6'
                )}
            >
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>

            {isFetching ? (
                <div className="flex justify-center py-4 w-full">
                    <Spinner className="size-8 text-sky-500" />
                </div>
            ) : null}

            {hasMore ? <div ref={observerTarget} className="h-10 w-full" /> : null}

            {posts.length > 5 ? (
                <Button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-8 right-8 rounded-full shadow-lg z-40 w-12 h-12"
                    size="icon"
                    aria-label="Scroll to top"
                >
                    <ArrowUp className="h-5 w-5" />
                </Button>
            ) : null}
        </div>
    );
});

export default PostList;
