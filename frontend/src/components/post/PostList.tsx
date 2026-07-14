'use client';

import { memo, useRef, useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import PostCard from '@/components/post/PostCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { usePostsFeed } from '@/features/posts/hooks/usePostsFeed';
import { cn } from '@/lib/utils';
import { usePostListViewMode } from './hooks';
import { AlertCircle, ArrowUp, LayoutGrid, List } from 'lucide-react';

const ESTIMATED_ITEM_SIZE = 400;

interface PostListProps {
    scrollRef?: RefObject<HTMLDivElement | null>;
}

const PostList: React.FC<PostListProps> = memo(function PostList({ scrollRef: externalScrollRef }) {
    const { viewMode, setViewMode, mounted } = usePostListViewMode();
    const { posts, isLoading, isFetching, error, hasMore, lastPostRef } = usePostsFeed({
        limit: 10,
    });
    const ownScrollRef = useRef<HTMLDivElement>(null);
    const scrollRef = externalScrollRef ?? ownScrollRef;
    const [showScrollTop, setShowScrollTop] = useState(false);

    const virtualizer = useVirtualizer({
        count: viewMode === 'list' ? posts.length : 0,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ESTIMATED_ITEM_SIZE,
        overscan: 5,
        measureElement: (el) => el.getBoundingClientRect().height,
    });

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onScroll = () => setShowScrollTop(el.scrollTop > 600);
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, [scrollRef]);

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
                <p className="text-sm font-medium text-foreground">
                    Chưa có bài viết nào.
                </p>
                <p className="text-xs text-muted-foreground">
                    Hãy là người đầu tiên chia sẻ cảm nhận về sách
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 relative">
            <div className="flex justify-between items-center bg-card p-2 rounded-xl border border-border shadow-sm">
                <h2 className="text-lg font-bold text-foreground px-2">Bảng tin</h2>
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

            {viewMode === 'list' ? (
                <>
                    <div
                        style={{
                            height: `${virtualizer.getTotalSize()}px`,
                            position: 'relative',
                        }}
                    >
                        {virtualizer.getVirtualItems().map((virtualItem) => (
                            <div
                                key={virtualItem.key}
                                data-index={virtualItem.index}
                                ref={virtualizer.measureElement}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                            >
                                <PostCard post={posts[virtualItem.index]} />
                            </div>
                        ))}
                    </div>

                    {isFetching ? (
                        <div className="flex justify-center py-4 w-full">
                            <Spinner className="size-8 text-sky-500" />
                        </div>
                    ) : null}

                    {hasMore ? <div ref={lastPostRef} className="h-10 w-full" /> : null}
                </>
            ) : (
                <>
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

                    {hasMore ? <div ref={lastPostRef} className="h-10 w-full" /> : null}
                </>
            )}

            {showScrollTop ? (
                <Button
                    onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
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
