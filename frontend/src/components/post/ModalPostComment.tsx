'use client';

import React, { Fragment, useState, useLayoutEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Heart, MessageCircle, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { Post } from '@/src/features/posts/types/post.interface';
import ListComments from '@/src/components/comment/ListComments';
import { usePostCreateMutation } from '@/src/features/comments/api/commentApi';
import SharePostModal from './SharePostModal';
import { useTheme } from 'next-themes';

interface ModalPostCommentProps {
  post: Post;
  isCommentOpen: boolean;
  closeCommentModal: () => void;
  handleLike: () => void;
  commentCount: number | undefined;
  likeStatus: boolean | undefined;
  likeCount: number | undefined;
}

const ModalPostComment: React.FC<ModalPostCommentProps> = (props) => {
  const { post, isCommentOpen, closeCommentModal } = props;

  const { theme } = useTheme();
  const [commentText, setCommentText] = useState('');
  const [createComment, { isLoading: isPosting }] = usePostCreateMutation();
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [showShare, setShowShare] = useState(false);

  const onSubmitComment = async () => {
    const content = commentText.trim();
    if (!content) return;

    try {
      await createComment({
        targetType: 'post',
        targetId: post.id,
        content,
        parentId: null,
      }).unwrap();

      setCommentText('');
      toast.success('Bình luận đã được gửi!');
      commentInputRef.current?.focus();
    } catch (e: any) {
      console.error('Create comment failed:', e);
      const errorMessage =
        e?.data?.message || 'Có lỗi xảy ra khi gửi bình luận.';
      toast.error(errorMessage);
    }
  };

  useLayoutEffect(() => {
    if (!isCommentOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isCommentOpen]);

  const rightColRef = useRef<HTMLDivElement>(null);

  return (
    <Transition appear show={isCommentOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[9999]"
        onClose={closeCommentModal}
      >
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/15 dark:bg-black/40 backdrop-blur-[2px]" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className="
                  bg-white dark:bg-[#1a1a1a]
                  w-[min(96vw,1000px)]
                  h-[82vh]
                  rounded-3xl
                  overflow-hidden
                  shadow-2xl
                  border border-slate-100 dark:border-gray-700
                  flex
                  relative
                "
              >
                <SharePostModal
                  isOpen={showShare}
                  onClose={() => setShowShare(false)}
                  postUrl={`${window.location.origin}/posts/${post.id}`}
                  shareTitle={
                    post.content?.slice(0, 100) || 'Xem bài viết này'
                  }
                  shareMedia={
                    post.imageUrls?.[0] || '/abstract-book-pattern.png'
                  }
                />

                {/* Nút đóng */}
                <button
                  onClick={closeCommentModal}
                  className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-gray-300 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

                {/* Trái: ảnh lớn */}
                <div className="hidden md:flex md:w-1/2 bg-slate-900/90 dark:bg-gray-900 items-center justify-center">
                  {post?.imageUrls?.[0] ? (
                    <img
                      src={post.imageUrls[0]}
                      alt="Post"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-slate-300 dark:text-gray-500 text-sm">
                      Không có ảnh
                    </div>
                  )}
                </div>

                {/* Phải: cột bình luận */}
                <div
                  ref={rightColRef}
                  className="w-full md:w-1/2 flex flex-col bg-white dark:bg-[#1a1a1a]"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] sticky top-0 z-10">
                    <img
                      src={post.userId?.image}
                      alt=""
                      className="w-9 h-9 rounded-full border border-slate-200 dark:border-gray-700 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <Dialog.Title className="text-sm font-semibold text-slate-900 dark:text-gray-100 truncate">
                        {post.userId?.username}
                      </Dialog.Title>
                      <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                        {post.bookId?.title}
                      </p>
                    </div>
                  </div>

                  {/* Nội dung */}
                  <div className="px-4 py-3 text-sm text-slate-800 dark:text-gray-300 border-b border-slate-100 dark:border-gray-800">
                    {post.content}
                  </div>

                  {/* Danh sách comment */}
                  <div
                    data-modal-body
                    className="flex-1 overflow-y-auto thin-scrollbar px-4 py-3 dark:bg-[#1a1a1a]"
                  >
                    <ListComments
                      targetId={post.id}
                      isCommentOpen={isCommentOpen}
                      parentId={null}
                      targetType={'post'}
                      theme={theme as 'light' | 'dark' | undefined}
                    />
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2 border-t border-slate-100 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] sticky bottom-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div>
                        <button
                          onClick={props.handleLike}
                          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition"
                        >
                          <Heart
                            size={20}
                            className={`transition-transform duration-150 group-hover:scale-110 ${props.likeStatus
                                ? 'fill-rose-500 text-rose-500'
                                : 'text-slate-700 dark:text-gray-300'
                              }`}
                          />
                        </button>
                        <button
                          onClick={() => commentInputRef.current?.focus()}
                          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition"
                        >
                          <MessageCircle
                            size={19}
                            className="text-slate-700 dark:text-gray-300 hover:scale-110 transition-transform"
                          />
                        </button>
                        <button
                          onClick={() => setShowShare(true)}
                          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 transition"
                        >
                          <Send
                            size={19}
                            className="text-slate-700 dark:text-gray-300 hover:scale-110 transition-transform"
                          />
                        </button>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-gray-400">
                          {props.likeCount ?? 0} lượt thích •{' '}
                          {props.commentCount ?? 0} bình luận
                        </p>
                      </div>
                    </div>

                    {/* Ô nhập bình luận */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        ref={commentInputRef}
                        placeholder="Thêm bình luận..."
                        className="flex-1 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-gray-200 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <button
                        disabled={isPosting || !commentText.trim()}
                        onClick={onSubmitComment}
                        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {isPosting ? 'Đang đăng...' : 'Đăng'}
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalPostComment;
