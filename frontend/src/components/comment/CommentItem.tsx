'use client';

import React, {useEffect, useState} from 'react';
import {useAppAuth} from '@/src/hooks/useAppAuth';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
    Heart,
    MessageCircle,
    CornerDownRight,
    Loader2,
    MoreVertical,
} from 'lucide-react';

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

import {CommentItem} from '@/src/features/comments/types/comment.interface';
import {toast} from "sonner";

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

    const {isAuthenticated} = useAppAuth();

    const {user} = useAppAuth();
    const isOwner = comment.userId?.id === user?.id;

    const [editComment, {isLoading: isEditingComment}] =
        useEditCommentMutation();
    const [deleteComment, {isLoading: isDeletingComment}] =
        useDeleteCommentMutation();

    const [postToggleLike] = usePostToggleLikeMutation();
    const [createComment, {isLoading: isPostingReply}] =
        usePostCreateMutation();

    const {data: replyCount, isLoading} = useGetReplyCountByParentQuery({
        parentId: comment.id,
    });

    const {data: likeCount} = useGetCountQuery({
        targetId: comment.id,
        targetType: 'comment',
    });

    const {data: likeStatus} = useGetStatusQuery({
        targetId: comment.id,
        targetType: 'comment',

    }, {
        skip: !isAuthenticated,
    });

    const [
        triggerResolveParent,
        {data: resolvedData, isLoading: isResolvingParent},
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
        } catch (e) {
            console.log('Edit comment failed:', e);
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
                            toast.error('Xóa bình luận thất bại');
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
            const errorMessage =
                e?.data?.message || 'Có lỗi xảy ra khi gửi bình luận.';
            toast.error(errorMessage);
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
            <img
                src={comment.userId?.image || '/user.png'}
                alt={comment.userId?.username}
                className="mt-1 h-8 w-8 shrink-0 rounded-full border border-gray-200 object-cover dark:border-white/10"
            />

            <div className="min-w-0 flex-1">
                {/* Comment bubble + menu */}
                <div className="flex items-center">
                    <div className="relative rounded-2xl bg-gray-100 px-3 py-2 dark:bg-zinc-800">
                        <div className="pr-6">
              <span className="mb-0.5 block text-sm font-bold text-gray-900 dark:text-neutral-100">
                {comment.userId?.username}
              </span>

                            {isEditing ? (
                                <div className="flex items-start gap-2">
                                    <input
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
                                        className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500/50 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200"
                                        autoFocus
                                    />

                                    <button
                                        disabled={isEditingComment}
                                        onClick={handleEditComment}
                                        className="p-1 text-blue-600 hover:text-blue-500"
                                    >
                                        <CornerDownRight size={14}/>
                                    </button>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-neutral-200">
                                    {comment.content}
                                </p>
                            )}
                        </div>
                    </div>

                    {isOwner && (
                        <div className="relative ml-1">
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                    <button
                                        className="rounded-full p-1 opacity-100 transition-opacity hover:bg-black/5 focus:opacity-100 data-[state=open]:opacity-100 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-white/10">
                                        <MoreVertical
                                            size={16}
                                            className="text-gray-500 dark:text-neutral-400"
                                        />
                                    </button>
                                </DropdownMenu.Trigger>

                                <DropdownMenu.Portal>
                                    <DropdownMenu.Content
                                        side="bottom"
                                        align="start"
                                        sideOffset={8}
                                        className="z-[99999] w-44 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 shadow-lg dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100"
                                    >
                                        <DropdownMenu.Arrow
                                            className="h-3 w-3 -mt-1 rotate-45 fill-white dark:fill-neutral-900"/>

                                        <DropdownMenu.Item
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                setIsEditing(true);
                                                setEditText(comment.content);
                                            }}
                                            className="cursor-pointer rounded-t-xl px-3 py-2 outline-none hover:bg-black/5 dark:hover:bg-white/10"
                                        >
                                            Chỉnh sửa
                                        </DropdownMenu.Item>

                                        <DropdownMenu.Item
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                handleDeleteComment();
                                            }}
                                            className="cursor-pointer rounded-b-xl px-3 py-2 outline-none hover:bg-black/5 dark:hover:bg-white/10"
                                        >
                                            {isDeletingComment ? 'Đang xóa...' : 'Xóa'}
                                        </DropdownMenu.Item>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="ml-3 mt-1 flex items-center gap-4">
                    <button
                        onClick={handleLikeComment}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                            likeStatus?.isLiked
                                ? 'text-red-500'
                                : 'text-gray-500 hover:text-red-500 dark:text-neutral-500'
                        }`}
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
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-neutral-500 dark:hover:text-white"
                    >
                        <MessageCircle size={12}/>
                        Trả lời ({replyCount?.count})
                    </button>
                </div>

                {/* Replies */}
                <div className="mt-2">
                    {showReplies && (
                        <div className="ml-2 mt-2 mb-2 space-y-3 border-l-2 border-gray-200 pl-3 dark:border-white/10">
                            {isResolvingParent && !resolvedData && (
                                <div
                                    className="flex items-center gap-2 px-2 text-xs text-gray-500 dark:text-neutral-500">
                                    <Loader2 size={12} className="animate-spin"/>
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
                                    <input
                                        placeholder={`Trả lời ${comment.userId?.username}...`}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmitReply();
                                            }
                                        }}
                                        className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500/50 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200"
                                        autoFocus
                                    />

                                    <button
                                        disabled={isPostingReply || !replyText.trim()}
                                        onClick={handleSubmitReply}
                                        className="rounded-xl bg-blue-600 p-2 text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isPostingReply ? (
                                            <Loader2 size={16} className="animate-spin"/>
                                        ) : (
                                            <CornerDownRight size={16}/>
                                        )}
                                    </button>
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
