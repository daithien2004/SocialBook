'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import Image from 'next/image';
import { useGetBooksQuery } from '@/features/books/api/bookApi';
import { useCreateRoomMutation, useGetMyActiveRoomsQuery, useGetMyHistoryQuery, useReactivateRoomMutation } from '@/features/reading-rooms/api/readingRoomsApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppAuth } from '@/features/auth/hooks';
import LoginWall from '@/components/auth/LoginWall';
import { BookOpen, History, Plus, LogIn, DoorOpen, ArrowRight, Users, RefreshCw } from 'lucide-react';
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
  const [maxMembers, setMaxMembers] = useState(10);
  const [activeTab, setActiveTab] = useState('active');
  const [createRoom, { isLoading }] = useCreateRoomMutation();
  const { data: booksData, isLoading: isBooksLoading } = useGetBooksQuery({ page: 1, limit: 100 });
  const { data: myRooms, isLoading: isMyRoomsLoading } = useGetMyActiveRoomsQuery();
  const { data: myHistory, isLoading: isHistoryLoading } = useGetMyHistoryQuery();
  const [reactivateRoom, { isLoading: isReactivating }] = useReactivateRoomMutation();
  const { user, isAuthenticated } = useAppAuth();
  const router = useRouter();

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
    <div className="min-h-screen bg-background pb-20 transition-colors duration-300 relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/main-background.jpg"
          alt="Background Texture"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-10 dark:opacity-40"
        />
        <div className="absolute inset-0 bg-white/80 dark:bg-[#0f0f0f]/70 transition-colors duration-300"></div>
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Phòng đọc
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Đọc sách đồng bộ, thảo luận cùng bạn bè trong thời gian thực.
          </p>
        </div>

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
                {[1, 2, 3].map(i => <RoomCardSkeleton key={i} />)}
              </div>
            ) : myRooms && myRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myRooms.map((room) => {
                  const book = booksData?.data.find(b => b.id === room.bookId);
                  return (
                    <Card
                      key={room.roomId}
                      className="group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border-border/60 overflow-hidden"
                      onClick={() => router.push(`/reading-rooms/${room.roomId}`)}
                    >
                      <CardContent className="p-0 flex">
                        <div className="w-20 shrink-0 bg-muted relative overflow-hidden">
                          {book?.coverUrl ? (
                            <Image
                              src={book.coverUrl}
                              alt={book.title}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="font-mono text-[10px] h-5">
                              #{room.roomId}
                            </Badge>
                            <Badge variant={room.mode === 'sync' ? 'default' : 'secondary'} className="text-[10px] h-5">
                              {room.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                            {book?.title || 'Đang đọc chung...'}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {room.currentChapterSlug}
                          </p>
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
                  <Card key={i}>
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
                      className="transition-all hover:shadow-sm border-border/60 overflow-hidden"
                    >
                      <CardContent className="p-0 flex items-center">
                        <div className="w-16 h-20 shrink-0 bg-muted relative overflow-hidden">
                          {book?.coverUrl ? (
                            <Image
                              src={book.coverUrl}
                              alt={book.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 px-4 py-3">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-xs text-muted-foreground">
                              #{room.roomId}
                            </span>
                            <Badge variant="secondary" className="text-[10px] h-4">
                              Đã kết thúc
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {room.mode === 'sync' ? 'Đồng bộ' : 'Tự do'}
                            </span>
                          </div>
                          <p className="font-medium text-sm truncate">
                            {book?.title || 'Đã đọc chung...'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 px-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => router.push(`/reading-rooms/${room.roomId}`)}
                          >
                            <ArrowRight className="w-4 h-4 mr-1" />
                            Xem
                          </Button>
                          {isHost && (
                            <Button
                              size="sm"
                              className="h-8"
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
                              <RefreshCw className="w-3 h-3 mr-1" />
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
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Plus className="w-5 h-5 text-primary" />
                      Tạo phòng mới
                    </CardTitle>
                    <CardDescription>
                      Chọn sách và bắt đầu đọc cùng bạn bè.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Chọn sách
                      </label>
                      <Select value={selectedBook} onValueChange={setSelectedBook} disabled={isBooksLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder={isBooksLoading ? 'Đang tải...' : 'Chọn một cuốn sách'} />
                        </SelectTrigger>
                        <SelectContent>
                          {booksData?.data.map((book) => {
                            const noChapters = !book.stats?.chapterCount || book.stats.chapterCount === 0;
                            return (
                              <SelectItem key={book.id} value={book.id} disabled={noChapters}>
                                <span className="flex items-center gap-2">
                                  {book.title}
                                  {noChapters && (
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground">
                                      Chưa có chương
                                    </Badge>
                                  )}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedBookData && (
                      <div className="flex gap-4 p-4 rounded-xl bg-muted/50">
                        <div className="w-16 h-24 rounded-lg overflow-hidden bg-muted relative shrink-0">
                          {selectedBookData.coverUrl ? (
                            <Image
                              src={selectedBookData.coverUrl}
                              alt={selectedBookData.title}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{selectedBookData.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {selectedBookData.description || 'Chưa có mô tả'}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="secondary" className="text-[10px] h-4">
                              {selectedBookData.stats?.chapterCount || 0} chương
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        Số người tối đa: <span className="font-bold text-primary">{maxMembers}</span>
                      </label>
                      <Slider
                        min={2}
                        max={20}
                        step={1}
                        value={[maxMembers]}
                        onValueChange={([v]) => setMaxMembers(v)}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>2</span>
                        <span>20</span>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleCreate}
                      disabled={isLoading || !selectedBook || hasNoChapters}
                    >
                      {isLoading ? 'Đang tạo...' : hasNoChapters ? 'Sách chưa có chương' : (
                        <>
                          <Users className="w-4 h-4 mr-2" />
                          Tạo phòng ngay
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <LogIn className="w-4 h-4 text-primary" />
                      Tham gia phòng
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Nhập mã phòng từ bạn bè.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Mã phòng"
                      value={roomCode}
                      onChange={e => setRoomCode(e.target.value)}
                      className="h-10 uppercase text-center tracking-widest font-mono text-base"
                      maxLength={6}
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleJoin}
                    >
                      <DoorOpen className="w-4 h-4 mr-2" />
                      Vào phòng
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
