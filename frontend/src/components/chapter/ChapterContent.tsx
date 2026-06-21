'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useReadingSettings } from '@/store/useReadingSettings';
import { useChapterComments } from '@/features/chapters/hooks/useChapterComments';
import { useReadingRoomStore, RoomHighlight } from '@/store/useReadingRoomStore';
import { ParagraphReactions } from '@/features/reading-room-interactions/components/ParagraphReactions';
import { ParagraphAnnotations } from '@/features/reading-room-interactions/components/ParagraphAnnotations';
import { Highlighter, Sparkles, User, QuoteIcon, Trash2, MessageSquarePlus, Share2 } from 'lucide-react';
import ParagraphCommentDrawer from '../comment/ParagraphCommentDrawer';
import { useReadingRoomSocket } from '@/features/reading-rooms/hooks/useReadingRoomSocket';
import { useAppAuth } from '@/features/auth/hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '../ui/badge';
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useGetChapterKnowledgeQuery, useAskChapterAIMutation } from '@/features/chapters/api/chaptersApi';
import { useLazyGetRoomCommentsQuery, useLazyGetRoomReactionsQuery } from '@/features/reading-room-interactions/api/roomInteractionsApi';
import { toast } from 'sonner';

import { KnowledgeEntity } from '@/features/chapters/types/chapter.interface';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ReaderAvatars } from './ReaderAvatars';
import { RemoteSelectionOverlay } from './RemoteSelectionOverlay';
import { FloatingReactionBubbles } from '@/features/reading-rooms/components/FloatingReactionBubbles';
import { useShallow } from 'zustand/react/shallow';
import { useCollaborativeSelection } from '@/hooks/useCollaborativeSelection';

interface Paragraph {
    id: string;
    content: string;
}

interface ChapterContentProps {
    paragraphs: Paragraph[];
    chapterId: string;
    bookId: string;
    bookSlug: string;
    bookCoverImage?: string;
    bookTitle?: string;
    onActiveParagraphChange?: (paragraphId: string | null) => void;
}


