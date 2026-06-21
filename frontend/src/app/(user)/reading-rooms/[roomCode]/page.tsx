'use client';
import { use, useEffect, useState, useCallback } from 'react';
import { useGetRoomQuery, useReactivateRoomMutation } from '@/features/reading-rooms/api/readingRoomsApi';
import { useReadingRoomSocket } from '@/features/reading-rooms/hooks/useReadingRoomSocket';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useAppAuth } from '@/features/auth/hooks';
import { useRoomPresence } from '@/features/reading-rooms/hooks/useRoomPresence';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { useGetBookByIdQuery } from '@/features/books/api/bookApi';
import { useGetChapterQuery } from '@/features/chapters/api/chaptersApi';
import { ChapterContent } from '@/components/chapter/ChapterContent';
import ChapterNavigation from '@/components/chapter/ChapterNavigation';
import { Loader2, Users, LogOut, Info, Copy, Check, BrainCircuit, Lock, LockOpen, Trash2, AlertTriangle, ChevronLeft, DoorOpen, User, BookOpen, Crown, Settings, ChevronLeftIcon, ChevronRightIcon, Bookmark, Share2 } from 'lucide-react';
import { useReadingView } from '@/features/books/hooks';
import { useGetChapterProgressQuery } from '@/features/library/api/libraryApi';
import ReadingSettingsPanel from '@/components/chapter/ReadingSettingsPanel';
import { TransferHostModal } from '@/features/reading-rooms/components/TransferHostModal';
import LoginWall from '@/components/auth/LoginWall';
import { GlassCard } from '@/components/common/GlassCard';
import { LoadingOverlay } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { store } from '@/store/store';
import { readingRoomsApi } from '@/features/reading-rooms/api/readingRoomsApi';
import { toast } from 'sonner';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KnowledgeSidebar } from '@/features/reading-rooms/components/KnowledgeSidebar';
import { RoomChat } from '@/features/reading-room-interactions/components/RoomChat';
import { ReadingProgress } from '@/features/reading-room-interactions/components/ReadingProgress';
import { QuoteBoard } from '@/features/reading-room-interactions/components/QuoteBoard';
import { useGetRoomQuotesQuery } from '@/features/reading-room-interactions/api/roomInteractionsApi';
import { useCreatePostMutation } from '@/features/posts/api/postApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useModalStore } from '@/store/useModalStore';
import { EmotionStream } from '@/features/reading-rooms/components/EmotionStream';
import { ProgressRadar } from '@/features/reading-rooms/components/ProgressRadar';


const ROOM_BTN_BASE = "font-bold px-4 h-9 rounded-full transition-all shadow-sm gap-2";

function DockButton({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {icon}
      <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded shadow-sm whitespace-nowrap pointer-events-none border border-border">
        {label}
      </span>
    </button>
  );
}

