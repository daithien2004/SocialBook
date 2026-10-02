import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight, Plus } from 'lucide-react';
import type { RoomResponse } from '@/features/reading-rooms/api/reading-rooms.api';
import type { BookSummaryPage, BookSummary } from '@/features/books/schemas/book.schema';

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

export function ActiveRoomsTab({
  isMyRoomsLoading,
  myRooms,
  booksData,
  setActiveTab
}: {
  isMyRoomsLoading: boolean;
  myRooms?: RoomResponse[];
  booksData?: BookSummaryPage;
  setActiveTab: (val: string) => void;
}) {
  const router = useRouter();

  if (isMyRoomsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <RoomCardSkeleton key={`room-skeleton-${i}`} />)}
      </div>
    );
  }

  if (myRooms && myRooms.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myRooms.map((room) => {
          const book = booksData?.data.find((b: BookSummary) => b.id === room.bookId);
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
                      alt={book.title || ''}
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
    );
  }

  return (
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
  );
}
