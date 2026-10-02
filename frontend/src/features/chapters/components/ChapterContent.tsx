'use client';

import { useCallback, useMemo, memo } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MESSAGES } from '@/constants/messages';
import { Bookmark as BookmarkIcon } from 'lucide-react';

import { useAppAuth } from '@/features/auth/hooks';
import { getBookmarksByBook } from '@/features/bookmarks/api/bookmark.api';
import { useCreateBookmark, useDeleteBookmark } from '@/features/bookmarks/api/bookmark.mutations';
import { bookmarkKeys } from '@/lib/query-keys';
import { chaptersQueries } from '@/features/chapters/api/chapters.queries';

import { useReadingRoomSocket } from '@/features/reading-rooms/hooks/useReadingRoomSocket';
import { userHighlightQueries } from '@/features/user-highlights/api/user-highlights.queries';
import { useDeleteHighlight } from '@/features/user-highlights/api/user-highlights.mutations';
import { useReadingSettings } from '@/store/useReadingSettings';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';

import { Button } from '@/components/ui/button';

import { TooltipProvider } from '@/components/ui/tooltip';

import { ChapterTextRenderer } from './ChapterTextRenderer';

import { ReaderAvatars } from './ReaderAvatars';
import { useScrollTracking } from './useScrollTracking';
import { useSelectionToolbar } from './useSelectionToolbar';
import { SelectionToolbar } from './SelectionToolbar';

interface Paragraph {
    id: string;
    content: string;
}

interface ChapterContentProps {
    paragraphs: Paragraph[];
    chapterId: string;
    chapterSlug: string;
    bookId: string;
    bookSlug: string;
    bookCoverImage?: string;
    onActiveParagraphChange?: (paragraphId: string) => void;
}


