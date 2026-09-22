'use client';
import { AlertTriangle } from 'lucide-react';
import Image from 'next/image';

import { useReadingRoomData } from '@/features/reading-rooms/hooks/useReadingRoomData';
import { MobileHeader } from '@/features/reading-rooms/components/MobileHeader';
import { DesktopSidebar } from '@/features/reading-rooms/components/DesktopSidebar';
import { RoomTabs } from '@/features/reading-rooms/components/RoomTabs';
import { FloatingDock } from '@/features/reading-rooms/components/FloatingDock';
import { ChapterContentView } from '@/features/reading-rooms/components/ChapterContentView';
import ChapterListDrawer from '@/features/books/components/ChapterListDrawer';
import { BookmarksDrawer } from '@/features/chapters/components/BookmarksDrawer';
import ReadingSettingsPanel from '@/features/chapters/components/ReadingSettingsPanel';
import { TransferHostModal } from '@/features/reading-rooms/components/TransferHostModal';
import { EmotionStream } from '@/features/reading-rooms/components/EmotionStream';
import { ProgressRadar } from '@/features/reading-rooms/components/ProgressRadar';
import { RoomHighlightsDrawer } from '@/features/reading-rooms/components/RoomHighlightsDrawer';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { LoadingOverlay } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import LoginWall from '@/features/auth/components/LoginWall';

interface ReadingRoomPageClientProps {
  roomCode: string;
}

