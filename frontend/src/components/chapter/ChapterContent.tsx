'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import ListComments from '@/src/components/comment/ListComments';
import { usePostCreateMutation } from '@/src/features/comments/api/commentApi';
import { useCreatePostMutation } from '@/src/features/posts/api/postApi';
import CreatePostModal, {
  CreatePostData,
} from '@/src/components/post/CreatePostModal';
import { useSession } from 'next-auth/react';
import { MessageSquarePlus, Share2, Send, X, Loader2 } from 'lucide-react';

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

  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(
    null
  );
  const [commentText, setCommentText] = useState('');
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [selectedParagraph, setSelectedParagraph] = useState<Paragraph | null>(
    null
  );

  const [createComment, { isLoading: isPostingComment }] =
    usePostCreateMutation();
  const [createPost, { isLoading: isCreatingPost }] = useCreatePostMutation();

  const handleToggleComments = (paragraphId: string) => {
    setActiveParagraphId((prev) => (prev === paragraphId ? null : paragraphId));
    setCommentText('');
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
    } catch (_e) {
      toast.error('Không thể gửi bình luận');
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
      <main className="flex-1 w-full text-neutral-300 antialiased relative">
        <article className="space-y-8">
          {paragraphs.map((para) => (
            <div key={para.id} className="relative group">
              <div className="relative">
                <p
                  className={`text-lg sm:text-xl leading-8 sm:leading-9 text-justify transition-colors duration-300 ${
                    activeParagraphId === para.id
                      ? 'text-blue-100'
                      : 'text-neutral-300'
                  }`}
                >
                  {para.content}
                </p>

                <div
                  className={`
                    flex items-center gap-1 transition-all duration-300
                    
                    /* Mobile layout: Nằm dưới, hiện khi active hoặc group-hover */
                    mt-2 justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100

                    /* Desktop layout: Trôi nổi bên phải */
                    md:absolute md:top-0 md:-right-4 md:translate-x-full md:mt-0 md:flex-col md:justify-start md:pl-2
                  `}
                >
                  <button
                    onClick={() => handleToggleComments(para.id)}
                    className={`p-2 rounded-full transition-all ${
                      activeParagraphId === para.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-110'
                        : 'bg-neutral-800/50 text-neutral-400 hover:bg-blue-600 hover:text-white hover:scale-110'
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

              {activeParagraphId === para.id && (
                <div className="mt-6 md:ml-8 relative z-20 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-transparent opacity-50 hidden md:block" />

                  <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

                    <div className="flex justify-between items-start mb-4">
                      <label className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Thảo luận
                      </label>
                      <button
                        onClick={() => setActiveParagraphId(null)}
                        className="text-neutral-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <textarea
                          placeholder="Viết suy nghĩ của bạn về đoạn này..."
                          className="w-full bg-neutral-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none placeholder:text-neutral-600 min-h-[80px]"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmitComment(para.id);
                            }
                          }}
                        />
                        <div className="absolute bottom-2 right-2">
                          <button
                            type="button"
                            disabled={isPostingComment || !commentText.trim()}
                            onClick={() => handleSubmitComment(para.id)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-0 disabled:pointer-events-none transition-all shadow-lg"
                          >
                            {isPostingComment ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Send size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-500 pl-1">
                        Shift + Enter để xuống dòng
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5">
                      <ListComments
                        targetId={para.id}
                        isCommentOpen={true}
                        parentId={null}
                        targetType={'paragraph'}
                        theme="dark"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </article>
      </main>

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
