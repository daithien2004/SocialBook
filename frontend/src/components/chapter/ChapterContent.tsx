'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useReadingSettings } from '@/src/store/useReadingSettings';
import ListComments from '@/src/components/comment/ListComments';
import { usePostCreateMutation } from '@/src/features/comments/api/commentApi';
import { useCreatePostMutation } from '@/src/features/posts/api/postApi';
import CreatePostModal, {
  CreatePostData,
} from '@/src/components/post/CreatePostModal';
import { useSession } from 'next-auth/react';
import { MessageSquarePlus, Share2, Send, X, Loader2 } from 'lucide-react';
import ParagraphCommentDrawer from '../comment/ParagraphCommentDrawer';

interface Paragraph {
  id: string;
  content: string;
}

interface ChapterContentProps {
  paragraphs: Paragraph[];
  chapterId: string;
  bookId: string;
  bookCoverImage?: string;
  bookTitle?: string;
}

export function ChapterContent({
  paragraphs,
  bookId,
  bookTitle,
}: ChapterContentProps) {
  const { data: session } = useSession();
  const { settings } = useReadingSettings();

  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(
    null
  );
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [activeParagraph, setActiveParagraph] = useState<Paragraph | null>(null);
  const [commentText, setCommentText] = useState('');
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [selectedParagraph, setSelectedParagraph] = useState<Paragraph | null>(
    null
  );

  const [createComment, { isLoading: isPostingComment }] =
    usePostCreateMutation();
  const [createPost, { isLoading: isCreatingPost }] = useCreatePostMutation();

  const handleToggleComments = (paragraph: Paragraph) => {
    setActiveParagraphId(paragraph.id);
    setActiveParagraph(paragraph);
    setCommentDrawerOpen(true);
  };


  const handleSubmitComment = async (paragraphId: string) => {
    const content = commentText.trim();
    if (!content) return;

    try {
      await createComment({
        targetType: 'paragraph',
        targetId: paragraphId,
        content,
        parentId: null,
      }).unwrap();

      setCommentText('');
      toast.success('Bình luận đã được gửi!');
    } catch (e: any) {
      // Display the error message from backend
      const errorMessage = e?.data?.message || 'Có lỗi xảy ra khi gửi bình luận.';
      toast.error(errorMessage);
    }
  };

  const handleOpenPostModal = (paragraph: Paragraph) => {
    setSelectedParagraph(paragraph);
    setPostModalOpen(true);
  };

  const handleSubmitPost = async (data: CreatePostData) => {
    if (!bookId) {
      toast.error('Không tìm thấy thông tin sách');
      return;
    }
    try {
      await createPost({
        bookId: bookId,
        content: data.content,
        images: data.images,
      }).unwrap();
      toast.success('Chia sẻ thành công!');
      setPostModalOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Không thể tạo bài viết');
    }
  };

  return (
    <>
      <main
        className="flex-1 w-full antialiased relative transition-all duration-300 rounded-2xl p-10"
        style={{
          backgroundColor: settings.backgroundColor,
          color: settings.textColor,
          paddingLeft: `${settings.marginWidth + 34}px`,
          paddingRight: `${settings.marginWidth}px`,
        }}
      >
        <article className="space-y-2">
          {paragraphs.map((para) => (
              <div key={para.id} className="group">
                <div className="flex items-start gap-3">
                  <p
                      className={`flex-1 transition-colors duration-300 ${
                          activeParagraphId === para.id
                              ? 'text-slate-700 dark:text-indigo-700'
                              : ''
                      }`}
                      style={{
                        fontSize: `${settings.fontSize}px`,
                        fontFamily: settings.fontFamily,
                        lineHeight: settings.lineHeight,
                        letterSpacing: `${settings.letterSpacing}px`,
                        textAlign: settings.textAlign as any,
                        color:
                            activeParagraphId === para.id
                                ? undefined
                                : settings.textColor,
                      }}
                  >
                    {para.content}
                  </p>

                  {/* Buttons */}
                  <div
                      className="
                      flex flex-col gap-2 shrink-0
                      opacity-0 pointer-events-none
                      group-hover:opacity-100 group-hover:pointer-events-auto
                      transition
                    "
                  >
                    <button
                        onClick={() => handleToggleComments(para)}
                        className={`p-2 rounded-full transition-all ${
                            activeParagraphId === para.id
                                ? 'bg-indigo-600 text-white scale-110'
                                : 'bg-neutral-200 text-neutral-600 hover:bg-indigo-600 hover:text-white dark:bg-neutral-800/50 dark:text-neutral-400 dark:hover:bg-indigo-500 hover:scale-110'
                        }`}
                        title="Bình luận đoạn này"
                    >
                      <MessageSquarePlus size={18} />
                    </button>

                    <button
                        onClick={() => handleOpenPostModal(para)}
                        className="p-2 rounded-full bg-neutral-800/50 text-neutral-400 hover:bg-green-600 hover:text-white hover:scale-110 transition-all"
                        title="Chia sẻ đoạn này"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
          ))}
        </article>
      </main>

      <ParagraphCommentDrawer
          isOpen={commentDrawerOpen}
          onClose={() => {
            setCommentDrawerOpen(false);
            setActiveParagraphId(null);
            setActiveParagraph(null);
          }}
          paragraphId={activeParagraph?.id || null}
          paragraphContent={activeParagraph?.content}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isSubmitting={isCreatingPost}
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onSubmit={handleSubmitPost}
        defaultContent={selectedParagraph?.content || ''}
        title={`Chia sẻ trích dẫn${bookTitle ? ` từ "${bookTitle}"` : ''}`}
        contentLabel="Nội dung trích dẫn"
        maxImages={10}
      />
    </>
  );
}