export default function ReadingRoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { copy, copiedText } = useCopyToClipboard();
  const copied = !!copiedText;
  const { openConfirm, openAddToLibrary, openCreatePost } = useModalStore();
  
  const handleCopyCode = () => {
    copy(roomCode, 'Đã sao chép mã phòng!');
  };

  const { user, isAuthenticated } = useAppAuth();
  
  const { data: initialRoom, isLoading: isLoadingRoom, error } = useGetRoomQuery(roomCode, { skip: !isAuthenticated });
  
  const storeRoom = useReadingRoomStore(state => state.room);
  const room = storeRoom || initialRoom;
  const isEnded = room?.status === 'ended';
  const shouldConnectSocket = isAuthenticated && !!initialRoom;
  const { endRoom, deleteRoom, leaveRoom, changeChapter, changeMode, sendHeartbeat, sendChatMessage } = useReadingRoomSocket(shouldConnectSocket ? roomCode : undefined);
  const [reactivateRoom, { isLoading: isReactivating }] = useReactivateRoomMutation();
  const isHost = room?.hostId === user?.id;
  const presences = useReadingRoomStore(state => state.presences);

  const currentChapterSlug = !isEnded && room?.mode === 'sync' 
    ? room?.currentChapterSlug || ''
    : (searchParams.get('chapter') || room?.currentChapterSlug || '');

  const { data: bookData } = useGetBookByIdQuery(room?.bookId || '', { skip: !room?.bookId });
  
  const { data: chapterData, isLoading: isLoadingChapter } = useGetChapterQuery(
    { bookSlug: bookData?.slug || '', chapterSlug: currentChapterSlug },
    { skip: !bookData?.slug || !currentChapterSlug }
  );

  const chapter = chapterData?.chapter;
  const navigation = chapterData?.navigation;
  const { data: quotesData } = useGetRoomQuotesQuery({ code: roomCode }, { skip: !room || isEnded });

  useEffect(() => {
    if (quotesData) {
      useReadingRoomStore.getState().setQuotes(quotesData);
    }
  }, [quotesData]);

  useEffect(() => {
    if (isEnded && initialRoom) {
      useReadingRoomStore.getState().setRoom({
        ...initialRoom,
        highlights: initialRoom.highlights || [],
        chatMessages: initialRoom.chatMessages || [],
      });
    }
  }, [isEnded, initialRoom]);

  const [readingParagraphId, setReadingParagraphId] = useState<string | null>(null);

  let readingProgress = 0;
  if (chapter?.paragraphs?.length && readingParagraphId) {
    const index = chapter.paragraphs.findIndex(p => p.id === readingParagraphId);
    if (index >= 0) {
      readingProgress = Math.round(((index + 1) / chapter.paragraphs.length) * 100);
    }
  }

  const [transferHostOpen, setTransferHostOpen] = useState(false);
  const { isControlsVisible, showSettings, setShowSettings } = useReadingView();
  const [createPost] = useCreatePostMutation();

  const handleShareRoom = () => {
    if (!bookData || !chapter) return;
    openCreatePost({
      title: `Chia sẻ "${chapter.title}"`,
      contentPlaceholder: 'Chia sẻ cảm nghĩ của bạn về chương này...',
      defaultContent: `📖 Đang đọc cùng nhóm: ${bookData.title} - ${chapter.title}\n\n#${bookData.title.replace(/\s+/g, '')}`,
      defaultBookId: bookData.id,
      defaultBookTitle: bookData.title,
      onSubmit: async (data) => {
        if (!bookData?.id) return;
        try {
          await createPost({ bookId: bookData.id, content: data.content, images: data.images }).unwrap();
        } catch { /* silent */ }
      },
    });
  };

  const handleTransferHost = useCallback((newHostId?: string) => {
    leaveRoom(newHostId);
    router.push('/reading-rooms');
  }, [leaveRoom, router]);

  const { data: progressData } = useGetChapterProgressQuery(
    { bookId: bookData?.id || '', chapterId: chapter?.id || '' },
    { skip: !bookData?.id || !chapter?.id },
  );

  const savedProgress = progressData?.progress || 0;

  useEffect(() => {
    if (!chapter || savedProgress <= 0 || savedProgress >= 100) return;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScrollY = (savedProgress / 100) * docHeight;
    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
  }, [chapter?.id, savedProgress]);

  useRoomPresence(currentChapterSlug || 'unknown', sendHeartbeat, readingParagraphId, readingProgress, bookData?.id, chapter?.id);

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
          action={<Button onClick={() => router.push('/reading-rooms')}>Quay lại</Button>}
          iconClassName="text-red-500"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground relative transition-colors duration-300">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/main-background.jpg"
          alt="BG"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-10 dark:opacity-40"
        />
        <div className="absolute inset-0 bg-background/80 dark:bg-background/90"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <EmotionStream />
        
        {/* Mobile Horizontal Header */}
        <header className="sticky top-16 z-50 w-full border-b border-border bg-background transition-all sm:hidden">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/reading-rooms')}
                className="w-8 h-8 rounded-full hover:bg-muted text-muted-foreground shrink-0"
                title="Quay lại danh sách phòng"
              >
                <ChevronLeft size={18} />
              </Button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight">Phòng: {roomCode}</h1>
                  <button 
                    onClick={handleCopyCode}
                    className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-primary"
                    title="Sao chép mã phòng"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                  <Badge variant="outline" className="text-[10px] uppercase font-black px-2 py-0.5 bg-primary/5 text-primary border-primary/20">
                    {room?.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}
                  </Badge>
                  {isEnded && (
                    <Badge variant="outline" className="text-[10px] uppercase font-black px-2 py-0.5 bg-muted text-muted-foreground border-muted-foreground/30">
                      Đã kết thúc
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate max-w-[200px] font-medium">
                  {bookData?.title || 'Đang tải sách...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isEnded && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-2 mr-1">
                          {Object.values(presences).slice(0, 4).map(p =>
                            p.avatarUrl ? (
                              <img
                                key={p.userId}
                                src={p.avatarUrl}
                                alt="Avatar"
                                loading="lazy"
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full border-2 border-background"
                              />
                            ) : (
                              <div
                                key={p.userId}
                                className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[9px] font-bold"
                              >
                                {p.displayName.charAt(0).toUpperCase()}
                              </div>
                            )
                          )}
                          {Object.keys(presences).length > 4 && (
                            <div className="w-6 h-6 rounded-full border-2 border-background bg-muted text-[9px] font-bold flex items-center justify-center">
                              +{Object.keys(presences).length - 4}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 bg-background/50 border border-border px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span>{Object.keys(presences).length} online</span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl font-bold text-[10px]">Thành viên đang hiện diện</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <div className="flex items-center gap-2">
                {isHost && !isEnded && (
                  <>
                    <Button 
                      variant="outline"
                      size="sm" 
                      className={`${ROOM_BTN_BASE} border-primary/20 hover:bg-primary/5`}
                      onClick={() => {
                        const newMode = room?.mode === 'sync' ? 'free' : 'sync';
                        changeMode(newMode);
                      }}
                    >
                      {room?.mode === 'sync' ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs">Đồng bộ</span>
                        </>
                      ) : (
                        <>
                          <LockOpen className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Tự do</span>
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      size="sm" 
                      onClick={() => openConfirm({
                        title: "Kết thúc phòng đọc?",
                        description: "Hành động này sẽ đóng phòng đọc đối với tất cả mọi người. Bạn không thể hoàn tác thao tác này.",
                        confirmText: "Xác nhận kết thúc",
                        variant: "destructive",
                        onConfirm: () => {
                          endRoom();
                          setTimeout(() => {
                            store.dispatch(readingRoomsApi.util.invalidateTags(['MyRooms', 'MyHistory']));
                            router.refresh();
                          }, 300);
                        }
                      })}
                      className={`${ROOM_BTN_BASE} border-border/60 text-foreground hover:bg-accent/60`}
                    >
                      <LogOut size={15} />
                      <span className="text-xs">Kết thúc</span>
                    </Button>

                    <Button 
                      variant="outline"
                      size="sm" 
                      onClick={() => openConfirm({
                        title: "Xoá phòng đọc?",
                        description: "Hành động này sẽ xoá vĩnh viễn phòng đọc và tất cả dữ liệu liên quan (bình luận, phản hồi, trích dẫn, sự kiện). Không thể hoàn tác!",
                        confirmText: "Xác nhận xoá",
                        variant: "destructive",
                        onConfirm: () => {
                          deleteRoom();
                          store.dispatch(readingRoomsApi.util.invalidateTags(['MyRooms']));
                          router.push('/reading-rooms');
                        }
                      })}
                      className={`${ROOM_BTN_BASE} border-border/60 text-foreground hover:bg-accent/60`}
                    >
                      <Trash2 size={15} />
                      <span className="text-xs">Xoá</span>
                    </Button>
                  </>
                )}

                {!isHost && !isEnded && (
                  <>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background/50 text-xs font-medium">
                      {room?.mode === 'sync' ? (
                        <><Lock className="w-3 h-3 text-primary" /><span className="text-primary">Đồng bộ</span></>
                      ) : (
                        <><LockOpen className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">Tự do</span></>
                      )}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-background/50 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      <span className="hidden sm:inline">{roomCode}</span>
                    </button>
                  </>
                )}

                {!isEnded && isHost ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`${ROOM_BTN_BASE} hover:bg-destructive/10 hover:text-destructive`}
                    title="Chuyển quyền trưởng phòng"
                    onClick={() => setTransferHostOpen(true)}
                  >
                    <DoorOpen size={15} className="text-muted-foreground" />
                    <span className="text-xs hidden sm:inline">Chuyển quyền</span>
                  </Button>
                ) : isEnded && isHost ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className={`${ROOM_BTN_BASE} border-border/60 text-foreground hover:bg-accent/60`}
                    disabled={isReactivating}
                    onClick={async () => {
                      try {
                        const result = await reactivateRoom(roomCode).unwrap();
                        useReadingRoomStore.getState().setRoom(result);
                        toast.success('Phòng đã được mở lại!');
                        router.refresh();
                      } catch {
                        toast.error('Không thể mở lại phòng');
                      }
                    }}
                  >
                    {isReactivating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LockOpen size={15} />}
                    <span className="text-xs">{isReactivating ? 'Đang mở...' : 'Mở lại phòng'}</span>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        {/* Desktop Vertical Sidebar */}
        <TooltipProvider delayDuration={0}>
          <aside className="fixed left-0 top-16 bottom-0 w-16 border-r border-border bg-background flex-col items-center py-4 z-40 hidden sm:flex justify-between">
            {/* Top: Info & Actions */}
            <div className="flex flex-col gap-4 items-center w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => router.push('/reading-rooms')} className="w-10 h-10 rounded-full hover:bg-muted text-muted-foreground">
                    <ChevronLeft size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Quay lại danh sách</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={handleCopyCode} className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors group">
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="group-hover:text-primary" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-popover text-popover-foreground border border-border shadow-md py-2 px-3">
                  <p className="font-bold text-foreground">Phòng: {roomCode}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{bookData?.title}</p>
                </TooltipContent>
              </Tooltip>

              {isHost && !isEnded && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => changeMode(room?.mode === 'sync' ? 'free' : 'sync')}>
                      {room?.mode === 'sync' ? <Lock className="w-4 h-4 text-primary" /> : <LockOpen className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Chế độ: {room?.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}</TooltipContent>
                </Tooltip>
              )}

              {!isHost && !isEnded && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground bg-muted/50 cursor-default">
                      {room?.mode === 'sync' ? <Lock className="w-4 h-4 text-primary" /> : <LockOpen className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-semibold">{room?.mode === 'sync' ? 'Chế độ Đồng bộ' : 'Chế độ Tự do'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {room?.mode === 'sync' ? 'Chương đọc theo trưởng phòng' : 'Mỗi người đọc chương riêng'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Middle: Presence */}
            <div className="flex flex-col gap-6 items-center w-full">
              {!isEnded && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col -space-y-2 mt-2 items-center cursor-pointer">
                      {Object.values(presences).slice(0, 4).map(p =>
                        p.avatarUrl ? (
                          <img key={p.userId} src={p.avatarUrl} alt="Avatar" width={28} height={28} className="w-7 h-7 rounded-full border-2 border-background z-10 hover:z-20 relative" />
                        ) : (
                          <div key={p.userId} className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold z-10 hover:z-20 relative">
                            {p.displayName.charAt(0).toUpperCase()}
                          </div>
                        )
                      )}
                      {Object.keys(presences).length > 4 && (
                        <div className="w-7 h-7 rounded-full border-2 border-background bg-muted text-[9px] font-bold flex items-center justify-center z-10 relative">
                          +{Object.keys(presences).length - 4}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">{Object.keys(presences).length} thành viên đang online</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Bottom: Actions */}
            <div className="flex flex-col gap-4 items-center w-full">
              {isHost && !isEnded && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => openConfirm({
                        title: "Kết thúc phòng đọc?",
                        description: "Hành động này sẽ đóng phòng đọc đối với tất cả mọi người. Bạn không thể hoàn tác thao tác này.",
                        confirmText: "Xác nhận kết thúc",
                        variant: "destructive",
                        onConfirm: () => {
                          endRoom();
                          setTimeout(() => {
                            store.dispatch(readingRoomsApi.util.invalidateTags(['MyRooms', 'MyHistory']));
                            router.refresh();
                          }, 300);
                        }
                      })}>
                        <LogOut size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Kết thúc phòng</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => openConfirm({
                        title: "Xoá phòng đọc?",
                        description: "Hành động này sẽ xoá vĩnh viễn phòng đọc. Không thể hoàn tác!",
                        confirmText: "Xác nhận xoá",
                        variant: "destructive",
                        onConfirm: () => {
                          deleteRoom();
                          store.dispatch(readingRoomsApi.util.invalidateTags(['MyRooms']));
                          router.push('/reading-rooms');
                        }
                      })}>
                        <Trash2 size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Xoá phòng</TooltipContent>
                  </Tooltip>
                </>
              )}

              {!isEnded && isHost ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => setTransferHostOpen(true)}>
                      <DoorOpen size={18} className="text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Chuyển quyền</TooltipContent>
                </Tooltip>
              ) : isEnded && isHost ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" disabled={isReactivating} onClick={async () => {
                      try {
                        const result = await reactivateRoom(roomCode).unwrap();
                        useReadingRoomStore.getState().setRoom(result);
                        toast.success('Phòng đã được mở lại!');
                        router.refresh();
                      } catch {
                        toast.error('Không thể mở lại phòng');
                      }
                    }}>
                      {isReactivating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LockOpen size={18} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Mở lại phòng</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </aside>
        </TooltipProvider>

        <div className="flex-1 flex flex-col sm:ml-16">
          {!isEnded && <ProgressRadar />}

          <main className="container mx-auto px-4 py-8 flex-1">
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
            
            <div className="flex-1 w-full max-w-3xl mx-auto lg:mx-0">
              {isLoadingChapter ? (
                <div className="min-h-[400px]">
                  <LoadingOverlay>Đang tải nội dung chương...</LoadingOverlay>
                </div>
              ) : chapter && bookData ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="mb-8 pb-8 border-b border-border">
                    <ChapterNavigation
                      hasPrevious={!!navigation?.previous && (isEnded || room?.mode === 'free' || isHost)}
                      hasNext={!!navigation?.next && (isEnded || room?.mode === 'free' || isHost)}
                      onPrevious={() => {
                        if (navigation?.previous) {
                          if (!isEnded && room?.mode === 'sync' && isHost) {
                            changeChapter(navigation.previous.slug, bookData?.id);
                          } else {
                            router.push(`/reading-rooms/${roomCode}?chapter=${navigation.previous.slug}`);
                          }
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      onNext={() => {
                        if (navigation?.next) {
                          if (!isEnded && room?.mode === 'sync' && isHost) {
                            changeChapter(navigation.next.slug, bookData?.id);
                          } else {
                            router.push(`/reading-rooms/${roomCode}?chapter=${navigation.next.slug}`);
                          }
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                    />
                  </div>
                  
                  <ChapterContent
                    paragraphs={chapter.paragraphs}
                    chapterId={chapter.id}
                    bookId={bookData.id}
                    bookSlug={bookData.slug}
                    bookCoverImage={bookData.coverUrl}
                    bookTitle={bookData.title}
                    onActiveParagraphChange={setReadingParagraphId}
                  />

                  
                  <div className="mt-12 pt-12 border-t border-border pb-20">
                    <ChapterNavigation
                      hasPrevious={!!navigation?.previous && (isEnded || room?.mode === 'free' || isHost)}
                      hasNext={!!navigation?.next && (isEnded || room?.mode === 'free' || isHost)}
                      onPrevious={() => {
                        if (navigation?.previous) {
                          if (!isEnded && room?.mode === 'sync' && isHost) {
                            changeChapter(navigation.previous.slug, bookData?.id);
                          } else {
                            router.push(`/reading-rooms/${roomCode}?chapter=${navigation.previous.slug}`);
                          }
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      onNext={() => {
                        if (navigation?.next) {
                          if (!isEnded && room?.mode === 'sync' && isHost) {
                            changeChapter(navigation.next.slug, bookData?.id);
                          } else {
                            router.push(`/reading-rooms/${roomCode}?chapter=${navigation.next.slug}`);
                          }
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-card/50 backdrop-blur-sm border border-dashed border-border rounded-3xl">
                  <Info className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-lg font-medium">Không thể tải nội dung chương</p>
                  <p className="text-sm text-muted-foreground mt-1">Vui lòng kiểm tra lại kết nối hoặc quay lại sau.</p>
                  <Button variant="outline" className="mt-6" onClick={() => router.refresh()}>Thử lại</Button>
                </div>
              )}
            </div>

            <aside className="w-full lg:w-80 sticky top-28 shrink-0 space-y-6 hidden sm:block">
              <Tabs defaultValue="activity" className="w-full">
                <TabsList variant="glass" className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="activity" className="rounded-xl flex justify-center lg:justify-start items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary data-[state=active]:text-primary bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors">
                    <Info className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">HĐ</span>
                  </TabsTrigger>
                  <TabsTrigger value="members" className="rounded-xl flex justify-center lg:justify-start items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary data-[state=active]:text-primary bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors">
                    <Users className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">TV</span>
                  </TabsTrigger>
                  <TabsTrigger value="quotes" className="rounded-xl flex justify-center lg:justify-start items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary data-[state=active]:text-primary bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors">
                    <span className="text-sm leading-none">&ldquo;</span>
                    <span className="hidden lg:inline">TD</span>
                  </TabsTrigger>
                  <TabsTrigger value="knowledge" className="rounded-xl flex justify-center lg:justify-start items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary data-[state=active]:text-primary bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors">
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">KT</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="mt-0 outline-none">
                  <RoomChat sendChatMessage={sendChatMessage} disabled={isEnded} />
                </TabsContent>

                <TabsContent value="members" className="mt-0 outline-none">
                  <GlassCard 
                    header={
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold tracking-tight uppercase">Thành viên</h3>
                        {!isEnded && (
                          <Badge variant="secondary" className="text-[10px] font-bold">
                            {Object.keys(presences).length}
                          </Badge>
                        )}
                      </div>
                    }
                  >
                    
                    <div className="p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                      {isEnded ? (
                        <div className="py-8 text-center text-xs text-muted-foreground italic">
                          Phòng đã kết thúc
                        </div>
                      ) : Object.values(presences).length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground italic">
                          Đang đợi mọi người...
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {Object.values(presences).map(p => (
                            <div 
                              key={p.userId} 
                              className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors group relative"
                            >
                               <ReadingProgress
                                 userId={p.userId}
                                 displayName={p.displayName}
                                 avatarUrl={p.avatarUrl}
                               />
                              
                              <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                                  {p.displayName}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate opacity-70">
                                  Chương: {p.currentChapterSlug}
                                </p>
                              </div>

                              <TooltipProvider>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="w-7 h-7 rounded-full hover:bg-primary/10 hover:text-primary"
                                        onClick={() => router.push(`/reading-rooms/${roomCode}?chapter=${p.currentChapterSlug}`)}
                                      >
                                        <BookOpen size={14} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs font-medium">Đến chương này</TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="w-7 h-7 rounded-full hover:bg-primary/10 hover:text-primary"
                                        onClick={() => router.push(`/users/${p.userId}`)}
                                      >
                                        <User size={14} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs font-medium">Xem hồ sơ</TooltipContent>
                                  </Tooltip>

                                  {isHost && p.userId !== user?.id && !isEnded && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="w-7 h-7 rounded-full hover:bg-amber-500/10 text-amber-500 hover:text-amber-600"
                                          onClick={() => {
                                            openConfirm({
                                              title: "Chuyển quyền trưởng phòng?",
                                              description: `Bạn sắp chuyển quyền trưởng phòng cho ${p.displayName}. LƯU Ý: Chuyển quyền xong bạn sẽ tự động rời khỏi phòng. Bạn có chắc chắn?`,
                                              confirmText: "Xác nhận chuyển & Rời phòng",
                                              onConfirm: () => {
                                                leaveRoom(p.userId);
                                                router.push('/reading-rooms');
                                              }
                                            });
                                          }}
                                        >
                                          <Crown size={14} />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="text-xs font-medium text-amber-500">Chuyển quyền Host</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TooltipProvider>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </TabsContent>

                <TabsContent value="quotes" className="mt-0 outline-none">
                  <GlassCard 
                    header={
                      <div className="flex items-center gap-2">
                        <span className="text-sm leading-none text-primary">&ldquo;</span>
                        <h3 className="text-sm font-bold tracking-tight uppercase">Trích dẫn</h3>
                      </div>
                    }
                  >
                    <div className="p-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                      <QuoteBoard currentChapterSlug={currentChapterSlug} roomCode={roomCode} />
                    </div>
                  </GlassCard>
                </TabsContent>

                <TabsContent value="knowledge" className="mt-0 outline-none">
                  {chapter?.id ? (
                    <KnowledgeSidebar 
                      bookSlug={bookData?.slug || ''} 
                      chapterId={chapter.id} 
                      roomId={roomCode}
                    />

                  ) : (

                    <GlassCard className="p-12 text-center">
                      <p className="text-xs text-muted-foreground italic">Đang tải kiến thức...</p>
                    </GlassCard>
                  )}
                </TabsContent>

              </Tabs>
              
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

      {/* Floating Reading Dock */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ${
          isControlsVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-24 opacity-0'
        }`}
      >
        <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-background/90 backdrop-blur-xl border border-border shadow-2xl">
          <DockButton
            icon={<ChevronLeftIcon size={20} />}
            label="Chương trước"
            disabled={!navigation?.previous || (!isEnded && room?.mode === 'sync' && !isHost)}
            onClick={() => {
              if (navigation?.previous) {
                if (!isEnded && room?.mode === 'sync' && isHost) changeChapter(navigation.previous.slug, bookData?.id);
                else router.push(`/reading-rooms/${roomCode}?chapter=${navigation.previous.slug}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />
          <DockButton
            icon={<ChevronRightIcon size={20} />}
            label="Chương sau"
            disabled={!navigation?.next || (!isEnded && room?.mode === 'sync' && !isHost)}
            onClick={() => {
              if (navigation?.next) {
                if (!isEnded && room?.mode === 'sync' && isHost) changeChapter(navigation.next.slug, bookData?.id);
                else router.push(`/reading-rooms/${roomCode}?chapter=${navigation.next.slug}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />
          <div className="w-px h-6 bg-border mx-1" />
          <DockButton
            icon={<Settings size={20} />}
            label="Cài đặt đọc"
            onClick={() => setShowSettings(true)}
          />
          <div className="w-px h-6 bg-border mx-1" />
          <DockButton
            icon={<Bookmark size={20} />}
            label="Lưu vào thư viện"
            disabled={!bookData}
            onClick={() => bookData && openAddToLibrary({ bookId: bookData.id })}
          />
          <DockButton
            icon={<Share2 size={20} />}
            label="Chia sẻ"
            disabled={!chapter}
            onClick={handleShareRoom}
          />
        </div>
      </div>

      <ReadingSettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <TransferHostModal
        open={transferHostOpen}
        onOpenChange={setTransferHostOpen}
        onConfirm={handleTransferHost}
      />
    </div>
  );
}
