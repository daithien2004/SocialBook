'use client';

import CreatePostModal, {
  CreatePostData,
} from '@/components/post/CreatePostModal';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCreatePostMutation } from '@/features/posts/api/postApi';
import { useAppAuth } from '@/hooks/useAppAuth';
import { getErrorMessage } from '@/lib/utils';
import { useReadingSettings } from '@/store/useReadingSettings';
import { MessageSquarePlus, Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
  const { user } = useAppAuth();
  const { settings } = useReadingSettings();
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(
    null
  );
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [activeParagraph, setActiveParagraph] = useState<Paragraph | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [selectedParagraph, setSelectedParagraph] = useState<Paragraph | null>(
    null
  );

  const [createPost, { isLoading: isCreatingPost }] = useCreatePostMutation();

  const handleToggleComments = (paragraph: Paragraph) => {
    setActiveParagraphId(paragraph.id);
    setActiveParagraph(paragraph);
    setCommentDrawerOpen(true);
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
      const result = await createPost({
        bookId: bookId,
        content: data.content,
        images: data.images,
      }).unwrap();

      if (result.warning) {
        toast.warning('Bài viết đang được xem xét', {
          description: result.warning,
          duration: 5000
        });
      } else {
        toast.success('Chia sẻ thành công!');
      }
      setPostModalOpen(false);
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <TooltipProvider>
      <main
        className="flex-1 w-full antialiased relative transition-all duration-300 rounded-2xl p-10 selection:bg-red-500/30"
        style={{
          backgroundColor: settings.backgroundColor,
          color: settings.textColor,
          paddingLeft: `${settings.marginWidth}px`,
          paddingRight: `${settings.marginWidth}px`,
        }}
      >
        <article className="space-y-4">
          {paragraphs.map((para) => (
            <div key={para.id} className="group relative">
              <div className="flex items-start">
                <p
                  className={`transition-colors duration-300 w-full ${activeParagraphId === para.id
                    ? 'bg-yellow-100/50 dark:bg-yellow-900/20 rounded-lg px-2 -mx-2'
                    : ''
                    }`}
                  style={{
                    fontSize: `${settings.fontSize}px`,
                    fontFamily: settings.fontFamily,
                    lineHeight: settings.lineHeight,
                    letterSpacing: `${settings.letterSpacing}px`,
                    textAlign: settings.textAlign as any,
                  }}
                >
                  {para.content}
                </p>

                {/* Action buttons */}
                <div
                  className="
                          absolute
                          -right-12
                          top-0
                          flex flex-col gap-2
                          opacity-0
                          group-hover:opacity-100
                          transition-opacity duration-200
                        "
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleToggleComments(para)}
                        className="h-8 w-8 rounded-full shadow-sm hover:scale-110 transition-transform"
                      >
                        <MessageSquarePlus size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Bình luận</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleOpenPostModal(para)}
                        className="h-8 w-8 rounded-full shadow-sm hover:scale-110 transition-transform"
                      >
                        <Share2 size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Chia sẻ</p>
                    </TooltipContent>
                  </Tooltip>
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
    </TooltipProvider>
  );
}
