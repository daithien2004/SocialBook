'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { User, Trash2, Sparkles, Highlighter, MessageSquarePlus, Share2, Bookmark as BookmarkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MESSAGES } from '@/constants/messages';

import { useAppAuth } from '@/features/auth/hooks';
import { getBookmarksByBook } from '@/features/bookmarks/api/bookmark.api';
import { useCreateBookmark, useDeleteBookmark } from '@/features/bookmarks/api/bookmark.mutations';
import { bookmarkKeys } from '@/lib/query-keys';
import { useChapterComments } from '@/features/chapters/hooks/useChapterComments';
import { chaptersQueries } from '@/features/chapters/api/chapters.queries';

import { useReadingRoomSocket } from '@/features/reading-rooms/hooks/useReadingRoomSocket';
import { getRoomComments, getRoomReactions } from '@/features/reading-room-interactions/api/room-interactions.api';
import { ParagraphAnnotations } from '@/features/reading-room-interactions/components/ParagraphAnnotations';
import { FloatingReactionBubbles } from '@/features/reading-rooms/components/FloatingReactionBubbles';
import { ParagraphReactions } from '@/features/reading-room-interactions/components/ParagraphReactions';
import { userHighlightQueries } from '@/features/user-highlights/api/user-highlights.queries';
import { useDeleteHighlight, useUpdateHighlight } from '@/features/user-highlights/api/user-highlights.mutations';
import { UserHighlight } from '@/features/user-highlights/types/user-highlight.interface';
import { useReadingSettings } from '@/store/useReadingSettings';
import { useReadingRoomStore, RoomHighlight } from '@/store/useReadingRoomStore';

import { Button } from '@/components/ui/button';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider } from '@/components/ui/tooltip';

import ParagraphCommentDrawer from "@/features/comments/components/ParagraphCommentDrawer";
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
    bookTitle?: string;
    onActiveParagraphChange?: (paragraphId: string | null) => void;
}


