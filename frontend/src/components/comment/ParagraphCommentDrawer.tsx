'use client';

import { X, Send, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAppAuth } from '@/src/hooks/useAppAuth';

import ListComments from '@/src/components/comment/ListComments';
import { usePostCreateMutation } from '@/src/features/comments/api/commentApi';

interface ParagraphCommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  paragraphId: string | null;
  paragraphContent?: string;
  hasHeader?: boolean;
}

export default function ParagraphCommentDrawer({
  isOpen,
  onClose,
  paragraphId,
  paragraphContent,
  hasHeader = false,
}: ParagraphCommentDrawerProps) {
  const [commentText, setCommentText] = useState('');
  const [mounted, setMounted] = useState(false);

  const [createComment, { isLoading }] = usePostCreateMutation();

  const { isAuthenticated } = useAppAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async () => {
    if (!paragraphId || !commentText.trim()) return;

    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để bình luận', {
        action: { label: 'Đăng nhập', onClick: () => router.push('/login') },
      });
      return;
    }

    try {
      await createComment({
        targetType: 'paragraph',
        targetId: paragraphId,
        content: commentText.trim(),
        parentId: null,
      }).unwrap();

      setCommentText('');
      toast.success('Bình luận đã được gửi!');
    } catch (e: any) {
      if (e?.status !== 401) {
        toast.error(e?.data?.message || 'Không thể gửi bình luận');
      }
    }
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed ${hasHeader ? 'top-15' : 'top-0'} right-0 bottom-0
          w-[400px] max-w-[90vw]
          bg-white dark:bg-[#1a1a1a]
          border-l border-gray-300 dark:border-white/10
          z-[61] shadow-2xl
          transform transition-all duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="relative p-5 border-b border-gray-200 dark:border-white/5">
          {/* Close button */}
          <button
            onClick={onClose}
            className="
                                      absolute top-4 right-4
                                      p-2 rounded-full transition-colors
                                      text-gray-600 hover:text-gray-900 hover:bg-gray-100
                                      dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10
                                    "
          >
            <X size={20} />
          </button>

          {/* Title */}
          <h3 className="font-bold text-lg text-gray-900 dark:text-white pr-10">
            Thảo luận
          </h3>

          {/* Paragraph content – FULL WIDTH */}
          {paragraphContent && (
            <p className="mt-2 text-[15px] text-gray-500 dark:text-gray-400 text-justify">
              {paragraphContent}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Input */}
          <div className="p-4 border-b border-gray-200 dark:border-white/5">
            <div className="flex items-start gap-3">
              {/* Textarea */}
              <div className="relative flex-1">
                <textarea
                  placeholder="Viết suy nghĩ của bạn..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="
                    w-full
                    resize-none
                    min-h-[44px]
                    max-h-[120px]
                    rounded-2xl
                    px-4 py-3 pr-12
                    text-sm
                    bg-white dark:bg-[#1a1a1a]
                    border border-gray-300 dark:border-white/15
                    text-gray-900 dark:text-white
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                    focus:outline-none
                    focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30
                    transition-all
                  "
                />

                {commentText.length > 0 && (
                  <span className="absolute right-3 bottom-2 text-[11px] text-gray-500 dark:text-gray-400">
                    {commentText.length}
                  </span>
                )}
              </div>

              {/* Send button */}
              <button
                disabled={isLoading || !commentText.trim()}
                onClick={handleSubmit}
                className={`
                  h-[44px] w-[44px]
                  flex items-center justify-center
                  rounded-full
                  transition-all duration-200
                  ${
                    isLoading || !commentText.trim()
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white shadow-md hover:shadow-lg active:scale-95'
                  }
                `}
                aria-label="Gửi bình luận"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto p-4">
            {paragraphId && (
              <ListComments
                targetId={paragraphId}
                parentId={null}
                targetType="paragraph"
                isCommentOpen={true}
                theme="dark"
              />
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
