'use client';

import React, { useEffect, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import ListComments from './ListComments';

import {
    type CommentItem as CommentItemType,
    useLazyGetResolveParentQuery,
    usePostCreateMutation,
} from '@/src/features/comments/api/commentApi';

import {
    Heart,
    MessageCircle,
    CornerDownRight,
    Loader2,
    MoreVertical,
} from 'lucide-react';

import {
    useGetCountQuery,
    useGetStatusQuery,
    usePostToggleLikeMutation,
} from '@/src/features/likes/api/likeApi';

interface CommentItemProps {
    comment: CommentItemType;
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

    const [postToggleLike] = usePostToggleLikeMutation();
    const [createComment, { isLoading: isPostingReply }] =
        usePostCreateMutation();

    const { data: likeCount } = useGetCountQuery({
        targetId: comment.id,
        targetType: 'comment',
    });

    const { data: likeStatus } = useGetStatusQuery({
        targetId: comment.id,
        targetType: 'comment',
    });

    const [
        triggerResolveParent,
        { data: resolvedData, isLoading: isResolvingParent },
    ] = useLazyGetResolveParentQuery();

    const handleShowReplies = () => setShowReplies(true);

    const handleReplyClick = () => {
        setShowReplies(true);
        setIsReplying((prev) => !prev);
    };

    useEffect(() => {
        if (!showReplies) return;

        if (!resolvedData) {
            triggerResolveParent({
                targetId,
                parentId: comment.id,
                targetType,
            });
        }
    }, [
        showReplies,
        triggerResolveParent,
        targetId,
        comment.id,
        resolvedData,
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
        } catch (e) {
            console.error('Create reply failed:', e);
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
        <div className="flex items-start gap-3 w-full group animate-in fade-in duration-300">
            {/* Avatar */}
            <img
                src={comment.userId?.image || '/user.png'}
                alt={comment.userId?.username}
                className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-white/10 shrink-0 mt-1"
            />

            <div className="flex-1 min-w-0">
                {/* Comment bubble + menu */}
                <div className="flex items-center">
                    <div className="relative rounded-2xl px-3 py-2 bg-gray-100 dark:bg-zinc-800">
                        <div className="pr-6">
                            <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-gray-900 dark:text-neutral-100">
                  {comment.userId?.username}
                </span>
                            </div>

                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900 dark:text-neutral-200">
                                {comment.content}
                            </p>
                        </div>
                    </div>

                    {/* Dropdown menu */}
                    <div className="relative ml-1">
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <button
                                    type="button"
                                    aria-label="Mở menu bình luận"
                                    className="
                    p-1 rounded-full transition-opacity
                    hover:bg-black/5 dark:hover:bg-white/10
                    opacity-100 md:opacity-0 md:group-hover:opacity-100
                    focus:opacity-100 data-[state=open]:opacity-100
                  "
                                >
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
                                    style={{ zIndex: 99999 }}
                                    className="
                    z-[99999] w-44 rounded-xl border shadow-lg text-sm
                    bg-white dark:bg-neutral-900
                    border-gray-200 dark:border-white/10
                    text-gray-800 dark:text-neutral-100
                  "
                                >
                                    <DropdownMenu.Arrow className="w-3 h-3 rotate-45 -mt-1 fill-white dark:fill-neutral-900" />

                                    <DropdownMenu.Item
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            console.log('Edit comment:', comment.id);
                                        }}
                                        className="cursor-pointer px-3 py-2 rounded-t-xl outline-none hover:bg-black/5 dark:hover:bg-white/10"
                                    >
                                        Chỉnh sửa
                                    </DropdownMenu.Item>

                                    <DropdownMenu.Item
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            console.log('Delete comment:', comment.id);
                                        }}
                                        className="cursor-pointer px-3 py-2 rounded-b-xl outline-none hover:bg-black/5 dark:hover:bg-white/10"
                                    >
                                        Xóa
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-1 ml-3">
                    <button
                        onClick={handleLikeComment}
                        className={`
              flex items-center gap-1.5 text-xs font-medium transition-colors
              ${
                            likeStatus?.isLiked
                                ? 'text-red-500'
                                : 'text-gray-500 dark:text-neutral-500 hover:text-red-500'
                        }
            `}
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
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <MessageCircle size={12} />
                        Trả lời
                    </button>
                </div>

                {/* Replies */}
                <div className="mt-2">
                    {!showReplies && comment.repliesCount > 0 && (
                        <button className="flex items-center gap-2 text-xs font-semibold mt-2 ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                            <div className="w-6 h-[1px] bg-gray-300 dark:bg-white/20" />
                            Xem {comment.repliesCount} phản hồi
                        </button>
                    )}

                    {showReplies && (
                        <div className="ml-2 pl-3 border-l-2 border-gray-200 dark:border-white/10 space-y-3 mt-2 mb-2">
                            {isResolvingParent && !resolvedData && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-500 px-2">
                                    <Loader2 size={12} className="animate-spin" />
                                    Đang tải phản hồi...
                                </div>
                            )}

                            {resolvedData && level !== 3 && (
                                <ListComments
                                    targetId={targetId}
                                    isCommentOpen={true}
                                    parentId={effectiveParentId}
                                    targetType={targetType}
                                />
                            )}

                            {isReplying && (
                                <div className="mt-2 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                                    <input
                                        type="text"
                                        placeholder={`Trả lời ${comment.userId?.username}...`}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmitReply();
                                            }
                                        }}
                                        className="
                      flex-1 rounded-xl px-3 py-2 text-sm
                      bg-white dark:bg-neutral-900
                      border border-gray-300 dark:border-white/10
                      text-gray-900 dark:text-neutral-200
                      focus:outline-none focus:ring-1 focus:ring-blue-500/50
                    "
                                        autoFocus
                                    />

                                    <button
                                        type="button"
                                        disabled={isPostingReply || !replyText.trim()}
                                        onClick={handleSubmitReply}
                                        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isPostingReply ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <CornerDownRight size={16} />
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
