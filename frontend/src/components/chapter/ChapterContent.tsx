'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useReadingSettings } from '@/store/useReadingSettings';
import { useChapterComments } from '@/features/chapters/hooks/useChapterComments';
import { MessageSquarePlus, Share2 } from 'lucide-react';
import ParagraphCommentDrawer from '../comment/ParagraphCommentDrawer';

interface Paragraph {
    id: string;
    content: string;
}

interface ChapterContentProps {
    paragraphs: Paragraph[];
    chapterId: string;
    bookId: string;
    bookCoverImage?: string;
    bookTitle?: string;
}

export function ChapterContent({
    paragraphs,
    bookId,
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
                    {paragraphs.map((para) => (
                        <div key={para.id} className="group relative">
                            <div className="flex items-start">
                                <p
                                    className={`transition-colors duration-300 w-full ${
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
                                    {para.content}
                                </p>

                                <div className="absolute -right-12 top-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                        </div>
                    ))}
                </article>
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
