'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'sonner';
import { MESSAGES } from '@/constants/messages';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  List,
  Headphones,
  BookOpen,
  Settings,
  Share2,
  Highlighter,
  Bot,
  Library,
  Sparkles,
} from 'lucide-react';

import ChapterListDrawer from '@/features/books/components/ChapterListDrawer';
import ReadingSettingsPanel from '@/features/chapters/components/ReadingSettingsPanel';
import { PersonalHighlightsDrawer } from '@/features/chapters/components/PersonalHighlightsDrawer';
import { BookmarksDrawer } from '@/features/chapters/components/BookmarksDrawer';
import { useReadingSettings } from '@/store/useReadingSettings';

interface ChapterDockProps {
  isControlsVisible: boolean;
  navigation?: { previous?: { slug: string } | null; next?: { slug: string } | null };
  goToPreviousChapter: () => void;
  goToNextChapter: () => void;
  chapters: Array<{ id: string; slug: string; title: string; createdAt: string; orderIndex: number }>;
  bookSlug: string;
  chapterSlug: string;
  totalChapters: number;
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  isLoggedIn: boolean;
  viewMode: 'read' | 'listen';
  setViewMode: (mode: 'read' | 'listen') => void;
  showAISidebar: boolean;
  setShowAISidebar: (show: boolean) => void;
  handleOpenShareModal: () => void;
  openAddToLibrary: (params: { bookId: string }) => void;
  openChapterSummary: (params: { chapterId: string; chapterTitle: string }) => void;
}

export function ChapterDock({
  isControlsVisible,
  navigation,
  goToPreviousChapter,
  goToNextChapter,
  chapters,
  bookSlug,
  chapterSlug,
  totalChapters,
  bookId,
  chapterId,
  chapterTitle,
  isLoggedIn,
  viewMode,
  setViewMode,
  showAISidebar,
  setShowAISidebar,
  handleOpenShareModal,
  openAddToLibrary,
  openChapterSummary,
}: ChapterDockProps) {
  const router = useRouter();
  const [showTOC, setShowTOC] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const { settings, updateSettings } = useReadingSettings(
    useShallow((s) => ({
      settings: s.settings,
      updateSettings: s.updateSettings,
    })),
  );

  return (
    <>
      <div
        inert={!isControlsVisible}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ease-out ${
          isControlsVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-background/90 backdrop-blur-xl border border-border shadow-2xl max-w-[95vw] overflow-x-auto scrollbar-hide">
          <DockButton
            icon={<ChevronLeft size={20} />}
            label="Chương trước"
            disabled={!navigation?.previous}
            onClick={goToPreviousChapter}
          />
          <DockButton
            icon={<ChevronRight size={20} />}
            label="Chương sau"
            disabled={!navigation?.next}
            onClick={goToNextChapter}
          />

          <div className="w-px h-6 bg-border mx-1 shrink-0" />

          <DockButton
            icon={<List size={20} />}
            label="Mục lục"
            onClick={() => setShowTOC(true)}
          />

          <DockButton
            icon={<Highlighter size={20} className="text-yellow-500" />}
            label="Highlights"
            onClick={() => {
              if (!isLoggedIn) {
                toast.info(MESSAGES.REQUIRE_LOGIN, {
                  action: {
                    label: 'Đăng nhập',
                    onClick: () => router.push('/login'),
                  },
                });
                return;
              }
              setShowHighlights(true);
            }}
          />

          <div className="w-px h-6 bg-border mx-1 shrink-0" />

          <div className="flex bg-muted rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode('read')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'read'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setViewMode('listen')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'listen'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <Headphones size={18} />
            </button>
          </div>

          <div className="w-px h-6 bg-border mx-1 shrink-0" />

          <DockButton
            icon={<Library size={20} />}
            label="Lưu"
            onClick={() => openAddToLibrary({ bookId })}
          />

          <DockButton
            icon={<Share2 size={20} />}
            label="Chia sẻ"
            onClick={handleOpenShareModal}
          />

          {!isLoggedIn && (
            <DockButton
              icon={<Sparkles size={20} />}
              label="Tóm tắt AI"
              onClick={() =>
                openChapterSummary({
                  chapterId,
                  chapterTitle,
                })
              }
            />
          )}

          <DockButton
            icon={<Bot size={20} />}
            label="Trợ lý sách"
            onClick={() => {
              if (window.innerWidth < 1024) {
                window.dispatchEvent(new CustomEvent('toggle-global-chat'));
              }
              setShowAISidebar(!showAISidebar);
            }}
          />

          <DockButton
            icon={<Bookmark size={20} />}
            label="Bookmarks"
            onClick={() => {
              if (!isLoggedIn) {
                toast.info(MESSAGES.REQUIRE_LOGIN, {
                  action: {
                    label: 'Đăng nhập',
                    onClick: () => router.push('/login'),
                  },
                });
                return;
              }
              setShowBookmarks(true);
            }}
          />

          <div className="w-px h-6 bg-border mx-1 shrink-0" />

          {/* Quick: Font size A-/A+ */}
          <div className="flex items-center bg-muted rounded-xl p-1 shrink-0 gap-0.5">
            <button
              onClick={() =>
                updateSettings({
                  fontSize: Math.max(13, settings.fontSize - 1),
                })
              }
              className="w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all flex items-center justify-center text-sm font-bold"
              title="Giảm cỡ chữ"
            >
              A-
            </button>
            <span className="text-[10px] text-muted-foreground px-1 tabular-nums">
              {settings.fontSize}
            </span>
            <button
              onClick={() =>
                updateSettings({
                  fontSize: Math.min(26, settings.fontSize + 1),
                })
              }
              className="w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all flex items-center justify-center text-sm font-bold"
              title="Tăng cỡ chữ"
            >
              A+
            </button>
          </div>

          <div className="w-px h-6 bg-border mx-1 shrink-0" />

          <DockButton
            icon={<Settings size={20} />}
            label="Cài đặt"
            onClick={() => setShowSettings(true)}
          />
        </div>
      </div>

      <ChapterListDrawer
        isOpen={showTOC}
        onClose={() => setShowTOC(false)}
        chapters={chapters}
        bookSlug={bookSlug}
        currentChapterSlug={chapterSlug}
        totalChapters={totalChapters}
      />

      <PersonalHighlightsDrawer
        open={showHighlights}
        onOpenChange={setShowHighlights}
        bookId={bookId}
        bookSlug={bookSlug}
        currentChapterId={chapterId}
        chapters={chapters.map((c) => ({ id: c.id, slug: c.slug }))}
      />

      <BookmarksDrawer
        open={showBookmarks}
        onOpenChange={setShowBookmarks}
        bookId={bookId}
      />

      <ReadingSettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}

function DockButton({
  icon,
  label,
  onClick,
  disabled = false,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`relative flex flex-col shrink-0 items-center justify-center w-12 h-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all group ${
        className || ''
      }`}
    >
      {icon}
      {!disabled && (
        <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded shadow-sm whitespace-nowrap pointer-events-none border border-border z-50">
          {label}
        </span>
      )}
    </button>
  );
}
