// ModalPostComment.tsx
'use client';

import React, { Fragment, useState, useLayoutEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Heart, MessageCircle, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { Post } from '@/src/features/posts/types/post.interface';
import ListComments from '@/src/components/comment/ListComments';
import { usePostCreateMutation } from '@/src/features/comments/api/commentApi';

interface ModalPostCommentProps {
  post: Post;
  isCommentOpen: boolean;
  closeCommentModal: () => void;
}

const ModalPostComment: React.FC<ModalPostCommentProps> = (props) => {
  const { post, isCommentOpen, closeCommentModal } = props;

  const [commentText, setCommentText] = useState('');
  const [createComment, { isLoading: isPosting }] = usePostCreateMutation();

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
    } catch (e: any) {
      console.error('Create comment failed:', e);
      const errorMessage = e?.data?.message || 'Có lỗi xảy ra khi gửi bình luận.';
      toast.error(errorMessage);
    }
  };

  // (Optional) khoá scroll body khi mở modal – thuần UI, không ảnh hưởng logic
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
        <Dialog as="div" className="relative z-[9999]" onClose={closeCommentModal}>
          {/* Overlay mờ nhẹ, không đen đặc */}
          <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/15 backdrop-blur-[2px]" />
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
                {/* Panel */}
                <Dialog.Panel
                    className="
                      bg-white
                      w-[min(96vw,1000px)]
                      h-[82vh]          /* ⬅️ ép modal cao hơn rõ rệt */
                      rounded-3xl
                      overflow-hidden
                      shadow-2xl
                      border border-slate-100
                      flex
                      relative
                    "
                >
                  {/* Nút đóng */}
                  <button
                      onClick={closeCommentModal}
                      className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                      aria-label="Close"
                  >
                    <X size={18} />
                  </button>

                  {/* Trái: ảnh lớn (ẩn trên mobile) */}
                  <div className="hidden md:flex md:w-1/2 bg-slate-900/90 items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {post?.imageUrls?.[0] ? (
                        <img
                            src={post.imageUrls[0]}
                            alt="Post"
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="text-slate-300 text-sm">Không có ảnh</div>
                    )}
                  </div>

                  {/* Phải: comment column */}
                  <div
                      ref={rightColRef}
                      className="w-full md:w-1/2 flex flex-col"
                  >
                    {/* Header (sticky) */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                          src={post.userId?.image}
                          alt=""
                          className="w-9 h-9 rounded-full border border-slate-200 object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <Dialog.Title className="text-sm font-semibold text-slate-900 truncate">
                          {post.userId?.username}
                        </Dialog.Title>
                        <p className="text-xs text-slate-500 truncate">{post.bookId.title}</p>
                      </div>
                    </div>

                    {/* Nội dung ngắn (snippet) */}
                    <div className="px-4 py-3 text-sm text-slate-800 border-b border-slate-100">
                      {post.content}
                    </div>

                    {/* Danh sách comment (scroll trong cột phải) */}
                    <div
                        data-modal-body
                        className="flex-1 overflow-y-auto thin-scrollbar px-4 py-3"
                    >
                      <ListComments
                          targetId={post.id}
                          isCommentOpen={isCommentOpen}
                          parentId={null}
                          targetType={'post'}
                      />
                    </div>

                    {/* Footer actions (sticky bottom) */}
                    <div className="px-4 py-3 border-t border-slate-100 bg-white sticky bottom-0">
                      <div className="flex items-center gap-4 mb-2">
                        <button className="p-1.5 rounded-full hover:bg-slate-100 transition">
                          <Heart size={20} className="text-slate-700 hover:scale-110 transition-transform" />
                        </button>
                        <button className="p-1.5 rounded-full hover:bg-slate-100 transition">
                          <MessageCircle size={19} className="text-slate-700 hover:scale-110 transition-transform" />
                        </button>
                        <button className="p-1.5 rounded-full hover:bg-slate-100 transition">
                          <Send size={19} className="text-slate-700 hover:scale-110 transition-transform" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-500 mb-2">
                        {post.totalLikes ?? 0} lượt thích • {post.totalComments ?? 0} bình luận
                      </p>

                      <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Thêm bình luận..."
                            className="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                        <button
                            disabled={isPosting || !commentText.trim()}
                            onClick={onSubmitComment}
                            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
