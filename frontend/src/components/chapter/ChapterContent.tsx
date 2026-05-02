'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useReadingSettings } from '@/store/useReadingSettings';
import { useChapterComments } from '@/features/chapters/hooks/useChapterComments';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { MessageSquarePlus, Share2, Highlighter, Sparkles, User, MessageCircle } from 'lucide-react';
import ParagraphCommentDrawer from '../comment/ParagraphCommentDrawer';
import { useReadingRoomSocket } from '@/features/reading-rooms/hooks/useReadingRoomSocket';
import { useAppAuth } from '@/features/auth/hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '../ui/badge';
import { useState, useRef, useEffect } from 'react';
import { useGetChapterKnowledgeQuery, useAskChapterAIMutation } from '@/features/chapters/api/chaptersApi';
import { Languages, ScrollText, Sparkles as SparklesIcon } from 'lucide-react';
import { toast } from 'sonner';

import { KnowledgeEntity } from '@/features/chapters/types/chapter.interface';
import { ScrollArea } from '@radix-ui/react-scroll-area';

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
}


export function ChapterContent({
    paragraphs,
    chapterId,
    bookId,
    bookSlug,
    bookTitle,
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


    const roomAnnotations = useReadingRoomStore((state) => state.annotations);
    const room = useReadingRoomStore((state) => state.room);
    const highlights = useReadingRoomStore((state) => state.highlights);
    const { addHighlight } = useReadingRoomSocket();
    const { user } = useAppAuth();

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

            const answer = (response as any).data?.answer || response.answer;
            setAiAnalysis({ type, content: answer, isLoading: false });
        } catch (err) {
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


    return (
        <TooltipProvider>
            <main
                className="flex-1 w-full antialiased relative transition-all duration-300 rounded-2xl p-10 selection:bg-red-500/30"
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
                                className="group relative"
                                onMouseUp={() => handleMouseUp(para.id)}
                            >
                                <div className="flex items-start">
                                    <p
                                        className={`transition-colors duration-300 w-full relative ${
                                            activeParagraphId === para.id
                                                ? 'bg-yellow-100/50 dark:bg-yellow-900/20 rounded-lg px-2 -mx-2'
                                                : ''
                                        }`}
                                        style={{
                                            fontSize: `${settings.fontSize}px`,
                                            fontFamily: settings.fontFamily,
                                            lineHeight: settings.lineHeight,
                                            letterSpacing: `${settings.letterSpacing}px`,
                                            textAlign: settings.textAlign as any,
                                        }}
                                    >
                                        <ChapterTextRenderer 
                                            content={para.content} 
                                            highlights={paraHighlights} 
                                            knowledge={data?.entities || []}
                                        />
                                    </p>


                                    <div className="absolute -right-12 top-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    onClick={() => handleToggleComments(para)}
                                                    className="h-8 w-8 rounded-full shadow-sm hover:scale-110 transition-transform relative"
                                                    aria-label="Bình luận đoạn này"
                                                >
                                                    <MessageSquarePlus size={16} />
                                                    {room && roomAnnotations[para.id] > 0 && (
                                                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                                                            {roomAnnotations[para.id]}
                                                        </span>
                                                    )}
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
                                className="pointer-events-auto flex items-center gap-0.5 p-1 bg-background/95 backdrop-blur-xl border border-border rounded-full shadow-2xl shadow-primary/20 -translate-x-1/2 -translate-y-[120%]"
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-9 w-9 rounded-full p-0 hover:bg-primary/10 hover:text-primary"
                                            onClick={() => handleAIAction('explain')}
                                        >
                                            <SparklesIcon className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p className="text-[10px]">Giải thích AI</p></TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-9 w-9 rounded-full p-0 hover:bg-primary/10 hover:text-primary"
                                            onClick={() => handleAIAction('summarize')}
                                        >
                                            <ScrollText className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p className="text-[10px]">Tóm tắt</p></TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-9 w-9 rounded-full p-0 hover:bg-primary/10 hover:text-primary"
                                            onClick={() => handleAIAction('character')}
                                        >
                                            <User className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p className="text-[10px]">Phân tích nhân vật</p></TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-9 w-9 rounded-full p-0 hover:bg-primary/10 hover:text-primary"
                                            onClick={() => handleAIAction('translate')}
                                        >
                                            <Languages className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p className="text-[10px]">Dịch thuật</p></TooltipContent>
                                </Tooltip>

                                <div className="w-[1px] h-4 bg-border mx-1" />

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-9 rounded-full gap-2 px-3 hover:bg-primary/10 hover:text-primary"
                                    onClick={handleAddHighlight}
                                >
                                    <Highlighter className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-bold">Highlight</span>
                                </Button>
                            </motion.div>

                            {/* AI Result Bubble */}
                            <AnimatePresence>
                                {aiAnalysis && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="pointer-events-auto absolute top-2 left-0 -translate-x-1/2 w-80 max-h-60 overflow-hidden rounded-2xl bg-background/95 backdrop-blur-xl border border-border shadow-2xl p-4 flex flex-col gap-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <SparklesIcon className="w-3.5 h-3.5 text-primary" />
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
            />
        </TooltipProvider>
    );
}

const ChapterTextRenderer = ({ 
    content, 
    highlights, 
    knowledge 
}: { 
    content: string, 
    highlights: any[], 
    knowledge: KnowledgeEntity[] 
}) => {
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
                    <Tooltip key={`h-${h.id}-${index}`}>
                        <TooltipTrigger asChild>
                            <span className="bg-yellow-400/30 dark:bg-yellow-600/40 border-b-2 border-yellow-500/50 cursor-help transition-all hover:bg-yellow-400/50">
                                {h.content}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent className="p-0 border-none bg-transparent shadow-none" side="top" align="center">
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-64 p-4 rounded-2xl bg-background/80 backdrop-blur-xl border border-border shadow-2xl space-y-3"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-muted-foreground">
                                        {h.user?.displayName || 'Thành viên'} highlight
                                    </span>
                                </div>
                                
                                {h.aiInsight ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
                                            <Sparkles className="w-3 h-3 animate-pulse" />
                                            AI INSIGHT
                                        </div>
                                        <p className="text-xs leading-relaxed text-muted-foreground italic">
                                            "{h.aiInsight}"
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        AI đang suy nghĩ...
                                    </div>
                                )}
                            </motion.div>
                        </TooltipContent>
                    </Tooltip>
                );
                newParts.push(part.substring(index + h.content.length));
            }
        });
        parts = newParts;
    });

    return <>{parts}</>;
};


