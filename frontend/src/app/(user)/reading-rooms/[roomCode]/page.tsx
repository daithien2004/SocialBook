'use client';
import { use } from 'react';
import { useGetRoomQuery } from '@/features/reading-rooms/api/readingRoomsApi';
import { useReadingRoomSocket } from '@/features/reading-rooms/hooks/useReadingRoomSocket';
import { useAppAuth } from '@/features/auth/hooks';
import { useRoomPresence } from '@/features/reading-rooms/hooks/useRoomPresence';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { useGetBookByIdQuery } from '@/features/books/api/bookApi';
import { useGetChapterQuery } from '@/features/chapters/api/chaptersApi';
import { ChapterContent } from '@/components/chapter/ChapterContent';
import ChapterNavigation from '@/components/chapter/ChapterNavigation';
import { Loader2, Users, LogOut, Info, Copy, Check, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';
import { KnowledgeSidebar } from '@/features/reading-rooms/components/KnowledgeSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function ReadingRoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast.success('Đã sao chép mã phòng!');
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Fetch initial room info
  const { data: initialRoom, isLoading: isLoadingRoom, error } = useGetRoomQuery(roomCode);
  
  // Connect socket
  const { endRoom, leaveRoom, changeChapter, changeMode, sendHeartbeat, askAI, sendChatMessage } = useReadingRoomSocket(roomCode);

  
  const { user } = useAppAuth();
  const storeRoom = useReadingRoomStore(state => state.room);
  const room = storeRoom || initialRoom;
  const isHost = room?.hostId === user?.id;
  const presences = useReadingRoomStore(state => state.presences);
  const members = useReadingRoomStore(state => state.members);

  // Independent navigation: Use URL search param if available, but respect SYNC mode
  const currentChapterSlug = room?.mode === 'sync' 
    ? room?.currentChapterSlug || ''
    : (searchParams.get('chapter') || room?.currentChapterSlug || '');

  // Fetch book to get bookSlug
  const { data: bookData } = useGetBookByIdQuery(room?.bookId || '', { skip: !room?.bookId });
  
  // Fetch chapter content
  const { data: chapterData, isLoading: isLoadingChapter } = useGetChapterQuery(
    { bookSlug: bookData?.slug || '', chapterSlug: currentChapterSlug },
    { skip: !bookData?.slug || !currentChapterSlug }
  );

  const chapter = chapterData?.chapter;
  const navigation = chapterData?.navigation;

  // Send heartbeats
  useRoomPresence(currentChapterSlug || 'unknown', null, sendHeartbeat);

  if (isLoadingRoom) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p>Đang kết nối vào phòng...</p>
      </div>
    );
  }

  if (error || !initialRoom) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4">
        <h2 className="text-2xl font-bold text-red-500">Không tìm thấy phòng</h2>
        <p className="text-muted-foreground">Phòng không tồn tại hoặc đã kết thúc.</p>
        <Button onClick={() => router.push('/reading-rooms')}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground relative transition-colors duration-300">
      {/* Fixed Background (Shared with ChapterPage) */}
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
        {/* Header - Glassmorphism */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/60 backdrop-blur-xl">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
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
                  <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">
                    {room?.mode || 'SYNC'}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                  {bookData?.title || 'Đang tải sách...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 bg-muted/50 border border-border px-3 py-1.5 rounded-full text-xs font-medium">
                      <Users className="w-3.5 h-3.5" />
                      <span>{Object.keys(presences).length} đang online</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Người dùng đang online</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex items-center gap-2">
                {isHost && (
                  <>
                    <Button 
                      variant="outline"
                      size="sm" 
                      className="font-bold px-4 h-9"
                      onClick={() => {
                        const newMode = room?.mode === 'sync' ? 'free' : 'sync';
                        changeMode(newMode);
                      }}
                    >
                      {room?.mode === 'sync' ? '🔒 Đồng bộ' : '🔓 Tự do'}
                    </Button>
                    
                    <Button 
                      size="sm" 
                      className="font-bold px-4 h-9 bg-orange-500/90 hover:bg-orange-600 text-white border-0"
                      onClick={() => {
                        if (confirm('Bạn có chắc chắn muốn kết thúc phòng đọc này cho tất cả mọi người?')) {
                          endRoom();
                          router.push('/reading-rooms');
                        }
                      }}
                    >
                      <LogOut size={16} className="mr-2" />
                      Kết thúc phòng
                    </Button>
                  </>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="font-bold px-4 h-9 border-2"
                  onClick={() => {
                    leaveRoom();
                    router.push('/reading-rooms');
                  }}
                >
                  <Info size={16} className="mr-2" />
                  Rời phòng
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
            
            {/* Left/Main Column: Reading Content */}
            <div className="flex-1 w-full max-w-3xl mx-auto lg:mx-0">
              {isLoadingChapter ? (
                <div className="min-h-[400px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Đang tải nội dung chương...</p>
                  </div>
                </div>
              ) : chapter && bookData ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <ChapterContent
                    paragraphs={chapter.paragraphs}
                    chapterId={chapter.id}
                    bookId={bookData.id}
                    bookSlug={bookData.slug}
                    bookCoverImage={bookData.coverUrl}
                    bookTitle={bookData.title}
                  />

                  
                  <div className="mt-12 pt-12 border-t border-border pb-20">
                    <ChapterNavigation
                      hasPrevious={!!navigation?.previous && (room?.mode === 'free' || isHost)}
                      hasNext={!!navigation?.next && (room?.mode === 'free' || isHost)}
                      onPrevious={() => {
                        if (navigation?.previous) {
                          if (room?.mode === 'sync' && isHost) {
                            changeChapter(navigation.previous.slug);
                          } else {
                            router.push(`/reading-rooms/${roomCode}?chapter=${navigation.previous.slug}`);
                          }
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      onNext={() => {
                        if (navigation?.next) {
                          if (room?.mode === 'sync' && isHost) {
                            changeChapter(navigation.next.slug);
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

            {/* Right Column: Sticky Sidebar */}
            <aside className="w-full lg:w-80 sticky top-24 shrink-0 space-y-6 hidden sm:block">
              <Tabs defaultValue="members" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 rounded-2xl h-12 p-1 bg-background/40 backdrop-blur-xl border border-border shadow-sm">
                  <TabsTrigger value="members" className="rounded-xl flex items-center gap-2 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Users className="w-3.5 h-3.5" />
                    Thành viên
                  </TabsTrigger>
                  <TabsTrigger value="knowledge" className="rounded-xl flex items-center gap-2 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Kiến thức
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="mt-0 outline-none">
                  <div className="bg-background/40 backdrop-blur-xl border border-border rounded-3xl overflow-hidden shadow-xl">
                    <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                      <h3 className="text-sm font-bold tracking-tight uppercase">Thành viên</h3>
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {Object.keys(presences).length}
                      </Badge>
                    </div>
                    
                    <div className="p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                      {Object.values(presences).length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground italic">
                          Đang đợi mọi người...
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {Object.values(presences).map(p => (
                            <div 
                              key={p.userId} 
                              className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-muted/50 transition-colors group"
                            >
                              <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary overflow-hidden shadow-inner">
                                  {p.avatarUrl ? (
                                    <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    p.displayName.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                              </div>
                              
                              <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                                  {p.displayName}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate opacity-70">
                                  Chương: {p.currentChapterSlug}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="knowledge" className="mt-0 outline-none">
                  {chapter?.id ? (
                    <KnowledgeSidebar 
                      bookSlug={bookData?.slug || ''} 
                      chapterId={chapter.id} 
                      roomId={roomCode}
                      askAI={askAI}
                    />

                  ) : (

                    <div className="p-12 text-center bg-background/40 backdrop-blur-xl border border-border rounded-3xl">
                      <p className="text-xs text-muted-foreground italic">Đang tải kiến thức...</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl">
                <h4 className="text-[10px] font-black uppercase text-primary mb-2">Thông báo phòng</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bạn đang ở chế độ <strong>{room?.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}</strong>. 
                  {room?.mode === 'sync' 
                    ? ' Chương sách sẽ được tự động lật khi trưởng phòng chuyển trang.' 
                    : ' Bạn có thể tự do đọc các chương khác nhau.'}
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