export const ChapterContent = memo(function ChapterContent({
    paragraphs,
    chapterId,
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

    const { data } = useGetChapterKnowledgeQuery(
        { bookSlug, chapterId },
        { skip: !bookSlug || !chapterId }
    );


    const room = useReadingRoomStore((state) => state.room);
    const isEnded = room?.status === 'ended';
    const highlights = useReadingRoomStore((state) => state.highlights);
    const presences = useReadingRoomStore(useShallow((state) => state.presences));
    const { addHighlight, removeHighlight, addQuote, generateHighlightInsight } = useReadingRoomSocket();
    const { user } = useAppAuth();

    // Track which paragraph is most visible in the viewport
    const paraRefsMap = useRef<Map<string, HTMLElement>>(new Map());
    const registerParaRef = useCallback((id: string, el: HTMLElement | null) => {
        if (el) {
            paraRefsMap.current.set(id, el);
        } else {
            paraRefsMap.current.delete(id);
        }
    }, []);

    useEffect(() => {
        if (!onActiveParagraphChange) return;
        const ratios = new Map<string, number>();
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    const id = (e.target as HTMLElement).dataset.paraId;
                    if (id) ratios.set(id, e.intersectionRatio);
                });
                // Find paragraph with highest intersection ratio
                let bestId: string | null = null;
                let bestRatio = 0;
                ratios.forEach((ratio, id) => {
                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                        bestId = id;
                    }
                });
                onActiveParagraphChange(bestRatio > 0.1 ? bestId : null);
            },
            { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0] },
        );
        // Observe all current paragraph elements
        paraRefsMap.current.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [onActiveParagraphChange, paragraphs]);

    // Stable color map — userId → color index, persists across renders
    const [userColorMap] = useState(() => new Map<string, number>());

    const { handleParagraphMouseUp } = useCollaborativeSelection({
        roomId: room?.roomId ?? null,
        currentUserId: user?.id,
        userColorMap,
    });

    const [openCommentParaId, setOpenCommentParaId] = useState<string | null>(null);

    const [selection, setSelection] = useState<{
        text: string;
        paraId: string;
        rect: DOMRect;
    } | null>(null);

    const [aiAnalysis, setAiAnalysis] = useState<{
        type: string;
        content: string;
        isLoading: boolean;
    } | null>(null);

    const [askAI] = useAskChapterAIMutation();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                // Check if user is actually selecting something new
                const sel = window.getSelection();
                if (!sel || sel.toString().trim().length < 5) {
                    setSelection(null);
                    setAiAnalysis(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Hydrate paragraph content map for excerpt previews
    useEffect(() => {
        if (!paragraphs || paragraphs.length === 0) return;
        const map: Record<string, string> = {};
        for (const p of paragraphs) {
            map[p.id] = p.content;
        }
        useReadingRoomStore.getState().setParagraphContentMap(map);
    }, [paragraphs]);

    // Handle scroll-to-paragraph clicks from EmotionStream
    const scrollTargetId = useReadingRoomStore((state) => state.scrollTargetParagraphId);
    useEffect(() => {
        if (!scrollTargetId) return;
        const el = paraRefsMap.current.get(scrollTargetId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Flash effect can be added here if needed, but the scroll is the main thing
            useReadingRoomStore.getState().setScrollTargetParagraphId(null);
        }
    }, [scrollTargetId]);

    const [fetchComments] = useLazyGetRoomCommentsQuery();
    const [fetchReactions] = useLazyGetRoomReactionsQuery();

    useEffect(() => {
        if (!room?.roomId || !room?.currentChapterSlug || !chapterId) return;

        let cancelled = false;
        useReadingRoomStore.setState({ roomComments: [], reactions: {} });

        const hydrate = async () => {
            try {
                const [comments, reactionsData] = await Promise.all([
                    fetchComments({ code: room.roomId, chapterSlug: room.currentChapterSlug }).unwrap(),
                    fetchReactions({ code: room.roomId, chapterSlug: room.currentChapterSlug }).unwrap(),
                ]);
                if (cancelled) return;

                useReadingRoomStore.getState().setRoomComments(comments);

                const reactions: Record<string, Record<string, string[]>> = {};
                for (const r of reactionsData) {
                    if (!reactions[r.paragraphId]) reactions[r.paragraphId] = {};
                    if (!reactions[r.paragraphId][r.reactionType]) reactions[r.paragraphId][r.reactionType] = [];
                    if (!reactions[r.paragraphId][r.reactionType].includes(r.userId)) {
                        reactions[r.paragraphId][r.reactionType].push(r.userId);
                    }
                }
                useReadingRoomStore.setState({ reactions });
            } catch {
                // Hydration errors are non-critical; real-time socket will still work
            }
        };

        hydrate();

        return () => { cancelled = true; };
    }, [room?.roomId, room?.currentChapterSlug, chapterId, fetchComments, fetchReactions]);

    const handleMouseUp = (paraId: string) => {

        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || sel.toString().trim().length < 5) {
            // If clicking outside, but inside our analysis bubble, don't close
            return;
        }

        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setSelection({
            text: sel.toString(),
            paraId,
            rect,
        });
        setAiAnalysis(null); // Reset analysis when new selection is made
    };

    const handleAIAction = async (type: 'explain' | 'summarize' | 'character' | 'translate') => {
        if (!selection) return;

        const prompts = {
            explain: `Giải thích ý nghĩa và ngữ cảnh của đoạn văn này trong truyện: "${selection.text}"`,
            summarize: `Tóm tắt ngắn gọn và súc tích đoạn văn này: "${selection.text}"`,
            character: `Phân tích tâm lý, hành động hoặc vai trò của các nhân vật xuất hiện trong đoạn này: "${selection.text}"`,
            translate: `Dịch đoạn văn này sang tiếng Việt một cách mượt mà và giải thích các thuật ngữ khó (nếu có): "${selection.text}"`,
        };

        setAiAnalysis({ type, content: '', isLoading: true });

        try {
            const response = await askAI({
                bookSlug,
                chapterId,
                question: prompts[type]
            }).unwrap();

            const answer = response.answer;
            setAiAnalysis({ type, content: answer, isLoading: false });
        } catch {
            toast.error('AI không thể xử lý lúc này.');
            setAiAnalysis(null);
        }
    };


    const handleAddHighlight = () => {
        if (!selection || !room) return;

        addHighlight({
            chapterSlug: room.currentChapterSlug,
            paragraphId: selection.paraId,
            content: selection.text,
        });

        setSelection(null);
        window.getSelection()?.removeAllRanges();
    };

    const handleAddQuote = () => {
        if (!selection || !room) return;

        addQuote(room.currentChapterSlug, selection.paraId, selection.text);

        setSelection(null);
        window.getSelection()?.removeAllRanges();
    };


    return (
        <TooltipProvider>
            <main
                className="flex-1 w-full antialiased relative transition-all duration-300 rounded-2xl p-10 selection:bg-brand/30"
                style={{
                    backgroundColor: settings.backgroundColor,
                    color: settings.textColor,
                    paddingLeft: `${settings.marginWidth}px`,
                    paddingRight: `${settings.marginWidth}px`,
                }}
            >
                <article className="space-y-4">
                    {paragraphs.map((para) => {
                        const paraHighlights = highlights.filter(h => h.paragraphId === para.id);

                        return (
                            <div
                                key={para.id}
                                data-para-id={para.id}
                                ref={(el) => registerParaRef(para.id, el)}
                                className="group relative flex items-start"
                                onMouseUp={(_e) => {
                                    handleMouseUp(para.id);
                                    if (room) {
                                        const container = paraRefsMap.current.get(para.id);
                                        if (container) handleParagraphMouseUp(para.id, container);
                                    }
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
                                            knowledge={data?.entities || []}
                                            currentUserId={user?.id}
                                            onRemoveHighlight={removeHighlight}
                                            generateHighlightInsight={generateHighlightInsight}
                                        />
                                    </p>

                                    {/* Remote collaborative highlight overlay */}
                                    {room && (
                                        <RemoteSelectionOverlay
                                            paragraphId={para.id}
                                        />
                                    )}

                                    {room && (
                                        <div className={`flex items-center gap-3 mt-1 transition-opacity duration-200 ${openCommentParaId === para.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <ParagraphAnnotations
                                                roomId={room.roomId}
                                                chapterSlug={room.currentChapterSlug}
                                                paragraphId={para.id}
                                                isOpen={openCommentParaId === para.id}
                                                onToggle={(open) => setOpenCommentParaId(open ? para.id : null)}
                                            />
                                            <ParagraphReactions
                                                roomId={room.roomId}
                                                chapterSlug={room.currentChapterSlug}
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

                                <div className="absolute right-full top-0 mr-16 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pt-0.5 shrink-0 z-10">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                onClick={() => handleToggleComments(para)}
                                                className="h-8 w-8 rounded-full shadow-sm hover:scale-110 transition-transform"
                                                aria-label="Bình luận đoạn này"
                                            >
                                                <MessageSquarePlus size={16} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            <p>Bình luận</p>
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                onClick={() => handleOpenPostModal(para)}
                                                className="h-8 w-8 rounded-full shadow-sm hover:scale-110 transition-transform"
                                                aria-label="Chia sẻ trích dẫn"
                                            >
                                                <Share2 size={16} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            <p>Chia sẻ</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        );
                    })}
                </article>

                <AnimatePresence>
                    {selection && (
                        <div
                            ref={menuRef}
                            className="fixed z-50 pointer-events-none"
                            style={{
                                top: selection.rect.top,
                                left: selection.rect.left + (selection.rect.width / 2),
                            }}
                        >

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="pointer-events-auto flex items-center gap-0.5 p-1 bg-neutral-900 dark:bg-black/90 backdrop-blur-xl border border-neutral-700 dark:border-gray-700 rounded-full shadow-2xl shadow-black/30 dark:shadow-black/60 -translate-x-1/2 -translate-y-[120%]"
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-9 w-9 rounded-full p-0 text-neutral-200 hover:bg-white/10 hover:text-white"
                                            onClick={() => handleAIAction('explain')}
                                        >
                                            <Sparkles className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p className="text-[10px]">Giải thích AI</p></TooltipContent>
                                </Tooltip>

                                {room && !isEnded && (
                                    <>
                                        <div className="w-[1px] h-4 bg-border mx-1" />

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-9 rounded-full gap-2 px-3 text-neutral-200 hover:bg-white/10 hover:text-white"
                                            onClick={handleAddHighlight}
                                        >
                                            <Highlighter className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold">Highlight</span>
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-9 rounded-full gap-2 px-3 text-neutral-200 hover:bg-white/10 hover:text-white"
                                            onClick={handleAddQuote}
                                        >
                                            <QuoteIcon className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold">Trích dẫn</span>
                                        </Button>
                                    </>
                                )}
                            </motion.div>

                            {/* AI Result Bubble */}
                            <AnimatePresence>
                                {aiAnalysis && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="pointer-events-auto absolute top-2 left-0 -translate-x-1/2 w-80 max-h-60 overflow-hidden rounded-2xl bg-background/80 backdrop-blur-xl border border-border shadow-2xl shadow-black/15 dark:shadow-black/60 p-4 flex flex-col gap-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                                                    AI {aiAnalysis.type === 'explain' ? 'Giải thích' : aiAnalysis.type === 'summarize' ? 'Tóm tắt' : aiAnalysis.type === 'character' ? 'Nhân vật' : 'Dịch thuật'}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-full"
                                                onClick={() => setAiAnalysis(null)}
                                            >
                                                <span className="text-xs">×</span>
                                            </Button>
                                        </div>

                                        <ScrollArea className="flex-1 pr-2">
                                            {aiAnalysis.isLoading ? (
                                                <div className="flex flex-col gap-2 py-4">
                                                    <div className="h-3 w-3/4 bg-muted rounded-full animate-pulse" />
                                                    <div className="h-3 w-1/2 bg-muted rounded-full animate-pulse" />
                                                    <div className="h-3 w-2/3 bg-muted rounded-full animate-pulse" />
                                                </div>
                                            ) : (
                                                <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                                                    {aiAnalysis.content}
                                                </p>
                                            )}
                                        </ScrollArea>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </AnimatePresence>

            </main>

            <ParagraphCommentDrawer
                isOpen={commentDrawerOpen}
                onClose={handleCloseDrawer}
                paragraphId={activeParagraph?.id || null}
                paragraphContent={activeParagraph?.content}
                chapterId={chapterId}
            />
        </TooltipProvider>
    );
});

const ChapterTextRenderer = ({
    content,
    highlights,
    knowledge,
    currentUserId,
    onRemoveHighlight,
    generateHighlightInsight,
}: {
    content: string,
    highlights: RoomHighlight[],
    knowledge: KnowledgeEntity[],
    currentUserId?: string,
    onRemoveHighlight?: (highlightId: string) => void,
    generateHighlightInsight?: (highlightId: string) => void,
}) => {
    // Track which highlight is currently being generated to show loading state
    const [generatingInsightId, setGeneratingInsightId] = useState<string | null>(null);

    // 1. Process Knowledge (Dotted Underline)
    // Only show vocabulary and reference as underlines to avoid clutter
    const relevantKnowledge = knowledge.filter(k => ['vocabulary', 'reference', 'concept'].includes(k.type));

    let parts: (string | React.ReactNode)[] = [content];

    // Simple replacement strategy
    relevantKnowledge.forEach(k => {
        const newParts: (string | React.ReactNode)[] = [];
        parts.forEach(part => {
            if (typeof part !== 'string') {
                newParts.push(part);
                return;
            }

            const index = part.toLowerCase().indexOf(k.name.toLowerCase());
            if (index === -1) {
                newParts.push(part);
            } else {
                newParts.push(part.substring(0, index));
                newParts.push(
                    <Tooltip key={`k-${k.name}-${index}`}>
                        <TooltipTrigger asChild>
                            <span className="border-b border-dotted border-primary/50 cursor-help hover:text-primary transition-colors">
                                {part.substring(index, index + k.name.length)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="p-3 max-w-xs bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-xl">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-primary tracking-wider">{k.type}</span>
                                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 opacity-60">{k.importance}/10</Badge>
                                </div>
                                <p className="text-xs font-bold">{k.name}</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">{k.description}</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                );
                newParts.push(part.substring(index + k.name.length));
            }
        });
        parts = newParts;
    });

    // 2. Process Highlights (Background)
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

    return <>{parts}</>;
};


