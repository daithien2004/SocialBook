import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoomHistoryResponse } from '@/features/reading-rooms/api/reading-rooms.api';
import type {
  BookSummaryPage,
  BookSummary,
} from '@/features/books/schemas/book.schema';

export function HistoryRoomsTab({
  isHistoryLoading,
  myHistory,
  booksData,
  user,
  isReactivating,
  reactivateRoom,
}: {
  isHistoryLoading: boolean;
  myHistory?: RoomHistoryResponse;
  booksData?: BookSummaryPage;
  user?: { id: string } | null; // Duck typing
  isReactivating: boolean;
  reactivateRoom: { mutateAsync: (roomId: string) => Promise<unknown> };
}) {
  const router = useRouter();

  if (isHistoryLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
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
    );
  }

  if (myHistory && myHistory.data.length > 0) {
    return (
      <div className="space-y-2">
        {myHistory.data.map((room) => {
          const book = booksData?.data.find(
            (b: BookSummary) => b.id === room.bookId,
          );
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
                      alt={book.title || ''}
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
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20 border-0"
                    >
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
                          await reactivateRoom.mutateAsync(room.roomId);
                          toast.success('Đã mở lại phòng đọc!');
                        } catch {
                          toast.error('Không thể mở lại phòng');
                        }
                      }}
                    >
                      <RefreshCw
                        className={cn(
                          'w-4 h-4 mr-2 text-primary',
                          isReactivating && 'animate-spin',
                        )}
                      />
                      {isReactivating ? 'Đang mở...' : 'Mở lại'}
                    </Button>
                  )}
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
            <History className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">Chưa có lịch sử</h3>
          <p className="text-sm text-muted-foreground">
            Bạn chưa tham gia phòng đọc nào trước đây.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
