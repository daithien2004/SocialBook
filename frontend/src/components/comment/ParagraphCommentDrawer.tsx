'use client';

import { useAppAuth } from '@/src/hooks/useAppAuth';
import { getErrorMessage } from '@/src/lib/utils';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import ListComments from '@/src/components/comment/ListComments';
import { Button } from '@/src/components/ui/button';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/src/components/ui/sheet';
import { Textarea } from '@/src/components/ui/textarea';
import { usePostCreateMutation } from '@/src/features/comments/api/commentApi';

interface ParagraphCommentDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    paragraphId: string | null;
    paragraphContent?: string;
    hasHeader?: boolean;
}

export default function ParagraphCommentDrawer({
    isOpen,
    onClose,
    paragraphId,
    paragraphContent,
    hasHeader = false,
}: ParagraphCommentDrawerProps) {
    const [commentText, setCommentText] = useState('');

    const [createComment, { isLoading }] = usePostCreateMutation();

    const { isAuthenticated } = useAppAuth();
    const router = useRouter();

    const handleSubmit = async () => {
        if (!paragraphId || !commentText.trim()) return;

        if (!isAuthenticated) {
            toast.info('Vui lòng đăng nhập để bình luận', {
                action: { label: 'Đăng nhập', onClick: () => router.push('/login') },
            });
            return;
        }

        try {
            await createComment({
                targetType: 'paragraph',
                targetId: paragraphId,
                content: commentText.trim(),
                parentId: null,
            }).unwrap();

            setCommentText('');
            toast.success('Bình luận đã được gửi!');
        } catch (e: any) {
            if (e?.status !== 401) {
                toast.error(getErrorMessage(e));
            }
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col gap-0 border-l border-border bg-background">
                <SheetHeader className="p-5 border-b border-border bg-background shrink-0">
                    <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                        <MessageSquare className="w-5 h-5" />
                        Thảo luận
                    </SheetTitle>
                    {paragraphContent && (
                        <div className="mt-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-border italic border-l-4 border-l-primary/50">
                            "{paragraphContent.length > 150 ? paragraphContent.substring(0, 150) + '...' : paragraphContent}"
                        </div>
                    )}
                    <SheetDescription className="sr-only">
                        Bình luận cho đoạn văn
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col flex-1 overflow-hidden bg-muted/10">
                    {/* Input Area */}
                    <div className="p-4 border-b border-border bg-background shrink-0">
                        <div className="flex items-start gap-3">
                            <div className="relative flex-1">
                                <Textarea
                                    placeholder="Viết suy nghĩ của bạn..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="min-h-[44px] max-h-[120px] resize-none pr-12 bg-muted/30 focus:bg-background"
                                />
                                {commentText.length > 0 && (
                                    <span className="absolute right-2 bottom-2 text-[10px] text-muted-foreground">
                                        {commentText.length}
                                    </span>
                                )}
                            </div>

                            <Button
                                disabled={isLoading || !commentText.trim()}
                                onClick={handleSubmit}
                                size="icon"
                                className="h-10 w-10 shrink-0 rounded-full"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Comments List */}
                    <ScrollArea className="flex-1 p-4">
                        {paragraphId && (
                            <ListComments
                                targetId={paragraphId}
                                parentId={null}
                                targetType="paragraph"
                                isCommentOpen={true}
                                theme="dark"
                            />
                        )}
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    );
}