export function ReadingRoomPageClient({ roomCode }: ReadingRoomPageClientProps) {
  const {
    isAuthenticated, isLoadingRoom, error, room, initialRoom, isEnded, isHost, presences, user,
    copied, currentChapterSlug, bookData, chapter, navigation, chaptersData,
    isLoadingChapter, handleReactivateRoom, isReactivating,
    contentRef, onActiveParagraphChange,
    isControlsVisible, showSettings, setShowSettings,
    showBookmarks, setShowBookmarks, showTOC, setShowTOC,
    showHighlights, setShowHighlights,
    showMobileSidebar, setShowMobileSidebar,
    transferHostOpen, setTransferHostOpen,
    sendChatMessage, changeMode, endRoom, deleteRoom,
    handleTransferHost, handleTransferHostClick,
    handleChapterNav, handleShareRoom, handleCopyCode, onAddToLibrary,
  } = useReadingRoomData(roomCode);

  if (!isAuthenticated) {
    return (
      <LoginWall
        title="Phòng đọc"
        description="Đăng nhập để tham gia phòng đọc sách cùng bạn bè và đồng bộ tiến độ theo thời gian thực."
        secondaryLabel="Khám phá sách trước"
        secondaryHref="/books"
      />
    );
  }

  if (isLoadingRoom) {
    return (
      <div className="min-h-[60vh]">
        <LoadingOverlay>Đang kết nối vào phòng...</LoadingOverlay>
      </div>
    );
  }

  if (error || !initialRoom) {
    return (
      <div className="min-h-[60vh]">
        <EmptyState
          icon={AlertTriangle}
          title="Không tìm thấy phòng"
          description="Phòng không tồn tại hoặc đã kết thúc."
          action={<Button onClick={() => window.location.href = '/reading-rooms'}>Quay lại</Button>}
          iconClassName="text-destructive"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground relative transition-colors duration-300 overflow-x-clip">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image src="/main-background.jpg" alt="BG" fill priority sizes="100vw" className="object-cover opacity-10 dark:opacity-40" />
        <div className="absolute inset-0 bg-background/80 dark:bg-background/90" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <EmotionStream />

        <MobileHeader
          roomCode={roomCode} room={room} bookData={bookData} presences={presences}
          isHost={isHost} isEnded={isEnded} copied={copied} handleCopyCode={handleCopyCode}
          changeMode={changeMode} endRoom={endRoom} deleteRoom={deleteRoom}
          isReactivating={isReactivating} onReactivateRoom={handleReactivateRoom}
          setTransferHostOpen={setTransferHostOpen}
        />

        <DesktopSidebar
          roomCode={roomCode} room={room} bookData={bookData} presences={presences}
          isHost={isHost} isEnded={isEnded} copied={copied} handleCopyCode={handleCopyCode}
          changeMode={changeMode} endRoom={endRoom} deleteRoom={deleteRoom}
          isReactivating={isReactivating} onReactivateRoom={handleReactivateRoom}
          onTransferHost={() => setTransferHostOpen(true)}
        />

        <div className="flex-1 flex flex-col sm:ml-16">
          {!isEnded && <ProgressRadar />}

          <main className="container mx-auto px-4 py-8 flex-1">
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
              <div className="flex-1 w-full max-w-3xl mx-auto lg:mx-0">
                <ChapterContentView
                  isLoadingChapter={isLoadingChapter} chapter={chapter} bookData={bookData}
                  navigation={navigation} currentChapterSlug={currentChapterSlug}
                  contentRef={contentRef} onActiveParagraphChange={onActiveParagraphChange}
                  handleChapterNav={handleChapterNav}
                />
              </div>

              <aside className="w-full lg:w-80 sticky top-28 shrink-0 space-y-6 hidden sm:block">
                <RoomTabs
                  variant="desktop" sendChatMessage={sendChatMessage} isEnded={isEnded}
                  currentChapterSlug={currentChapterSlug} roomCode={roomCode}
                  isHost={isHost} currentUserId={user?.id}
                  bookSlug={bookData?.slug || ''} chapterId={chapter?.id || ''}
                  onTransferHost={handleTransferHostClick}
                />

                <div className={`p-6 rounded-3xl border ${isEnded ? 'bg-muted/5 border-muted/20' : 'bg-primary/5 border-primary/10'}`}>
                  <h4 className={`text-[10px] font-black uppercase mb-2 ${isEnded ? 'text-muted-foreground' : 'text-primary'}`}>
                    {isEnded ? 'Phòng đã kết thúc' : 'Thông báo phòng'}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isEnded ? (
                      'Phòng đọc này đã kết thúc. Bạn có thể xem lại nội dung nhưng không thể tương tác.'
                    ) : (
                      <>
                        Bạn đang ở chế độ <strong>{room?.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}</strong>.
                        {room?.mode === 'sync'
                          ? ' Chương sách sẽ được tự động lật khi trưởng phòng chuyển trang.'
                          : ' Bạn có thể tự do đọc các chương khác nhau.'}
                      </>
                    )}
                  </p>
                </div>
              </aside>
            </div>
          </main>
        </div>
      </div>

      <FloatingDock
        navigation={navigation} isControlsVisible={isControlsVisible}
        showSettings={showSettings} setShowSettings={setShowSettings}
        showTOC={showTOC} setShowTOC={setShowTOC}
        showBookmarks={showBookmarks} setShowBookmarks={setShowBookmarks}
        showHighlights={showHighlights} setShowHighlights={setShowHighlights}
        showMobileSidebar={showMobileSidebar} setShowMobileSidebar={setShowMobileSidebar}
        user={user} bookData={bookData} chapter={chapter}
        handleChapterNav={handleChapterNav} handleShareRoom={handleShareRoom}
        onAddToLibrary={onAddToLibrary}
      />

      <BookmarksDrawer
        open={showBookmarks} onOpenChange={setShowBookmarks}
        bookId={bookData?.id || ''} bookSlug={bookData?.slug || ''}
        currentChapterSlug={currentChapterSlug}
      />

      <RoomHighlightsDrawer
        open={showHighlights} onOpenChange={setShowHighlights}
        currentChapterSlug={currentChapterSlug} roomCode={roomCode}
      />

      <ChapterListDrawer
        isOpen={showTOC} onClose={() => setShowTOC(false)}
        chapters={chaptersData?.chapters || []} bookSlug={bookData?.slug || ''}
        currentChapterSlug={currentChapterSlug} totalChapters={chaptersData?.total}
        onNavigate={(slug) => handleChapterNav(slug)}
      />

      <ReadingSettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <TransferHostModal
        open={transferHostOpen} onOpenChange={setTransferHostOpen}
        onConfirm={handleTransferHost}
      />

      <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
        <SheetContent side="bottom" className="h-[85vh] p-4 pt-6 rounded-t-3xl border-t border-border overflow-hidden flex flex-col z-50">
          <SheetTitle className="sr-only">Hoạt động phòng</SheetTitle>
          <RoomTabs
            variant="mobile" sendChatMessage={sendChatMessage} isEnded={isEnded}
            currentChapterSlug={currentChapterSlug} roomCode={roomCode}
            isHost={isHost} currentUserId={user?.id}
            bookSlug={bookData?.slug || ''} chapterId={chapter?.id || ''}
            onTransferHost={handleTransferHostClick}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
