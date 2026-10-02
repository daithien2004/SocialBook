'use client';

import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { bookQueries } from '@/features/books/api/books.queries';
import { readingRoomQueries } from '@/features/reading-rooms/api/reading-rooms.queries';
import { useCreateRoom, useReactivateRoom } from '@/features/reading-rooms/api/reading-rooms.mutations';
import { chaptersQueries } from '@/features/chapters/api/chapters.queries';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppAuth } from '@/features/auth/hooks';
import LoginWall from '@/features/auth/components/LoginWall';
import { BookOpen, History, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FullScreenSpinner } from '@/components/shared/AppLoading';
import type { BookSummary } from '@/features/books/schemas/book.schema';

import { ActiveRoomsTab } from './hub-tabs/ActiveRoomsTab';
import { HistoryRoomsTab } from './hub-tabs/HistoryRoomsTab';
import { CreateRoomTab } from './hub-tabs/CreateRoomTab';

export function ReadingRoomsHubClient() {
  const [roomCode, setRoomCode] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [openSearchBook, setOpenSearchBook] = useState(false);
  const [maxMembers, setMaxMembers] = useState(10);
  const [activeTab, setActiveTab] = useState('active');
  const createRoom = useCreateRoom();
  const isLoading = createRoom.isPending;
  const { data: booksData, isLoading: isBooksLoading } = useQuery(bookQueries.list({ page: 1, limit: 100 }));
  const { data: myRooms, isLoading: isMyRoomsLoading } = useQuery({ ...readingRoomQueries.myActive() });
  const { data: myHistory, isLoading: isHistoryLoading } = useQuery({ ...readingRoomQueries.myHistory() });
  const reactivateRoom = useReactivateRoom();
  const isReactivating = reactivateRoom.isPending;
  const { user, isAuthenticated, isLoading: isLoadingAuth } = useAppAuth();
  const router = useRouter();

  const selectedBookData = booksData?.data.find((b: BookSummary) => b.id === selectedBook);
  const hasNoChapters = selectedBookData && (!selectedBookData.stats?.chapterCount || selectedBookData.stats.chapterCount === 0);

  const { data: chaptersData } = useQuery({
    ...chaptersQueries.list({ bookSlug: selectedBookData?.slug || '' }),
    enabled: !!selectedBookData?.slug,
  });

  if (isLoadingAuth) {
    return <FullScreenSpinner />;
  }

  if (!isAuthenticated) {
    return (
      <LoginWall
        title="Phòng đọc sách cùng nhau"
        description="Đăng nhập để tạo hoặc tham gia phòng đọc và chia sẻ trải nghiệm đọc sách cùng bạn bè."
        secondaryLabel="Khám phá sách trước"
        secondaryHref="/books"
      />
    );
  }

  const handleCreate = async () => {
    if (!selectedBook) {
      toast.error('Vui lòng chọn một cuốn sách để đọc chung');
      return;
    }
    if (hasNoChapters) {
      toast.error('Sách này chưa có chương nào. Không thể tạo phòng đọc.');
      return;
    }
    try {
      const firstChapterSlug = chaptersData?.chapters?.[0]?.slug || 'chuong-1';
      const res = await createRoom.mutateAsync({
        bookId: selectedBook,
        currentChapterSlug: firstChapterSlug,
        mode: 'sync',
        maxMembers,
      });
      toast.success('Tạo phòng thành công!');
      router.push(`/reading-rooms/${res.roomId}`);
    } catch {
      toast.error('Không thể tạo phòng đọc');
    }
  };

  const handleJoin = () => {
    if (!roomCode) {
      toast.error('Vui lòng nhập mã phòng');
      return;
    }
    router.push(`/reading-rooms/${roomCode.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative transition-colors duration-300">
      {/* HERO BANNER */}
      <div className="relative w-full h-[30vh] min-h-[260px] max-h-[350px] flex items-center justify-center overflow-hidden bg-primary/5 dark:bg-black border-b border-border/40">
        <Image
          src="/main-background.jpg"
          alt="Background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-10 dark:opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background dark:from-black/50 dark:via-black/70 dark:to-background" />
        <div className="relative z-10 text-center w-full max-w-3xl px-4 flex flex-col items-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight drop-shadow-sm">
            Phòng Đọc Cùng Nhau
          </h1>
          <p className="text-muted-foreground mb-8 text-sm md:text-base font-medium max-w-xl drop-shadow-sm">
            Đọc sách đồng bộ, thảo luận cùng bạn bè trong thời gian thực. Tham gia ngay!
          </p>
          <div className="w-full max-w-xl shadow-2xl rounded-full bg-background p-1.5 flex items-center gap-2">
            <div className="flex-1 relative flex items-center">
              <Input
                placeholder="Nhập mã phòng để tham gia..."
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                className="block w-full pl-5 pr-10 py-4 h-12 rounded-full bg-background border border-border text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 shadow-lg backdrop-blur-sm transition-all text-base placeholder:normal-case placeholder:tracking-normal"
                maxLength={6}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleJoin();
                }}
              />
              {roomCode && (
                <button
                  type="button"
                  onClick={() => setRoomCode('')}
                  className="absolute right-4 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <Button
              size="lg"
              className="rounded-full shrink-0 px-6 font-semibold"
              onClick={handleJoin}
            >
              Vào phòng
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-4 md:px-8 py-8 lg:py-10 relative z-10 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList variant="underline" className="mb-8">
            <TabsTrigger value="active" variant="underline" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Đang hoạt động
            </TabsTrigger>
            <TabsTrigger value="history" variant="underline" className="gap-2">
              <History className="w-4 h-4" />
              Lịch sử
            </TabsTrigger>
            <TabsTrigger value="create" variant="underline" className="gap-2">
              <Plus className="w-4 h-4" />
              Tạo phòng mới
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0">
            <ActiveRoomsTab 
              isMyRoomsLoading={isMyRoomsLoading}
              myRooms={myRooms}
              booksData={booksData}
              setActiveTab={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <HistoryRoomsTab 
              isHistoryLoading={isHistoryLoading}
              myHistory={myHistory}
              booksData={booksData}
              user={user}
              isReactivating={isReactivating}
              reactivateRoom={reactivateRoom}
            />
          </TabsContent>

          <TabsContent value="create" className="mt-0">
            <CreateRoomTab 
              selectedBook={selectedBook}
              setSelectedBook={setSelectedBook}
              openSearchBook={openSearchBook}
              setOpenSearchBook={setOpenSearchBook}
              maxMembers={maxMembers}
              setMaxMembers={setMaxMembers}
              handleCreate={handleCreate}
              isLoading={isLoading}
              isBooksLoading={isBooksLoading}
              booksData={booksData}
              hasNoChapters={!!hasNoChapters}
              selectedBookData={selectedBookData}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
