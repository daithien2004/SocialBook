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
import ReadingSettingsPanel from '@/src/components/chapter/ReadingSettingsPanel';

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
  const [showTOC, setShowTOC] = useState(false); // Drawer Mục lục
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'read' | 'listen'>('read');
  const [showSettings, setShowSettings] = useState(false); // Reading Settings Panel

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

  // Destructure Data
  const book = chapterData?.book;
  const chapter = chapterData?.chapter;
  const navigation = chapterData?.navigation;

  const chapters = chaptersData?.chapters || [];
  const totalChapters = chaptersData?.total || 0;

  // Logic tiến độ đọc
  const { savedProgress, restoreScroll } = useReadingProgress(
    book?.id || '',
    chapter?.id || '',
    !isLoading && !!chapter && viewMode === 'read'
  );

  // Ref để đảm bảo chỉ hiện toast 1 lần
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

  // Logic Comments
  const chapterComments = useMemo(() => {
    if (!chapter?.id) return [];
    return comments
      .filter((c) => c.targetType === 'chapter' && c.targetId === chapter.id)
      .map((c) => ({ ...c, targetType: 'chapter' as const }));
  }, [chapter?.id]);

  // --- HANDLERS ---

  // Xử lý ẩn hiện thanh công cụ khi cuộn
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Nếu cuộn xuống quá 100px thì ẩn, cuộn lên thì hiện
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

  // Handle Share Post
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

  // Nội dung mặc định cho bài chia sẻ
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-400">
        <div className="w-10 h-10 border-2 border-t-blue-500 border-r-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm tracking-wider animate-pulse">ĐANG TẢI...</p>
      </div>
    );
  }

  // --- RENDER ERROR ---
  if (error || !chapterData || !book || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        <div className="text-center space-y-4">
          <p className="text-xl">⚠️ Không thể tải nội dung</p>
          <button
            onClick={() => router.push(`/books/${bookSlug}`)}
            className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-sm"
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
      <div className="h-screen bg-neutral-900 flex flex-col overflow-hidden animate-in fade-in duration-300">
        {/* Header Audiobook */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/5 bg-neutral-900 shrink-0 z-50">
          <button
            onClick={() => router.push(`/books/${bookSlug}`)}
            className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={20} />{' '}
            <span className="text-sm font-medium">Quay lại</span>
          </button>

          {/* Switcher */}
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setViewMode('read')}
              className="px-4 py-1.5 rounded-md text-sm font-medium text-neutral-400 hover:text-white transition-all"
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

  // --- RENDER READ MODE (PREMIUM UI) ---
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-blue-500/30 selection:text-blue-100 pb-32">
      {/* 1. PROGRESS BAR (Top) */}
      <div
        className="fixed top-0 left-0 h-1 bg-blue-600 z-[60] transition-all duration-300 ease-out"
        style={{
          width: `${savedProgress}%`,
          opacity: isControlsVisible ? 1 : 0,
        }}
      />

      {/* 2. HEADER (Auto Hide) */}
      <header
        className={`
          fixed top-0 left-0 w-full h-16 px-4 
          bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 z-50 
          flex items-center 
          transition-transform duration-300
          ${!isControlsVisible ? '-translate-y-full' : 'translate-y-0'}
        `}
      >
        {/* LEFT: Back Button - Luôn nằm bên trái */}
        <div className="flex-1 flex justify-start z-10">
          <button
            onClick={() => router.push(`/books/${bookSlug}`)}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group max-w-full"
          >
            <ChevronLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform shrink-0"
            />
            <span className="text-sm font-medium hidden sm:block truncate opacity-80 group-hover:opacity-100">
              {book.title}
            </span>
          </button>
        </div>

        {/* CENTER: Title - Căn giữa tuyệt đối màn hình */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none px-12 sm:px-0">
          <span className="text-sm font-bold text-neutral-100 block truncate max-w-[200px] sm:max-w-md mx-auto drop-shadow-md">
            {chapter.title}
          </span>
        </div>

        {/* RIGHT: Spacer hoặc Actions - Luôn nằm bên phải */}
        <div className="flex-1 flex justify-end z-10">
          {/* Nếu sau này muốn thêm nút Share hay Setting lên góc phải thì đặt ở đây */}
          <div className="w-8" />
        </div>
      </header>

      {/* 3. MAIN CONTENT */}
      <main className="pt-20 px-4 sm:px-6 lg:px-8 mx-auto max-w-3xl transition-opacity duration-500">
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
        <div className="mt-12 pt-8 border-t border-white/5">
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
        <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-neutral-900/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
          {/* Nút Mục Lục */}
          <DockButton
            icon={<List size={20} />}
            label="Mục lục"
            onClick={() => setShowTOC(true)}
          />

          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Switch Mode */}
          <div className="flex bg-black/40 rounded-xl p-1">
            <button
              onClick={() => setViewMode('read')}
              className="p-2 rounded-lg bg-neutral-700 text-white shadow-sm transition-all"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setViewMode('listen')}
              className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <Headphones size={18} />
            </button>
          </div>

          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Actions */}
          <DockButton
            icon={
              <Bookmark
                size={20}
                className={
                  isLibraryModalOpen ? 'fill-blue-500 text-blue-500' : ''
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
            icon={<Settings size={20} />}
            label="Cài đặt"
            onClick={() => toast.info('Tính năng đang phát triển')} // Placeholder cho tính năng Font size sau này
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
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-neutral-900 border-l border-white/10 z-[61] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          showTOC ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-neutral-900">
          <div>
            <h2 className="font-bold text-lg text-white">Mục lục</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {totalChapters} chương
            </p>
          </div>
          <button
            onClick={() => setShowTOC(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chapters.map((chap) => {
            const isActive = chap.slug === chapterSlug;
            return (
              <button
                key={chap.id}
                onClick={() => handleChapterSelect(chap.slug)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 border flex items-center justify-between group ${
                  isActive
                    ? 'bg-blue-900/20 border-blue-500/30 text-blue-100'
                    : 'border-transparent text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isActive
                        ? 'text-blue-400'
                        : 'text-neutral-500 group-hover:text-neutral-400'
                    }`}
                  >
                    Chương {chap.orderIndex}
                  </span>
                  <span className="text-sm font-medium line-clamp-1">
                    {chap.title}
                  </span>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- MODALS & TOASTS --- */}
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

      {/*  Settings Panel (Cá nhân hóa trải nghiệm đọc) */}
      <ReadingSettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

// Sub-component nút bấm để code gọn hơn
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
      className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-all group"
    >
      {icon}
      {/* Tooltip nhỏ khi hover */}
      <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform px-2 py-1 bg-neutral-800 text-white text-[10px] rounded shadow-sm whitespace-nowrap pointer-events-none">
        {label}
      </span>
    </button>
  );
}
