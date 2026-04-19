'use client';

import { useAppAuth } from '@/features/auth/hooks';
import {
    CornerDownRight,
    Heart,
    Loader2,
    MessageCircle,
    MoreVertical,
} from 'lucide-react';
import React from 'react';

import ListComments from './ListComments';
import { useCommentActions } from '@/features/comments/hooks/useCommentActions';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CommentItem } from '@/features/comments/types/comment.interface';

interface CommentItemProps {
    comment: CommentItem;
    targetId: string;
    targetType: string;
}

const CommentItemCard: React.FC<CommentItemProps> = ({
    comment,
    targetId,
    targetType,
}) => {
    const { user } = useAppAuth();
    const userId = user?.id;

    const {
        isOwner,
        optimisticLikeCount,
        optimisticIsLiked,
        optimisticReplyCount,
        isEditing,
        editText,
        setEditText,
        isReplying,
        replyText,
        setReplyText,
        showReplies,
        isEditingComment,
        isDeletingComment,
        isPostingReply,
        isResolvingParent,
        resolvedData,
        effectiveParentId,
        setIsEditing,
        handleEditComment,
        handleDeleteComment,
        handleSubmitReply,
        handleLikeComment,
        handleReplyClick,
    } = useCommentActions({
        comment,
        targetId,
        targetType,
        userId,
    });

    const level = resolvedData?.level;
    const hasReplyCount = comment.repliesCount !== undefined;
    const displayedReplyCount = hasReplyCount ? optimisticReplyCount : null;

    return (
        <div className="group flex w-full animate-in fade-in items-start gap-3 duration-300">
            <Avatar className="mt-1 h-8 w-8 shrink-0 border border-border">
                <AvatarImage
                    src={comment.user.image}
                    alt={comment.user.username}
                />
                <AvatarFallback className="text-[10px] font-bold">
                    {comment.user.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
                <div className="flex items-center">
                    <div className="relative rounded-2xl bg-muted/50 px-3 py-2">
                        <div className="pr-6">
                            <span className="mb-0.5 block text-sm font-bold text-foreground">
                                {comment.user.username}
                            </span>

                            {isEditing ? (
                                <div className="flex items-start gap-2">
                                    <Input
                                        value={editText}
                                        onChange={(e) =>
                                            setEditText(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === 'Enter' &&
                                                !e.shiftKey
                                            ) {
                                                e.preventDefault();
                                                handleEditComment();
                                            }
                                            if (e.key === 'Escape') {
                                                setIsEditing(false);
                                                setEditText(comment.content);
                                            }
                                        }}
                                        className="h-8 max-w-[200px]"
                                        autoFocus
                                    />

                                    <Button
                                        disabled={isEditingComment}
                                        onClick={handleEditComment}
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 bg-primary/10 text-primary hover:bg-primary/20"
                                        aria-label="Xác nhận sửa"
                                    >
                                        <CornerDownRight size={14} />
                                    </Button>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                                    {comment.content}
                                </p>
                            )}
                        </div>
                    </div>

                    {isOwner && (
                        <div className="relative ml-1">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                                        aria-label="Tùy chọn bình luận"
                                    >
                                        <MoreVertical
                                            size={16}
                                            className="text-muted-foreground"
                                        />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="start"
                                    side="bottom"
                                    className="w-40"
                                >
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setIsEditing(true);
                                            setEditText(comment.content);
                                        }}
                                    >
                                        Chỉnh sửa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleDeleteComment}
                                        className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                    >
                                        {isDeletingComment
                                            ? 'Đang xóa...'
                                            : 'Xóa'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                <div className="ml-3 mt-1 flex items-center gap-4">
                    <button
                        onClick={handleLikeComment}
                        className={cn(
                            'flex items-center gap-1.5 text-xs font-medium transition-colors hover:bg-transparent',
                            optimisticIsLiked
                                ? 'text-red-500'
                                : 'text-muted-foreground hover:text-red-500'
                        )}
                    >
                        <Heart
                            size={12}
                            className={optimisticIsLiked ? 'fill-current' : ''}
                        />
                        {optimisticLikeCount > 0 && (
                            <span>{optimisticLikeCount}</span>
                        )}
                        <span className="hidden sm:inline">Thích</span>
                    </button>

                    <button
                        onClick={handleReplyClick}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground"
                    >
                        <MessageCircle size={12} />
                        {displayedReplyCount !== null
                            ? `Trả lời (${displayedReplyCount})`
                            : 'Trả lời'}
                    </button>
                </div>

                <div className="mt-2">
                    {showReplies && (
                        <div className="ml-2 mb-2 mt-2 space-y-3 border-l-2 border-border pl-3">
                            {isResolvingParent && !resolvedData && (
                                <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                                    <Loader2
                                        size={12}
                                        className="animate-spin"
                                    />
                                    Đang tải phản hồi...
                                </div>
                            )}

                            {resolvedData && level !== 3 && (
                                <ListComments
                                    targetId={targetId}
                                    isCommentOpen
                                    parentId={effectiveParentId}
                                    targetType={targetType}
                                />
                            )}

                            {isReplying && (
                                <div className="flex animate-in items-start gap-2 fade-in slide-in-from-top-2">
                                    <Input
                                        placeholder={`Trả lời ${comment.user.username}...`}
                                        value={replyText}
                                        onChange={(e) =>
                                            setReplyText(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === 'Enter' &&
                                                !e.shiftKey
                                            ) {
                                                e.preventDefault();
                                                handleSubmitReply();
                                            }
                                        }}
                                        className="h-9 flex-1 text-sm"
                                        autoFocus
                                    />

                                    <Button
                                        disabled={
                                            isPostingReply || !replyText.trim()
                                        }
                                        onClick={handleSubmitReply}
                                        size="icon"
                                        className="h-9 w-9 bg-primary hover:bg-primary/90"
                                        aria-label="Gửi phản hồi"
                                    >
                                        {isPostingReply ? (
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <CornerDownRight size={16} />
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentItemCard;