export const ChapterContent = memo(function ChapterContent({
    paragraphs,
    chapterId,
    chapterSlug,
    bookId,
    bookSlug,
    onActiveParagraphChange,
}: ChapterContentProps) {
    const settings = useReadingSettings(s => s.settings);


    const { user } = useAppAuth();
    const router = useRouter();

    const room = useReadingRoomStore((state) => state.room);
    const isEnded = room?.status === 'ended';
    const highlights = useReadingRoomStore((state) => state.highlights);
    const { addHighlight, removeHighlight, generateHighlightInsight } = useReadingRoomSocket();

    useQuery({
        ...chaptersQueries.knowledge({ bookSlug, chapterId }),
        enabled: !!bookSlug && !!chapterId,
    });

    const { data: userHighlightsData } = useQuery({
        ...userHighlightQueries.byChapter(chapterId),
        enabled: !!user && !room,
    });
    const userHighlights = userHighlightsData || [];

    const { data: bookmarksData } = useQuery({
        queryKey: bookmarkKeys.byBook(bookId),
        queryFn: () => getBookmarksByBook(bookId),
        enabled: !!bookId && !!user,
    });
    const bookmarks = useMemo(() => bookmarksData || [], [bookmarksData]);
    const createBookmark = useCreateBookmark();
    const deleteBookmark = useDeleteBookmark();

    const deletePersonalHighlight = useDeleteHighlight();

    const { getParaRef } = useScrollTracking(paragraphs, onActiveParagraphChange);
    const {
        selection, aiAnalysis, setAiAnalysis, menuRef,
        handleMouseUp, handleAIAction,
        handleAddHighlight: handleRoomHighlight,
        handleAddPersonalHighlight,
    } = useSelectionToolbar({ bookId, chapterId, bookSlug, room, addHighlight });



    const handleToggleBookmark = useCallback(async (paraId: string, content: string) => {
        if (!user) {
            toast.info(MESSAGES.REQUIRE_LOGIN, {
                action: { label: 'Đăng nhập', onClick: () => router.push('/login') },
            });
            return;
        }

        const isBookmarked = bookmarks.some(b => b.paragraphId === paraId);

        try {
            if (isBookmarked) {
                await deleteBookmark.mutateAsync({ paragraphId: paraId, bookId });
                toast.success('Đã bỏ bookmark');
            } else {
                await createBookmark.mutateAsync({
                    bookId,
                    chapterId,
                    chapterSlug,
                    paragraphId: paraId,
                    textPreview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
                });
                toast.success('Đã lưu bookmark');
            }
        } catch {
            toast.error('Có lỗi xảy ra, vui lòng thử lại');
        }
    }, [user, bookmarks, bookId, chapterId, chapterSlug, createBookmark, deleteBookmark, router]);


    return (
        <TooltipProvider>
            <main
                suppressHydrationWarning
                className="flex-1 w-full antialiased relative transition-all duration-300 rounded-2xl p-10 selection:bg-brand/30"
                style={{
                    backgroundColor: settings.backgroundColor,
                    color: settings.textColor,
                    paddingLeft: `${settings.marginWidth}px`,
                    paddingRight: `${settings.marginWidth}px`,
                    filter: [
                        settings.brightness !== 100 ? `brightness(${settings.brightness / 100})` : '',
                        settings.warmth > 0 ? `sepia(${settings.warmth * 0.6}%) hue-rotate(-${settings.warmth * 0.3}deg)` : '',
                    ].filter(Boolean).join(' ') || undefined,
                }}
            >
                <article className="space-y-4">
                    {paragraphs.map((para) => {
                        const paraHighlights = highlights.filter(h => h.paragraphId === para.id);
                        const paraUserHighlights = userHighlights.filter(h => h.paragraphId === para.id);

                        return (
                            <div
                                key={para.id}
                                id={`${chapterSlug}--${para.id}`}
                                data-para-id={para.id}
                                ref={getParaRef(para.id)}
                                className="group relative flex items-start"
                                onMouseUp={() => {
                                    handleMouseUp(para.id);
                                }}
                            >
                                <div className="flex-1 min-w-0 relative">
                                    <p
                                        className={`transition-colors duration-300 w-full relative`}
                                        style={{
                                            fontSize: `${settings.fontSize}px`,
                                            fontFamily: settings.fontFamily,
                                            lineHeight: settings.lineHeight,
                                            letterSpacing: `${settings.letterSpacing}px`,
                                            textAlign: settings.textAlign,
                                        }}
                                    >
                                        <ChapterTextRenderer
                                            content={para.content}
                                            highlights={paraHighlights}
                                            userHighlights={paraUserHighlights}
                                            currentUserId={user?.id}
                                            onRemoveHighlight={removeHighlight}
                                            onRemoveUserHighlight={(id) => deletePersonalHighlight.mutate(id)}
                                            generateHighlightInsight={generateHighlightInsight}
                                        />
                                    </p>


                                </div>

                                {/* Reader avatars for this paragraph */}
                                {room && (
                                    <ReaderAvatars
                                        chapterSlug={chapterSlug}
                                        paragraphId={para.id}
                                        currentUserId={user?.id}
                                    />
                                )}



                                <div className="absolute right-full top-1/2 -translate-y-1/2 -translate-x-1/2 mr-6 flex flex-row items-center gap-1 p-0.5 rounded-md bg-background backdrop-blur-xl border border-border shadow-sm shrink-0 z-10 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-200">
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleBookmark(para.id, para.content);
                                        }}
                                        title={bookmarks.some(b => b.paragraphId === para.id) ? 'Bỏ bookmark' : 'Bookmark'}
                                        className="h-7 w-7 rounded-md hover:scale-110 transition-transform"
                                        aria-label="Bookmark đoạn này"
                                    >
                                        <BookmarkIcon
                                            size={14}
                                            className={bookmarks.some(b => b.paragraphId === para.id) ? "fill-primary text-primary" : ""}
                                        />
                                    </Button>


                                </div>
                            </div>
                        );
                    })}
                </article>

                <SelectionToolbar
                    selection={selection}
                    aiAnalysis={aiAnalysis}
                    setAiAnalysis={setAiAnalysis}
                    menuRef={menuRef}
                    user={user ?? undefined}
                    room={room}
                    isEnded={isEnded}
                    onAI={handleAIAction}
                    onHighlightRoom={handleRoomHighlight}
                    onHighlightPersonal={handleAddPersonalHighlight}
                />

            </main>
        </TooltipProvider>
    );
});




