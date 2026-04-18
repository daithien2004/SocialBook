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
    const hasStats = likeCount > 0 || commentCount > 0;

    return (
        <CardFooter className="p-0 flex flex-col">
            <div className="px-4 py-2 w-full flex items-center justify-between border-t border-slate-100 dark:border-gray-800">
                <div className="flex gap-2 w-full">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onLike}
                        className={cn(
                            'flex-1 gap-2 px-3 text-muted-foreground transition-colors py-5',
                            isLiked
                                ? 'text-rose-500 dark:text-rose-400 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                                : 'hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                        )}
                    >
                        <Heart size={18} className={isLiked ? 'fill-current' : ''} />
                        <span className="text-sm font-medium">{isLiked ? 'Đã thích' : 'Thích'}</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onComment}
                        className="flex-1 gap-2 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors py-5"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Bình luận</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onShare}
                        className="flex-1 gap-2 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors py-5"
                    >
                        <Send className="w-5 h-5 -rotate-45 mb-1" />
                        <span className="text-sm font-medium">Chia sẻ</span>
                    </Button>
                </div>
            </div>

            {hasStats && (
                <div className="px-4 py-2 w-full bg-slate-50/50 dark:bg-gray-900/30 text-xs text-slate-500 dark:text-gray-400 flex gap-4 border-t border-slate-100 dark:border-gray-800/50">
                    {likeCount > 0 && (
                        <span className="flex items-center gap-1">
                            <Heart size={12} className="fill-rose-400 text-rose-400" />
                            {likeCount} lượt thích
                        </span>
                    )}
                    {commentCount > 0 && (
                        <span className="flex items-center gap-1">
                            <MessageCircle size={12} className="fill-primary/60 text-primary/60" />
                            {commentCount} bình luận
                        </span>
                    )}
                </div>
            )}
        </CardFooter>
    );
}
