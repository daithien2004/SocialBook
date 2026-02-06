'use client';

import { useAppAuth } from '@/src/hooks/useAppAuth';
import {
    CornerDownRight,
    Heart,
    Loader2,
    MessageCircle,
    MoreVertical,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import ListComments from './ListComments';

import {
    useDeleteCommentMutation,
    useEditCommentMutation, useGetReplyCountByParentQuery,
    useLazyGetResolveParentQuery,
    usePostCreateMutation,
} from '@/src/features/comments/api/commentApi';

import {
    useGetCountQuery,
    useGetStatusQuery,
    usePostToggleLikeMutation,
} from '@/src/features/likes/api/likeApi';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { Input } from '@/src/components/ui/input';
import { CommentItem } from '@/src/features/comments/types/comment.interface';
import { getErrorMessage } from '@/src/lib/utils';
import { toast } from "sonner";

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
    const [showReplies, setShowReplies] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);

    const { isAuthenticated } = useAppAuth();

    const { user } = useAppAuth();
    const isOwner = comment.userId?.id === user?.id;

    const [editComment, { isLoading: isEditingComment }] =
        useEditCommentMutation();
    const [deleteComment, { isLoading: isDeletingComment }] =
        useDeleteCommentMutation();

    const [postToggleLike] = usePostToggleLikeMutation();
    const [createComment, { isLoading: isPostingReply }] =
        usePostCreateMutation();

    const { data: replyCount, isLoading } = useGetReplyCountByParentQuery({
        parentId: comment.id,
    });

    const { data: likeCount } = useGetCountQuery({
        targetId: comment.id,
        targetType: 'comment',
    });

    const { data: likeStatus } = useGetStatusQuery({
        targetId: comment.id,
        targetType: 'comment',
    }, {
        skip: !isAuthenticated,
    });

    const [
        triggerResolveParent,
        { data: resolvedData, isLoading: isResolvingParent },
    ] = useLazyGetResolveParentQuery();

    const handleReplyClick = () => {
        setShowReplies(true);
        setIsReplying((prev) => !prev);
    };

    const handleEditComment = async () => {
        const content = editText.trim();
        if (!content || content === comment.content) {
            setIsEditing(false);
            return;
        }

        try {
            await editComment({
                id: comment.id,
                content,
                targetId,
                parentId: comment.parentId ?? null,
            }).unwrap();
            toast.success('Bình luận đã được chỉnh sửa!');
            setIsEditing(false);
        } catch (e: any) {
            if (e?.status === 400 && e?.data?.message) {
                toast.error(`Sửa thất bại: ${e.data.message}`);
            } else if (e?.status !== 401) {
                toast.error(getErrorMessage(e));
            }
        }
    };

    const handleDeleteComment = () => {
        toast('Bạn có chắc chắn muốn xóa bình luận này?', {
            action: {
                label: 'Xóa',
                onClick: async () => {
                    try {
                        await deleteComment({
                            id: comment.id,
                            targetId,
                            parentId: comment.parentId ?? null,
                        }).unwrap();

                        toast.success('Bình luận đã được xóa!');
                    } catch (e: any) {
                        if (e?.status !== 401) {
                            toast.error(getErrorMessage(e));
                        }
                    }
                },
            },
            cancel: 'Hủy',
        });
    };

    useEffect(() => {
        if (!showReplies || resolvedData) return;

        triggerResolveParent({
            targetId,
            parentId: comment.id,
            targetType,
        });
    }, [
        showReplies,
        resolvedData,
        triggerResolveParent,
        targetId,
        comment.id,
        targetType,
    ]);

    const effectiveParentId = resolvedData?.parentId ?? comment.id;
    const level = resolvedData?.level;

    const handleSubmitReply = async () => {
        const content = replyText.trim();
        if (!content) return;

        try {
            await createComment({
                targetType,
                targetId,
                content,
                parentId: effectiveParentId,
            }).unwrap();

            setReplyText('');
            setShowReplies(true);
            setIsReplying(false);
        } catch (e: any) {
            console.log('Create reply failed:', e);
            toast.error(getErrorMessage(e));
        }
    };

    const handleLikeComment = async () => {
        try {
            await postToggleLike({
                targetId: comment.id,
                targetType: 'comment',
            }).unwrap();
        } catch (e) {
            console.error('Like comment failed:', e);
        }
    };

    return (
        <div className="flex w-full items-start gap-3 group animate-in fade-in duration-300">
            {/* Avatar */}
            <Avatar className="mt-1 h-8 w-8 shrink-0 border border-border">
                <AvatarImage src={comment.userId?.image} alt={comment.userId?.username} />
                <AvatarFallback className="text-[10px] font-bold">
                    {comment.userId?.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
                {/* Comment bubble + menu */}
                <div className="flex items-center">
                    <div className="relative rounded-2xl bg-muted/50 px-3 py-2">
                        <div className="pr-6">
                            <span className="mb-0.5 block text-sm font-bold text-foreground">
                                {comment.userId?.username}
                            </span>

                            {isEditing ? (
                                <div className="flex items-start gap-2">
                                    <Input
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
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
                                        className="h-8 w-8 text-blue-600 hover:text-blue-500 hover:bg-blue-50"
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
                                        className="h-8 w-8 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreVertical size={16} className="text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" side="bottom" className="w-40">
                                    <DropdownMenuItem onClick={() => { setIsEditing(true); setEditText(comment.content); }}>
                                        Chỉnh sửa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDeleteComment} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                        {isDeletingComment ? 'Đang xóa...' : 'Xóa'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="ml-3 mt-1 flex items-center gap-4">
                    <button
                        onClick={handleLikeComment}
                        className={cn(
                            "flex items-center gap-1.5 text-xs font-medium transition-colors hover:bg-transparent",
                            likeStatus?.isLiked
                                ? 'text-red-500'
                                : 'text-muted-foreground hover:text-red-500'
                        )}
                    >
                        <Heart
                            size={12}
                            className={likeStatus?.isLiked ? 'fill-current' : ''}
                        />
                        {(likeCount?.count ?? 0) > 0 && <span>{likeCount?.count}</span>}
                        <span className="hidden sm:inline">Thích</span>
                    </button>

                    <button
                        onClick={handleReplyClick}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-transparent"
                    >
                        <MessageCircle size={12} />
                        Trả lời ({replyCount?.count})
                    </button>
                </div>

                {/* Replies */}
                <div className="mt-2">
                    {showReplies && (
                        <div className="ml-2 mt-2 mb-2 space-y-3 border-l-2 border-border pl-3">
                            {isResolvingParent && !resolvedData && (
                                <div
                                    className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                                    <Loader2 size={12} className="animate-spin" />
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
                                <div className="flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                                    <Input
                                        placeholder={`Trả lời ${comment.userId?.username}...`}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmitReply();
                                            }
                                        }}
                                        className="flex-1 h-9 text-sm"
                                        autoFocus
                                    />

                                    <Button
                                        disabled={isPostingReply || !replyText.trim()}
                                        onClick={handleSubmitReply}
                                        size="icon"
                                        className="h-9 w-9 bg-blue-600 hover:bg-blue-500"
                                    >
                                        {isPostingReply ? (
                                            <Loader2 size={16} className="animate-spin" />
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
