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
  theme?: 'light' | 'dark';
}

const CommentItemCard: React.FC<CommentItemProps> = (props) => {
  const { comment, targetId, targetType, theme = 'light' } = props;

  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  // Có thể giữ state này nếu sau bạn cần, không ảnh hưởng Radix
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [postToggleLike] = usePostToggleLikeMutation();
  const [createComment, { isLoading: isPostingReply }] = usePostCreateMutation();

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

  const isDark = theme === 'dark';

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
  }, [showReplies, triggerResolveParent, targetId, comment.id, resolvedData, targetType]);

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

  // Styles
  const textPrimary = isDark ? 'text-neutral-200' : 'text-gray-900';
  const textSecondary = isDark ? 'text-neutral-500' : 'text-gray-500';
  const bgBubble = isDark ? 'bg-zinc-800' : 'bg-gray-100';
  const inputBg = isDark
      ? 'bg-neutral-900 border-white/10 text-neutral-200'
      : 'bg-white border-gray-300 text-black';
  const borderLeft = isDark ? 'border-white/10' : 'border-gray-200';
  const linkColor = isDark
      ? 'text-blue-400 hover:text-blue-300'
      : 'text-blue-600 hover:text-blue-700';

  return (
      <div className="flex items-start justify-start gap-3 w-full group animate-in fade-in duration-300">
        {/* Avatar */}
        <img
            src={comment.userId?.image || '/user.png'}
            alt={comment.userId?.username}
            className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0 mt-1"
        />

        <div className="flex-1 min-w-0">
          {/* Nội dung comment + nút MoreVertical */}
          <div className="flex items-center">
            {/* Bubble nội dung */}
            <div
                className={`relative rounded-2xl px-3 py-2 ${bgBubble} ${
                    !isDark ? 'inline-block' : ''
                }`}
            >
              <div className="pr-6">
                <div className="flex items-center gap-2 mb-0.5">
                <span
                    className={`text-sm font-bold ${
                        isDark ? 'text-neutral-100' : 'text-black'
                    }`}
                >
                  {comment.userId?.username}
                </span>
                </div>

                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${textPrimary}`}>
                  {comment.content}
                </p>
              </div>
            </div>

            {/* Nút option nằm ngoài bubble, dùng Radix DropdownMenu */}
            <div className="relative ml-1">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                      type="button"
                      aria-label="Mở menu bình luận"
                      className={`
      p-1 rounded-full transition-opacity
      hover:bg-black/5 dark:hover:bg-white/10
      opacity-100                     /* luôn thấy trên mobile */
      md:opacity-0                    /* ẩn trên desktop khi không hover */
      md:group-hover:opacity-100      /* hiện khi hover dòng */
      focus:opacity-100               /* hiện khi focus */
      data-[state=open]:opacity-100   /* <-- giữ hiện khi menu đang mở */
    `}
                  >
                    <MoreVertical
                        size={16}
                        className={isDark ? 'text-neutral-400' : 'text-gray-500'}
                    />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                      side="bottom"
                      align="start"
                      sideOffset={8}
                      style={{ zIndex: 99999 }} // giữ z-index cao để không bị che
                      className={`
      z-[99999] w-44 rounded-xl border shadow-lg text-sm
      ${isDark
                          ? 'bg-neutral-900 border-white/10 text-neutral-100'
                          : 'bg-white border-gray-200 text-gray-800'}
    `}
                  >
                    <DropdownMenu.Arrow
                        className={`
        w-3 h-3 rotate-45 -mt-1
        ${isDark
                            ? 'fill-neutral-900 stroke-white/10'
                            : 'fill-white stroke-gray-200'}
      `}
                    />

                    <DropdownMenu.Item
                        onSelect={(e) => {
                          e.preventDefault();
                          console.log('Edit comment: ', comment.id);
                        }}
                        className={`
        cursor-pointer px-3 py-2 rounded-t-xl outline-none
        hover:bg-black/5 dark:hover:bg-white/10
      `}
                    >
                      Chỉnh sửa
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                        onSelect={(e) => {
                          e.preventDefault();
                          console.log('Delete comment: ', comment.id);
                        }}
                        className={`
        cursor-pointer px-3 py-2 rounded-b-xl outline-none
        hover:bg-black/5 dark:hover:bg-white/10
      `}
                    >
                      Xóa
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>

          {/* Action Buttons (Like, Reply) */}
          <div className="flex items-center gap-4 mt-1 ml-3">
            <button
                onClick={handleLikeComment}
                className={`
              flex items-center gap-1.5 text-xs font-medium transition-colors
              ${likeStatus?.isLiked ? 'text-red-500' : `${textSecondary} hover:text-red-500`}
            `}
            >
              <Heart size={12} className={comment.isLiked ? 'fill-current' : ''} />
              {(likeCount?.count ?? 0) > 0 && <span>{likeCount?.count}</span>}
              <span className="hidden sm:inline">Thích</span>
            </button>

            <button
                onClick={handleReplyClick}
                className={`
              flex items-center gap-1.5 text-xs font-medium ${textSecondary}
              hover:${isDark ? 'text-white' : 'text-black'} transition-colors
            `}
            >
              <MessageCircle size={12} />
              Trả lời
            </button>
          </div>

          {/* REPLIES SECTION */}
          <div className="mt-2">
            {!showReplies && comment.repliesCount > 0 && (
                <button
                    onClick={handleShowReplies}
                    className={`flex items-center gap-2 text-xs font-semibold mt-2 ml-2 ${linkColor}`}
                >
                  <div className={`w-6 h-[1px] ${isDark ? 'bg-white/20' : 'bg-gray-300'}`} />
                  Xem {comment.repliesCount} phản hồi
                </button>
            )}

            {showReplies && (
                <div className={`ml-2 pl-3 border-l-2 ${borderLeft} space-y-3 mt-2 mb-2`}>
                  {isResolvingParent && !resolvedData && (
                      <div className="flex items-center gap-2 text-xs text-neutral-500 px-2">
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
                          theme={theme}
                      />
                  )}

                  {isReplying && (
                      <div className="mt-2 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                        <div className="relative flex-1">
                          <input
                              type="text"
                              placeholder={`Trả lời ${comment.userId?.username}...`}
                              className={`
                        w-full rounded-xl px-3 py-2 text-sm
                        focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all
                        ${inputBg}
                      `}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSubmitReply();
                                }
                              }}
                          />
                        </div>

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