export const ChapterContent = memo(function ChapterContent({
    paragraphs,
    chapterId,
    chapterSlug,
    bookId,
    bookSlug,
    bookTitle,
    onActiveParagraphChange,
}: ChapterContentProps) {
    const { settings } = useReadingSettings();
    const {
        activeParagraphId,
        commentDrawerOpen,
        activeParagraph,
        handleToggleComments,
        handleCloseDrawer,
        handleOpenPostModal,
    } = useChapterComments({ bookId, bookTitle });

    const { user } = useAppAuth();
    const router = useRouter();

    const room = useReadingRoomStore((state) => state.room);
    const isEnded = room?.status === 'ended';
    const highlights = useReadingRoomStore((state) => state.highlights);
    const presences = useReadingRoomStore(useShallow((state) => state.presences));
    const { addHighlight, removeHighlight, addQuote, generateHighlightInsight } = useReadingRoomSocket();

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

    // ── Hooks ──
    const { registerParaRef } = useScrollTracking(paragraphs, onActiveParagraphChange);
    const {
        selection, aiAnalysis, setAiAnalysis, menuRef,
        handleMouseUp, handleAIAction,
        handleAddHighlight: handleRoomHighlight,
        handleAddPersonalHighlight, handleAddQuote,
    } = useSelectionToolbar({ bookId, chapterId, bookSlug, room, addHighlight, addQuote });

    const [openCommentParaId, setOpenCommentParaId] = useState<string | null>(null);

    useEffect(() => {
        if (!room?.roomId || !room?.currentChapterSlug || !chapterId) return;

        let cancelled = false;
        useReadingRoomStore.setState({ roomComments: [], reactions: {} });

        const hydrate = async () => {
            try {
                const [commentsData, reactionsData] = await Promise.all([
                    getRoomComments({ code: room.roomId, chapterSlug: room.currentChapterSlug }),
                    getRoomReactions({ code: room.roomId, chapterSlug: room.currentChapterSlug }),
                ]);
                if (cancelled) return;

                useReadingRoomStore.getState().setRoomComments(commentsData);

                const reactions: Record<string, Record<string, string[]>> = {};
                for (const r of reactionsData) {
                    if (!reactions[r.paragraphId]) reactions[r.paragraphId] = {};
                    if (!reactions[r.paragraphId][r.reactionType]) reactions[r.paragraphId][r.reactionType] = [];
                    if (!reactions[r.paragraphId][r.reactionType].includes(r.userId)) {
                        reactions[r.paragraphId][r.reactionType].push(r.userId);
                    }
                }
                useReadingRoomStore.getState().setReactions(reactions);
            } catch {
                // Non-critical hydration errors; real-time socket will still work
            }
        };

        hydrate();

        return () => { cancelled = true; };
    }, [room?.roomId, room?.currentChapterSlug, chapterId]);

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
                                id={`paragraph-${para.id}`}
                                data-para-id={para.id}
                                ref={(el) => registerParaRef(para.id, el)}
                                className="group relative flex items-start"
                                onMouseUp={() => {
                                    handleMouseUp(para.id);
                                }}
                            >
                                <div className="flex-1 min-w-0 relative">
                                    <p
                                        className={`transition-colors duration-300 w-full relative ${activeParagraphId === para.id
                                            ? 'bg-warning/10 dark:bg-warning/20 rounded-lg px-2 -mx-2'
                                            : ''
                                            }`}
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

                                    {room && (
                                        <div className={`flex items-center gap-3 mt-1 transition-opacity duration-200 ${openCommentParaId === para.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <ParagraphAnnotations
                                                roomId={room.roomId}
                                                chapterSlug={chapterSlug}
                                                paragraphId={para.id}
                                                isOpen={openCommentParaId === para.id}
                                                onToggle={(open) => setOpenCommentParaId(open ? para.id : null)}
                                            />
                                            <ParagraphReactions
                                                roomId={room.roomId}
                                                chapterSlug={chapterSlug}
                                                paragraphId={para.id}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Reader avatars for this paragraph */}
                                {room && (
                                    <ReaderAvatars
                                        paragraphId={para.id}
                                        presences={presences}
                                        currentUserId={user?.id}
                                    />
                                )}

                                {/* Floating reaction bubbles (Feature 3) */}
                                {room && (
                                    <FloatingReactionBubbles paragraphId={para.id} />
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

                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => handleToggleComments(para)}
                                        title="Bình luận"
                                        className="h-7 w-7 rounded-md hover:scale-110 transition-transform"
                                        aria-label="Bình luận"
                                    >
                                        <MessageSquarePlus size={14} />
                                    </Button>

                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => handleOpenPostModal(para)}
                                        title="Chia sẻ"
                                        className="h-7 w-7 rounded-md hover:scale-110 transition-transform"
                                        aria-label="Chia sẻ"
                                    >
                                        <Share2 size={14} />
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
                    user={user}
                    room={room}
                    isEnded={isEnded}
                    onAI={handleAIAction}
                    onHighlightRoom={handleRoomHighlight}
                    onHighlightPersonal={handleAddPersonalHighlight}
                    onQuote={handleAddQuote}
                />

            </main>

            <ParagraphCommentDrawer
                isOpen={commentDrawerOpen}
                onClose={handleCloseDrawer}
                paragraphId={activeParagraph?.id || null}
                paragraphContent={activeParagraph?.content}
            />
        </TooltipProvider>
    );
});

const ChapterTextRenderer = ({
    content,
    highlights,
    userHighlights,
    currentUserId,
    onRemoveHighlight,
    onRemoveUserHighlight,
    generateHighlightInsight,
}: {
    content: string,
    highlights: RoomHighlight[],
    userHighlights?: UserHighlight[],
    currentUserId?: string,
    onRemoveHighlight?: (highlightId: string) => void,
    onRemoveUserHighlight?: (highlightId: string) => void,
    generateHighlightInsight?: (highlightId: string) => void,
}) => {
    // Track which highlight is currently being generated to show loading state
    const [generatingInsightId, setGeneratingInsightId] = useState<string | null>(null);

    let parts: (string | React.ReactNode)[] = [content];

    // 1. Process Highlights (Background)
    highlights.forEach(h => {
        const newParts: (string | React.ReactNode)[] = [];
        parts.forEach(part => {
            if (typeof part !== 'string') {
                newParts.push(part);
                return;
            }

            const index = part.indexOf(h.content);
            if (index === -1) {
                newParts.push(part);
            } else {
                newParts.push(part.substring(0, index));
                newParts.push(
                    <Popover key={`h-${h.id}-${index}`}>
                        <PopoverTrigger asChild>
                            <span className="bg-warning/20 dark:bg-warning/30 border-b-2 border-warning/50 cursor-pointer transition-all hover:bg-warning/30">
                                {h.content}
                            </span>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 border-none bg-transparent shadow-none" side="top" align="center" sideOffset={10}>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-64 p-4 rounded-2xl bg-background/80 backdrop-blur-xl border border-border shadow-2xl space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <User className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-muted-foreground">
                                            {h.user?.displayName || 'Thành viên'} highlight
                                        </span>
                                    </div>
                                    {currentUserId && h.userId === currentUserId && onRemoveHighlight && (
                                        <button
                                            className="p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                                            onClick={(e) => { e.stopPropagation(); onRemoveHighlight(h.id); }}
                                            title="Xóa highlight"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>

                                {h.aiInsight ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
                                            <Sparkles className="w-3 h-3 animate-pulse" />
                                            AI INSIGHT
                                        </div>
                                        <p className="text-xs leading-relaxed text-muted-foreground italic">
                                            &ldquo;{h.aiInsight}&rdquo;
                                        </p>
                                    </div>
                                ) : generatingInsightId === h.id ? (
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        AI đang suy nghĩ...
                                    </div>
                                ) : (
                                    <button
                                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-[11px] font-medium"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setGeneratingInsightId(h.id);
                                            generateHighlightInsight?.(h.id);
                                        }}
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Giải thích bằng AI
                                    </button>
                                )}
                            </motion.div>
                        </PopoverContent>
                    </Popover>
                );
                newParts.push(part.substring(index + h.content.length));
            }
        });
        parts = newParts;
    });

    // 2. Process Personal Highlights
    if (userHighlights && userHighlights.length > 0) {
        userHighlights.forEach(h => {
            const newParts: (string | React.ReactNode)[] = [];
            parts.forEach(part => {
                if (typeof part !== 'string') {
                    newParts.push(part);
                    return;
                }

                const index = part.indexOf(h.content);
                if (index === -1) {
                    newParts.push(part);
                } else {
                    newParts.push(part.substring(0, index));
                    newParts.push(
                        <PersonalHighlightPopover
                            key={`uh-${h.id}-${index}`}
                            highlight={h}
                            onRemoveUserHighlight={onRemoveUserHighlight}
                        />
                    );
                    newParts.push(part.substring(index + h.content.length));
                }
            });
            parts = newParts;
        });
    }

    return <>{parts}</>;
};

const PersonalHighlightPopover = memo(function PersonalHighlightPopover({
    highlight: h,
    onRemoveUserHighlight
}: {
    highlight: UserHighlight,
    onRemoveUserHighlight?: (id: string) => void
}) {
    const updateHighlight = useUpdateHighlight();
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [noteContent, setNoteContent] = useState(h.note || '');

    const handleSaveNote = async () => {
        await updateHighlight.mutateAsync({ id: h.id, note: noteContent });
        setIsEditingNote(false);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <span
                    className="cursor-pointer transition-all hover:opacity-80 rounded-sm px-0.5"
                    style={{ backgroundColor: `${h.color}40`, borderBottom: `2px solid ${h.color}` }}
                >
                    {h.content}
                </span>
            </PopoverTrigger>
            <PopoverContent className="p-0 border-none bg-transparent shadow-none" side="top" align="center" sideOffset={10}>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-64 p-4 rounded-2xl bg-background/95 backdrop-blur-xl border border-border shadow-2xl space-y-3"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${h.color}20` }}>
                                <Highlighter className="w-3.5 h-3.5" style={{ color: h.color }} />
                            </div>
                            <span className="text-[10px] font-black uppercase text-muted-foreground">
                                Highlight cá nhân
                            </span>
                        </div>
                        {onRemoveUserHighlight && (
                            <button
                                className="p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                                onClick={(e) => { e.stopPropagation(); onRemoveUserHighlight(h.id); }}
                                title="Xóa highlight"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {isEditingNote ? (
                        <div className="space-y-2">
                            <Textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Viết ghi chú..."
                                className="text-xs min-h-[60px] resize-none"
                                autoFocus
                            />
                            <div className="flex justify-end gap-1.5">
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setIsEditingNote(false)}>Hủy</Button>
                                <Button size="sm" className="h-6 text-[10px] px-2" onClick={handleSaveNote}>Lưu</Button>
                            </div>
                        </div>
                    ) : (
                        h.note ? (
                            <div
                                className="space-y-1 bg-muted p-2.5 rounded-xl border border-border/50 cursor-text hover:border-primary/30 transition-colors"
                                onClick={() => setIsEditingNote(true)}
                            >
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Ghi chú</span>
                                <p className="text-xs text-foreground leading-relaxed">{h.note}</p>
                            </div>
                        ) : (
                            <div className="text-center py-2 space-y-2">
                                <p className="text-[11px] text-muted-foreground italic">
                                    Chưa có ghi chú nào.
                                </p>
                                <Button size="sm" variant="outline" className="h-7 text-[11px] w-full" onClick={() => setIsEditingNote(true)}>
                                    Thêm ghi chú
                                </Button>
                            </div>
                        )
                    )}
                </motion.div>
            </PopoverContent>
        </Popover>
    );
});


