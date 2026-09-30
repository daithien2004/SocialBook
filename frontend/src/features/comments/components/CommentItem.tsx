'use client';

import {
    CornerDownRight,
    Heart,
    Loader2,
    MessageCircle,
    MoreVertical,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import ListComments from './ListComments';
import { useCommentEdit } from '@/features/comments/hooks/useCommentEdit';
import { useCommentReply } from '@/features/comments/hooks/useCommentReply';
import { useCommentDelete } from '@/features/comments/hooks/useCommentDelete';
import { useAppAuth } from '@/features/auth/hooks';
import { subject } from '@casl/ability';
import { Action, Subject } from '@socialbook/shared';
import { useToggleLike } from '@/features/likes/api/like.mutations';
import { useOptimisticToggle } from '@/hooks/useOptimisticToggle';

import { UserAvatar } from '@/components/shared/UserAvatar';
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
import { useModalStore } from '@/store/useModalStore';

interface CommentItemProps {
    comment: CommentItem;
    targetId: string;
    targetType: string;
    depth?: number;
    onReplyAdded?: () => void;
    onReplyRemoved?: () => void;
}

const CommentItemCard: React.FC<CommentItemProps> = React.memo(function CommentItemCard({
    comment,
    targetId,
    targetType,
    depth = 1,
    onReplyAdded,
    onReplyRemoved,
}) {
    const router = useRouter();
    const closePostComment = useModalStore(s => s.closePostComment);
    const { ability } = useAppAuth();

    const [showReplies, setShowReplies] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [optimisticReplyCount, setOptimisticReplyCount] = useState(comment.repliesCount ?? 0);

    const isOwner = ability?.can(Action.Update, subject(Subject.Comment, { userId: comment.user.id })) ?? false;
    const hasReplyCount = comment.repliesCount !== undefined;
    const effectiveParentId = depth === 3 ? (comment.parentId ?? comment.id) : comment.id;

    useEffect(() => {
        if (hasReplyCount) {
            queueMicrotask(() => {
                setOptimisticReplyCount(comment.repliesCount ?? 0);
            });
        }
    }, [comment.repliesCount, hasReplyCount]);

    const { handleEditComment, isEditingComment } = useCommentEdit(comment, targetId, () => setIsEditing(false));
    const { handleDeleteComment, isDeletingComment } = useCommentDelete(comment, targetId, onReplyRemoved);
    const { handleSubmitReply, isPostingReply } = useCommentReply(
        comment, 
        targetId, 
        targetType, 
        depth, 
        (isMaxDepth) => {
            setReplyText('');
            setShowReplies(true);
            setIsReplying(false);
            if (!isMaxDepth && hasReplyCount) {
                setOptimisticReplyCount((prev) => prev + 1);
            }
        },
        onReplyAdded
    );

    const toggleLike = useToggleLike();
    const {
        isActive: optimisticIsLiked,
        toggle: handleLikeComment,
    } = useOptimisticToggle({
        initialCount: comment.likesCount ?? 0,
        initialState: comment.isLiked ?? false,
        onToggle: () => toggleLike.mutateAsync({
            targetId: comment.id,
            targetType: 'comment',
        }),
    });

    const handleReplyClick = () => {
        setShowReplies(true);
        setIsReplying((prev) => !prev);
    };

    const displayedReplyCount = hasReplyCount ? optimisticReplyCount : null;

    return (
        <div className="group flex w-full animate-in fade-in items-start gap-3 duration-300">
            <UserAvatar
                src={comment.user.image}
                name={comment.user.username}
                size="sm"
                className="mt-1 shrink-0 border border-border"
                fallbackClassName="text-[10px]"
                onClick={() => {
                    closePostComment();
                    router.push(`/users/${comment.user.id}`);
                }}
            />

            <div className="min-w-0 flex-1">
                <div className="flex items-center">
                    <div className="relative rounded-2xl px-3 py-2 bg-muted/50">
                        <div className="pr-6">
                            <span
                                onClick={() => {
                                    closePostComment();
                                    router.push(`/users/${comment.user.id}`);
                                }}
                                className="mb-0.5 block text-sm font-bold cursor-pointer hover:underline text-foreground"
                            >
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
                                                handleEditComment(editText);
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
                                        onClick={() => handleEditComment(editText)}
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
                                    {optimisticReplyCount === 0 && (
                                        <DropdownMenuItem
                                            onClick={handleDeleteComment}
                                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                        >
                                            {isDeletingComment
                                                ? 'Đang xóa...'
                                                : 'Xóa'}
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                <div className="mt-1 flex items-center gap-4 ml-3">
                    <button
                        onClick={handleLikeComment}
                        className={cn(
                            'flex items-center gap-1.5 text-xs font-medium transition-colors hover:bg-transparent',
                                    optimisticIsLiked
                                        ? 'text-destructive'
                                        : 'text-muted-foreground hover:text-destructive'
                        )}
                    >
                        <Heart
                            size={12}
                            className={optimisticIsLiked ? 'fill-current' : ''}
                        />
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
                        <div className="mb-2 mt-2 space-y-3 border-l-2 border-border pl-3 ml-2">
                            {depth < 3 && (
                                <ListComments
                                    targetId={targetId}
                                    isCommentOpen
                                    parentId={effectiveParentId}
                                    targetType={targetType}
                                    depth={depth + 1}
                                    onReplyAdded={() => {
                                        if (hasReplyCount) {
                                            setOptimisticReplyCount((prev) => prev + 1);
                                        }
                                    }}
                                    onReplyRemoved={() => {
                                        if (hasReplyCount) {
                                            setOptimisticReplyCount((prev) => Math.max(0, prev - 1));
                                        }
                                    }}
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
                                                handleSubmitReply(replyText);
                                            }
                                        }}
                                        className="h-9 flex-1 text-sm"
                                        autoFocus
                                    />

                                    <Button
                                        disabled={
                                            isPostingReply || !replyText.trim()
                                        }
                                        onClick={() => handleSubmitReply(replyText)}
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
});

export default CommentItemCard;
