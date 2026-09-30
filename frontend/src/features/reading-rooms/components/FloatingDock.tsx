'use client';
import { ChevronLeftIcon, ChevronRightIcon, Settings, List, Bookmark, Library, Share2, MessageCircleQuestion, Users, Highlighter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MESSAGES } from '@/constants/messages';

interface DockButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
  className?: string;
}

function DockButton({ icon, label, onClick, disabled, isActive, className }: DockButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all group disabled:opacity-30 disabled:cursor-not-allowed shrink-0 ${isActive ? 'bg-muted text-foreground' : ''} ${className || ''}`}
    >
      {icon}
      <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded shadow-sm whitespace-nowrap pointer-events-none border border-border z-50">
        {label}
      </span>
    </button>
  );
}

interface NavigationData {
  previous?: { slug: string } | null;
  next?: { slug: string } | null;
}

interface FloatingDockProps {
  navigation?: NavigationData;
  isControlsVisible: boolean;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  showTOC: boolean;
  setShowTOC: (v: boolean) => void;
  showBookmarks: boolean;
  setShowBookmarks: (v: boolean) => void;
  showHighlights: boolean;
  setShowHighlights: (v: boolean) => void;
  showMobileSidebar: boolean;
  setShowMobileSidebar: (v: boolean) => void;
  user?: { id: string };
  bookData?: { id: string };
  chapter?: { title: string };
  handleChapterNav: (slug: string) => void;
  handleShareRoom: () => void;
  onAddToLibrary: () => void;
}

export function FloatingDock({
  navigation,
  isControlsVisible,
  showSettings,
  setShowSettings,
  showTOC,
  setShowTOC,
  showBookmarks,
  setShowBookmarks,
  showHighlights,
  setShowHighlights,
  showMobileSidebar,
  setShowMobileSidebar,
  user,
  bookData,
  chapter,
  handleChapterNav,
  handleShareRoom,
  onAddToLibrary,
}: FloatingDockProps) {
  const router = useRouter();

  return (
    <div
      inert={!isControlsVisible}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ${
        isControlsVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-24 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-background/90 backdrop-blur-xl border border-border shadow-2xl max-w-[95vw] overflow-x-auto scrollbar-hide">
        <DockButton
          icon={<ChevronLeftIcon size={20} />}
          label="Chương trước"
          disabled={!navigation?.previous}
          onClick={() => navigation?.previous && handleChapterNav(navigation.previous.slug)}
        />
        <DockButton
          icon={<ChevronRightIcon size={20} />}
          label="Chương sau"
          disabled={!navigation?.next}
          onClick={() => navigation?.next && handleChapterNav(navigation.next.slug)}
        />
        <div className="w-px h-6 bg-border mx-1 shrink-0" />
        <DockButton
          icon={<Settings size={20} />}
          label="Cài đặt đọc"
          isActive={showSettings}
          onClick={() => setShowSettings(true)}
        />
        <DockButton
          icon={<List size={20} />}
          label="Mục lục"
          isActive={showTOC}
          onClick={() => setShowTOC(true)}
        />
        <div className="w-px h-6 bg-border mx-1 shrink-0" />
        <DockButton
          icon={<Bookmark size={20} />}
          label="Bookmarks"
          isActive={showBookmarks}
          onClick={() => {
            if (!user) {
              toast.info(MESSAGES.REQUIRE_LOGIN, {
                action: { label: 'Đăng nhập', onClick: () => router.push('/login') },
              });
              return;
            }
            setShowBookmarks(true);
          }}
        />
        <DockButton
          icon={<Highlighter size={20} />}
          label="Nổi bật"
          isActive={showHighlights}
          onClick={() => setShowHighlights(true)}
        />
        <DockButton
          icon={<Library size={20} />}
          label="Lưu"
          disabled={!bookData}
          onClick={onAddToLibrary}
        />
        <DockButton
          icon={<Share2 size={20} />}
          label="Chia sẻ"
          disabled={!chapter}
          onClick={handleShareRoom}
        />
        <DockButton
          icon={<MessageCircleQuestion size={20} />}
          label="Trợ lý sách"
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-global-chat'))}
          className="sm:hidden"
        />
        <DockButton
          icon={<Users size={20} />}
          label="Hoạt động phòng"
          isActive={showMobileSidebar}
          onClick={() => setShowMobileSidebar(true)}
          className="sm:hidden"
        />
      </div>
    </div>
  );
}
