import { useState } from 'react';
import ListComments from '@/src/components/comment/ListComments';
import { usePostCreateMutation } from '@/src/features/comments/api/commentApi';
import { useCreatePostMutation } from '@/src/features/posts/api/postApi';
import CreatePostModal, {
  CreatePostData,
} from '@/src/components/post/CreatePostModal';
import { useSession } from 'next-auth/react';

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

  const [createPost, { isLoading: isCreatingPost }] = useCreatePostMutation(); // ← Thêm hook

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
    } catch (e) {
      console.error('Create comment failed:', e);
    }
  };

  const handleOpenPostModal = (paragraph: Paragraph) => {
    setSelectedParagraph(paragraph);
    setPostModalOpen(true);
  };

  const handleSubmitPost = async (data: CreatePostData) => {
    if (!bookId) {
      alert('Không tìm thấy thông tin sách');
      return;
    }

    try {
      await createPost({
        userId: session?.user.id,
        bookId: bookId,
        content: data.content,
        images: data.images,
      }).unwrap();
    } catch (error: any) {
      throw new Error(error?.data?.message || 'Không thể tạo bài viết');
    }
  };

  return (
    <>
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 bg-white text-gray-800 rounded-t">
        <article className="prose prose-lg max-w-none space-y-6">
          {paragraphs.map((para, idx) => (
            <div key={para.id} className="relative group">
              <div className="flex items-start gap-3">
                <p className="flex-1 text-lg leading-8 text-justify">
                  {para.content}
                </p>

                <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleToggleComments(para.id)}
                    className={`p-2 rounded-lg transition-all ${
                      activeParagraphId === para.id
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'hover:bg-gray-100 text-gray-500 hover:text-indigo-600'
                    }`}
                    title="Bình luận đoạn này"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleOpenPostModal(para)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-green-600 transition-all"
                    title="Đăng bài từ đoạn này"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {activeParagraphId === para.id && (
                <div className="mt-4 ml-4 border-l-2 border-indigo-200 pl-4 animate-slideDown">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Bình luận về đoạn này
                      </label>
                      <div className="flex items-start gap-2">
                        <textarea
                          placeholder="Viết bình luận của bạn..."
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          rows={2}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmitComment(para.id);
                            }
                          }}
                        />
                        <button
                          type="button"
                          disabled={isPostingComment || !commentText.trim()}
                          onClick={() => handleSubmitComment(para.id)}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isPostingComment ? 'Đang gửi...' : 'Gửi'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Nhấn Enter để gửi, Shift+Enter để xuống dòng
                      </p>
                    </div>

                    {/* Comments list */}
                    <div className="border-t border-gray-200 pt-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Tất cả bình luận
                      </h4>
                      <ListComments
                        post={{ id: para.id } as any}
                        isCommentOpen={true}
                        parentId={null}
                      />
                    </div>

                    {/* Close button */}
                    <button
                      onClick={() => setActiveParagraphId(null)}
                      className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 hover:bg-gray-100 rounded transition-colors"
                    >
                      Đóng bình luận
                    </button>
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
        title={`Chia sẻ đoạn văn${bookTitle ? ` từ "${bookTitle}"` : ''}`}
        contentLabel="Nội dung đoạn văn"
        maxImages={10}
      />
    </>
  );
}
