'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import Image from 'next/image';
import { useGetBooksQuery } from '@/features/books/api/bookApi';
import { useCreateRoomMutation, useGetMyActiveRoomsQuery, useGetMyHistoryQuery, useReactivateRoomMutation } from '@/features/reading-rooms/api/readingRoomsApi';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppAuth } from '@/features/auth/hooks';
import LoginWall from '@/components/auth/LoginWall';
import { BookOpen, History, Plus, ArrowRight, Users, RefreshCw, Check, ChevronsUpDown, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

function RoomCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex">
          <Skeleton className="w-20 h-28 rounded-l-xl rounded-r-none shrink-0" />
          <div className="p-4 flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReadingRoomsHub() {
  const [roomCode, setRoomCode] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [openSearchBook, setOpenSearchBook] = useState(false);
  const [maxMembers, setMaxMembers] = useState(10);
  const [activeTab, setActiveTab] = useState('active');
  const [createRoom, { isLoading }] = useCreateRoomMutation();
  const { data: booksData, isLoading: isBooksLoading } = useGetBooksQuery({ page: 1, limit: 100 });
  const { data: myRooms, isLoading: isMyRoomsLoading } = useGetMyActiveRoomsQuery();
  const { data: myHistory, isLoading: isHistoryLoading } = useGetMyHistoryQuery();
  const [reactivateRoom, { isLoading: isReactivating }] = useReactivateRoomMutation();
  const { user, isAuthenticated, isLoading: isLoadingAuth } = useAppAuth();
  const router = useRouter();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-brand border-t-transparent animate-spin"></div>
      </div>
    );
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

  const selectedBookData = booksData?.data.find(b => b.id === selectedBook);
  const hasNoChapters = selectedBookData && (!selectedBookData.stats?.chapterCount || selectedBookData.stats.chapterCount === 0);

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
      const res = await createRoom({
        bookId: selectedBook,
        currentChapterSlug: 'chuong-1',
        mode: 'sync',
        maxMembers,
      }).unwrap();
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
      <div className="relative w-full h-[30vh] min-h-[260px] max-h-[350px] flex items-center justify-center overflow-hidden bg-slate-900 dark:bg-black">
        <Image
          src="/main-background.jpg"
          alt="Background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40 dark:opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-black/20 dark:bg-black/50" />
        <div className="relative z-10 text-center w-full max-w-3xl px-4 flex flex-col items-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
            Phòng Đọc Cùng Nhau
          </h1>
          <p className="text-white/90 mb-8 text-sm md:text-base font-medium max-w-xl drop-shadow-sm">
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

          {/* Active Rooms Tab */}
          <TabsContent value="active" className="mt-0">
            {isMyRoomsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <RoomCardSkeleton key={`room-skeleton-${i}`} />)}
              </div>
            ) : myRooms && myRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myRooms.map((room) => {
                  const book = booksData?.data.find(b => b.id === room.bookId);
                  return (
                    <Card
                      key={room.roomId}
                      className="group relative h-full cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 overflow-hidden bg-card"
                      onClick={() => router.push(`/reading-rooms/${room.roomId}`)}
                    >
                      <CardContent className="p-0 flex items-stretch h-full">
                        <div className="w-24 shrink-0 bg-muted relative overflow-hidden min-h-[128px]">
                          {book?.coverUrl ? (
                            <Image
                              src={book.coverUrl}
                              alt={book.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="96px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                        </div>
                        <div className="p-4 flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono text-[10px] h-5 bg-background">
                              #{room.roomId}
                            </Badge>
                            <Badge variant={room.mode === 'sync' ? 'default' : 'secondary'} className="text-[10px] h-5">
                              {room.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors mb-1">
                            {book?.title || 'Đang tải sách...'}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 line-clamp-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            Đang đọc: {room.currentChapterSlug}
                          </p>
                        </div>
                        <div className="pr-4 shrink-0 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 duration-300">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed bg-card/50">
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-1">Chưa có phòng nào</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Bạn chưa tham gia phòng đọc nào. Tạo phòng mới hoặc nhập mã để tham gia!
                    </p>
                    <Button variant="outline" onClick={() => setActiveTab('create')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Tạo phòng ngay
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-0">
            {isHistoryLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={`history-skeleton-${i}`}>
                    <CardContent className="p-0 flex">
                      <Skeleton className="w-16 h-20 rounded-l-xl rounded-r-none shrink-0" />
                      <div className="p-3 flex-1 space-y-2">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <div className="p-3 flex items-center gap-2">
                        <Skeleton className="h-8 w-16 rounded-lg" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myHistory && myHistory.items.length > 0 ? (
              <div className="space-y-2">
                {myHistory.items.map((room) => {
                  const book = booksData?.data.find(b => b.id === room.bookId);
                  const isHost = room.hostId === user?.id;
                  return (
                    <Card
                      key={room.roomId}
                      className="group h-full transition-all hover:shadow-md hover:bg-muted/30 border-border/60 overflow-hidden"
                    >
                      <CardContent className="p-0 flex items-stretch h-full">
                        <div className="w-20 shrink-0 bg-muted relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500 opacity-80 group-hover:opacity-100 min-h-[112px]">
                          {book?.coverUrl ? (
                            <Image
                              src={book.coverUrl}
                              alt={book.title}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <History className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 px-5 py-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-mono text-xs text-muted-foreground">
                              #{room.roomId}
                            </span>
                            <Badge variant="secondary" className="text-[10px] h-5 bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20 border-0">
                              Đã kết thúc
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-medium border-l border-border pl-2">
                              {room.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}
                            </span>
                          </div>
                          <p className="font-semibold text-base truncate group-hover:text-foreground transition-colors text-muted-foreground">
                            {book?.title || 'Đã đọc chung...'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 hover:bg-background"
                            onClick={() => router.push(`/reading-rooms/${room.roomId}`)}
                          >
                            <ArrowRight className="w-4 h-4 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                            Xem
                          </Button>
                          {isHost && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                              disabled={isReactivating}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await reactivateRoom(room.roomId).unwrap();
                                  toast.success('Đã mở lại phòng đọc!');
                                } catch {
                                  toast.error('Không thể mở lại phòng');
                                }
                              }}
                            >
                              <RefreshCw className={cn("w-4 h-4 mr-2 text-primary", isReactivating && "animate-spin")} />
                              {isReactivating ? 'Đang mở...' : 'Mở lại'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed bg-card/50">
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <History className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-1">Chưa có lịch sử</h3>
                    <p className="text-sm text-muted-foreground">
                      Bạn chưa tham gia phòng đọc nào trước đây.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Create Room Tab */}
          <TabsContent value="create" className="mt-0">
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="grid lg:grid-cols-2">
                {/* Cột trái: Form */}
                <div className="p-6 md:p-8 space-y-8 bg-card">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                      <Plus className="w-6 h-6 text-primary" />
                      Tạo phòng đọc mới
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Lựa chọn sách và số lượng người tham gia để bắt đầu hành trình đọc sách cùng bạn bè.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        Chọn sách
                      </label>
                      <Popover open={openSearchBook} onOpenChange={setOpenSearchBook}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openSearchBook}
                            disabled={isBooksLoading}
                            className="w-full justify-between h-12 bg-muted/30 font-normal"
                          >
                            {isBooksLoading ? (
                              <span className="text-muted-foreground">Đang tải...</span>
                            ) : selectedBook ? (
                              <span className="truncate pr-4">
                                {booksData?.data.find((b) => b.id === selectedBook)?.title}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Tìm sách bạn muốn đọc chung...</span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Tìm tên sách..." className="h-11" />
                            <CommandList className="max-h-[300px]">
                              <CommandEmpty>Không tìm thấy sách nào.</CommandEmpty>
                              <CommandGroup>
                                {booksData?.data.map((book) => {
                                  const noChapters = !book.stats?.chapterCount || book.stats.chapterCount === 0;
                                  return (
                                    <CommandItem
                                      key={book.id}
                                      value={`${book.id} ${book.title}`}
                                      disabled={noChapters}
                                      onSelect={(currentValue) => {
                                        // commanditem value is lowercased string. We use ID for state
                                        setSelectedBook(currentValue === selectedBook ? "" : book.id);
                                        setOpenSearchBook(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 shrink-0",
                                          selectedBook === book.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <span className="truncate pr-2">{book.title}</span>
                                      {noChapters && (
                                        <Badge variant="outline" className="ml-auto text-[10px] h-4 px-1 text-muted-foreground shrink-0">
                                          Chưa có chương
                                        </Badge>
                                      )}
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          Số người tham gia tối đa
                        </label>
                        <div className="bg-primary text-primary-foreground font-bold px-3 py-1 rounded-full text-sm shadow-sm">
                          {maxMembers} người
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {[2, 5, 10, 20].map((num) => (
                          <Button
                            key={num}
                            variant={maxMembers === num ? "default" : "outline"}
                            size="sm"
                            className="rounded-full flex-1 h-8 text-xs font-medium"
                            onClick={() => setMaxMembers(num)}
                          >
                            {num} người
                          </Button>
                        ))}
                      </div>

                      <div className="pt-2 px-2">
                        <Slider
                          min={2}
                          max={20}
                          step={1}
                          value={[maxMembers]}
                          onValueChange={([v]) => setMaxMembers(v)}
                          className="w-full cursor-pointer [&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-wider">
                          <span>Ít người (2)</span>
                          <span>Đông đúc (20)</span>
                        </div>
                      </div>

                      <div className="mt-3 bg-info/10 text-info p-2.5 rounded-lg text-xs flex items-start gap-2">
                        <span className="text-[10px] mt-0.5">💡</span>
                        <p>
                          <strong>Mẹo:</strong> Phòng từ 5-10 người thường mang lại trải nghiệm đọc và thảo luận tập trung nhất!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      size="lg"
                      className="w-full h-12 text-base font-bold shadow-md hover:shadow-lg transition-all"
                      onClick={handleCreate}
                      disabled={isLoading || !selectedBook || hasNoChapters}
                    >
                      {isLoading ? 'Đang tạo phòng...' : hasNoChapters ? 'Sách chưa có chương' : (
                        <>
                          <Users className="w-5 h-5 mr-2" />
                          Mở Phòng Ngay
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Cột phải: Live Preview */}
                <div className="bg-muted/30 p-6 md:p-8 flex items-center justify-center border-l border-border/50">
                  {selectedBookData ? (
                    <div className="w-full max-w-sm">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 text-center">
                        Phòng đọc của bạn sẽ có diện mạo
                      </p>
                      <Card className="overflow-hidden shadow-xl border-border/60 bg-background/50 backdrop-blur-sm group">
                        <div className="aspect-[3/4] relative w-full bg-muted">
                          {selectedBookData.coverUrl ? (
                            <Image
                              src={selectedBookData.coverUrl}
                              alt={selectedBookData.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, 384px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <Badge className="bg-destructive/90 hover:bg-destructive text-destructive-foreground border-0 mb-3 backdrop-blur-md">
                              Live
                            </Badge>
                            <h3 className="text-2xl font-bold mb-2 line-clamp-2 drop-shadow-md">
                              {selectedBookData.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                              <span className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-md backdrop-blur-md">
                                <Users className="w-4 h-4" />
                                1 / {maxMembers}
                              </span>
                              <span className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-md backdrop-blur-md">
                                <BookOpen className="w-4 h-4" />
                                {selectedBookData.stats?.chapterCount || 0} chương
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <div className="w-full max-w-sm text-center">
                      <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6 shadow-inner">
                        <BookOpen className="w-10 h-10 text-muted-foreground/40" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Chưa chọn sách</h3>
                      <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                        Bảng xem trước sẽ hiển thị ở đây sau khi bạn chọn một cuốn sách.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
