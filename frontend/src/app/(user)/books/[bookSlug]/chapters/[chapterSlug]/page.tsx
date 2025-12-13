'use client';

import { use, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Bookmark,
  ChevronLeft,
  List,
  Headphones,
  BookOpen,
  Settings,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';

// --- IMPORTS THƯ VIỆN & COMPONENT ---
import { comments } from '@/src/lib/comments';
import AddToLibraryModal from '@/src/components/library/AddToLibraryModal';
import {
  useGetChapterQuery,
  useGetChaptersQuery,
} from '@/src/features/chapters/api/chaptersApi';
import CreatePostModal, {
  CreatePostData,
} from '@/src/components/post/CreatePostModal';
import { useCreatePostMutation } from '@/src/features/posts/api/postApi';
import ChapterNavigation from '@/src/components/chapter/ChapterNavigation';
import CommentSection from '@/src/components/chapter/CommentSection';
import ChapterHeader from '@/src/components/chapter/ChapterHeader';
import { ChapterContent } from '@/src/components/chapter/ChapterContent';
import { useReadingProgress } from '@/src/hooks/useReadingProgress';
import AudiobookView from '@/src/components/chapter/AudiobookView';
import ChapterSummaryModal from '@/src/components/chapter/ChapterSummaryModal';
import ReadingSettingsPanel from '@/src/components/chapter/ReadingSettingsPanel';
import ChapterListDrawer from '@/src/components/book/ChapterListDrawer';

interface ChapterPageProps {
  params: Promise<{
    chapterSlug: string;
    bookSlug: string;
  }>;
}

export default function ChapterPage({ params }: ChapterPageProps) {
  const { bookSlug, chapterSlug } = use(params);
  const router = useRouter();

  // --- STATE QUẢN LÝ UI ---
  const [showTOC, setShowTOC] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'read' | 'listen'>('read');
  const [showSettings, setShowSettings] = useState(false);

  // State cho hiệu ứng cuộn (Immersive Mode)
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // --- API DATA ---
  const {
    data: chapterData,
    isLoading,
    error,
  } = useGetChapterQuery({ bookSlug, chapterSlug });

  const { data: chaptersData } = useGetChaptersQuery({ bookSlug });
  const [createPost, { isLoading: isCreatingPost }] = useCreatePostMutation();

  const book = chapterData?.book;
  const chapter = chapterData?.chapter;
  const navigation = chapterData?.navigation;

  const chapters = chaptersData?.chapters || [];
  const totalChapters = chaptersData?.total || 0;

  const { savedProgress, restoreScroll } = useReadingProgress(
    book?.id || '',
    chapter?.id || '',
    !isLoading && !!chapter && viewMode === 'read'
  );

  const hasShownResumeToast = useRef(false);

  useEffect(() => {
    if (savedProgress > 5 && !hasShownResumeToast.current) {
      hasShownResumeToast.current = true;
      setTimeout(() => {
        toast('Bạn đang đọc dở chương này', {
          description: `Tiếp tục tại vị trí ${Math.floor(savedProgress)}%?`,
          action: {
            label: 'Đọc tiếp',
            onClick: restoreScroll,
          },
          duration: 8000,
        });
      }, 1000);
    }
  }, [savedProgress, restoreScroll]);

  const chapterComments = useMemo(() => {
    if (!chapter?.id) return [];
    return comments
      .filter((c) => c.targetType === 'chapter' && c.targetId === chapter.id)
      .map((c) => ({ ...c, targetType: 'chapter' as const }));
  }, [chapter?.id]);

  // --- HANDLERS ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsControlsVisible(false);
      } else {
        setIsControlsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleChapterSelect = useCallback(
    (slug: string) => {
      setShowTOC(false);
      router.push(`/books/${bookSlug}/chapters/${slug}`);
    },
    [bookSlug, router]
  );

  const handleSharePost = async (data: CreatePostData) => {
    if (!book?.id) {
      toast.error('Không tìm thấy thông tin sách');
      return;
    }

    try {
      await createPost({
        bookId: book.id,
        content: data.content,
        images: data.images,
      }).unwrap();
      toast.success('Chia sẻ thành công!');
      setIsShareModalOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Không thể tạo bài viết');
    }
  };

  const defaultShareContent =
    book && chapter
      ? `📖 Đang đọc: ${book.title} - ${chapter.title}
✍️ Tác giả: ${book.authorId.name}

${book.description?.slice(0, 100)}...

#${book.title.replace(/\s+/g, '')} #${chapter.title.replace(/\s+/g, '')}`
      : '';

  // --- RENDER LOADING ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#141414] flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- RENDER ERROR ---
  if (error || !chapterData || !book || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#141414] text-gray-900 dark:text-white transition-colors duration-300">
        <div className="text-center space-y-4">
          <p className="text-xl">⚠️ Không thể tải nội dung</p>
          <button
            onClick={() => router.push(`/books/${bookSlug}`)}
            className="px-6 py-2 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 rounded-lg transition-colors text-sm"
          >
            Quay lại mục lục
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER AUDIOBOOK MODE ---
  if (viewMode === 'listen') {
    return (
      <div className="h-screen bg-gray-50 dark:bg-[#1a1a1a] flex flex-col overflow-hidden animate-in fade-in duration-300 transition-colors">
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#1a1a1a] shrink-0 z-50 transition-colors duration-300">
          <button
            onClick={() => router.push(`/books/${bookSlug}`)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Quay lại</span>
          </button>

          <div className="flex bg-gray-100 dark:bg-black/40 p-1 rounded-lg border border-gray-200 dark:border-white/5 transition-colors duration-300">
            <button
              onClick={() => setViewMode('read')}
              className="px-4 py-1.5 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              Đọc
            </button>
            <button className="px-4 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white shadow-lg transition-all">
              Nghe
            </button>
          </div>
          <div className="w-20" />
        </div>

        <div className="flex-1 overflow-hidden relative">
          <AudiobookView
            chapterId={chapter.id}
            chapterTitle={chapter.title}
            paragraphs={chapter.paragraphs}
            bookTitle={book.title}
            bookCoverImage={book.coverUrl}
          />
        </div>
      </div>
    );
  }

  // --- RENDER READ MODE ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#161515] text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-600 selection:text-white pb-32 relative transition-colors duration-300">
      {/* GLOBAL BACKGROUND FIXED */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/main-background.jpg"
          alt="Background Texture"
          className="w-full h-full object-cover opacity-10 dark:opacity-40 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-white/60 dark:bg-[#0f0f0f]/70 transition-colors duration-300"></div>
      </div>

      {/* 1. PROGRESS BAR (Top) */}
      <div
        className="fixed top-0 left-0 h-1 bg-blue-600 z-[60] transition-all duration-300 ease-out"
        style={{
          width: `${savedProgress}%`,
          opacity: isControlsVisible ? 1 : 0,
        }}
      />

      {/* 3. MAIN CONTENT */}
      <main className="relative z-10 pt-20 px-4 sm:px-6 lg:px-8 mx-auto max-w-3xl transition-opacity duration-500">
        <ChapterHeader
          bookTitle={book.title}
          bookSlug={book.slug}
          chapterTitle={chapter.title}
          chapterOrder={chapter.orderIndex}
          viewsCount={chapter.viewsCount}
        />

        <ChapterContent
          paragraphs={chapter.paragraphs}
          chapterId={chapter.id}
          bookId={book.id}
          bookCoverImage={book.coverUrl}
          bookTitle={book.title}
        />

        {/* Navigation Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/5 transition-colors duration-300">
          <ChapterNavigation
            hasPrevious={!!navigation?.previous}
            hasNext={!!navigation?.next}
            onPrevious={() =>
              navigation?.previous &&
              router.push(
                `/books/${bookSlug}/chapters/${navigation.previous.slug}`
              )
            }
            onNext={() =>
              navigation?.next &&
              router.push(`/books/${bookSlug}/chapters/${navigation.next.slug}`)
            }
          />
        </div>

        <div className="mt-8">
          <CommentSection
            comments={chapterComments}
            targetId={chapter.id}
            targetType="chapter"
          />
        </div>
      </main>

      {/* 4. FLOATING DOCK (Thanh công cụ nổi) */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          isControlsVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-24 opacity-0'
        }`}
      >
        <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-xl border border-gray-300 dark:border-white/10 shadow-2xl transition-colors duration-300">
          {/* Nút Mục Lục */}
          <DockButton
            icon={<List size={20} />}
            label="Mục lục"
            onClick={() => setShowTOC(true)}
          />

          <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1 transition-colors duration-300" />

          {/* Switch Mode */}
          <div className="flex bg-gray-100 dark:bg-black/40 rounded-xl p-1 transition-colors duration-300">
            <button
              onClick={() => setViewMode('read')}
              className="p-2 rounded-lg bg-black/40 text-white shadow-sm transition-all"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setViewMode('listen')}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5 transition-all"
            >
              <Headphones size={18} />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-white/10 mx-1 transition-colors duration-300" />

          {/* Actions */}
          <DockButton
            icon={
              <Bookmark
                size={20}
                className={
                  isLibraryModalOpen ? 'fill-blue-600 text-blue-600' : ''
                }
              />
            }
            label="Lưu"
            onClick={() => setIsLibraryModalOpen(true)}
          />

          <DockButton
            icon={<Share2 size={20} />}
            label="Chia sẻ"
            onClick={() => setIsShareModalOpen(true)}
          />

          <DockButton
            icon={<Sparkles size={20} />}
            label="Tóm tắt AI"
            onClick={() => setIsSummaryModalOpen(true)}
          />

          <DockButton
            icon={<Settings size={20} />}
            label="Cài đặt"
            onClick={() => setShowSettings(true)}
          />
        </div>
      </div>

      {/* 5. DRAWER MỤC LỤC (Slide-over) */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          showTOC ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setShowTOC(false)}
      />

      {/* Drawer Panel */}
      <ChapterListDrawer
        isOpen={showTOC}
        onClose={() => setShowTOC(false)}
        chapters={chapters}
        bookSlug={bookSlug}
        currentChapterSlug={chapterSlug}
        totalChapters={totalChapters}
      />

      {/* --- MODALS --- */}
      {book && (
        <AddToLibraryModal
          isOpen={isLibraryModalOpen}
          onClose={() => setIsLibraryModalOpen(false)}
          bookId={book.id}
        />
      )}

      {book && (
        <CreatePostModal
          isSubmitting={isCreatingPost}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onSubmit={handleSharePost}
          defaultContent={defaultShareContent}
          title={`Chia sẻ "${chapter.title}"`}
          contentLabel="Nội dung bài viết"
          contentPlaceholder="Chia sẻ cảm nghĩ của bạn về chương này..."
          maxImages={10}
        />
      )}

      {book && chapter && (
        <ChapterSummaryModal
          isOpen={isSummaryModalOpen}
          onClose={() => setIsSummaryModalOpen(false)}
          chapterId={chapter.id}
          chapterTitle={chapter.title}
        />
      )}

      <ReadingSettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

// Sub-component nút bấm
function DockButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all group"
    >
      {icon}
      {/* Tooltip */}
      <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-[10px] rounded shadow-sm whitespace-nowrap pointer-events-none">
        {label}
      </span>
    </button>
  );
}
