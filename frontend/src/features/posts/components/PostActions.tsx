'use client';

import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostActionsProps {
    isLiked: boolean;
    likeCount: number;
    commentCount: number;
    onLike: () => void;
    onComment: () => void;
    onShare: () => void;
}

export function PostActions({
    isLiked,
    likeCount,
    commentCount,
    onLike,
    onComment,
    onShare,
}: PostActionsProps) {
    return (
        <CardFooter className="p-0 flex flex-col">
            <div className="px-3 py-0.5 w-full flex items-center border-t border-border">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onLike}
                        className={cn(
                            'gap-1 text-muted-foreground hover:bg-transparent rounded-none py-2 h-auto px-2',
                            isLiked
                                ? 'text-rose-500 dark:text-rose-400 hover:text-rose-600'
                                : 'hover:text-rose-500'
                        )}
                    >
                        <Heart size={15} className={isLiked ? 'fill-current' : ''} />
                        {likeCount > 0 && (
                            <span className="text-sm font-medium leading-none">{likeCount}</span>
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onComment}
                        className="gap-1 text-muted-foreground hover:text-sky-500 hover:bg-transparent transition-colors rounded-none py-2 h-auto px-2"
                    >
                        <MessageCircle size={15} />
                        {commentCount > 0 && (
                            <span className="text-sm font-medium leading-none">{commentCount}</span>
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onShare}
                        className="gap-1 text-muted-foreground hover:text-sky-500 hover:bg-transparent transition-colors rounded-none py-2 h-auto px-2"
                    >
                        <Send size={15} />
                    </Button>
                </div>
            </div>
        </CardFooter>
    );
}
