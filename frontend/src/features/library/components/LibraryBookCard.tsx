import Link from 'next/link';
import { BookOpen, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SafeImage } from '@/components/shared/SafeImage';
import { LibraryItem, LibraryStatus } from '@/features/library/types/library.interface';
import { formatDate } from '@/lib/utils';

interface LibraryBookCardProps {
  item: LibraryItem;
  activeTab?: LibraryStatus;
  onRemove?: (e: React.MouseEvent, item: LibraryItem) => void;
  dateLabel?: string;
}

export function LibraryBookCard({
  item,
  activeTab = LibraryStatus.READING,
  onRemove,
  dateLabel = 'Cập nhật',
}: LibraryBookCardProps) {
  // CollectionDetail doesn't pass activeTab exactly but relies on item.status
  // So we use item.status if activeTab is not explicitly passed, or we just rely on item.status for 'READING'
  const effectiveStatus = activeTab || item.status;

  return (
    <Card className="group flex flex-col h-full overflow-hidden border-border/85 transition-all duration-500 hover:border-brand/40 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] bg-card text-foreground">
      {/* Book Cover */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        <SafeImage
          src={item.bookId.coverUrl}
          alt={item.bookId.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover transition-all duration-700 group-hover:scale-105 group-hover:opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-85" />

        {onRemove && (
          <button
            onClick={(e) => onRemove(e, item)}
            title="Gỡ khỏi bộ sưu tập này"
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-brand border border-white/10 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 duration-200 z-20 cursor-pointer shadow-md"
          >
            <X size={13} />
          </button>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[1px]">
          <Link
            href={`/books/${item.bookId.slug}`}
            className="px-4 py-2 bg-background text-foreground font-semibold text-xs rounded-full hover:bg-brand hover:text-brand-foreground shadow-md transition-all duration-300 scale-90 group-hover:scale-100"
          >
            Chi tiết truyện
          </Link>
        </div>
      </div>

      {/* Book Details */}
      <CardContent className="flex flex-col flex-1 p-4 pt-3 gap-1">
        <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground truncate">
          {item.bookId.authorName || 'Tác giả'}
        </p>
        <Link href={`/books/${item.bookId.slug}`}>
          <h3 className="font-semibold text-sm line-clamp-2 hover:text-brand transition-colors mb-2 min-h-[40px] leading-tight text-foreground">
            {item.bookId.title}
          </h3>
        </Link>

        {/* Reading Progress */}
        <div className="mt-auto border-t border-border pt-3 w-full">
          {effectiveStatus === LibraryStatus.READING && item.lastReadChapterId ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Đang đọc</span>
                <span className="font-semibold text-foreground">
                  Chương {item.lastReadChapterId.orderIndex}
                </span>
              </div>
              <Link
                href={`/books/${item.bookId.slug}/chapters/${item.lastReadChapterId.slug}`}
                className="w-full flex items-center justify-center gap-1.5 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 text-xs font-bold py-2 rounded-full transition-all duration-300"
              >
                <BookOpen size={13} />
                Đọc tiếp
              </Link>
            </div>
          ) : effectiveStatus === LibraryStatus.COMPLETED &&
            item.totalChapters !== undefined &&
            item.completedChapters !== undefined &&
            item.totalChapters > item.completedChapters ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-500 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  Có chương mới
                </span>
                <span className="font-semibold text-foreground">
                  {item.completedChapters} / {item.totalChapters} chương
                </span>
              </div>
              <Link
                href={`/books/${item.bookId.slug}`}
                className="w-full flex items-center justify-center gap-1.5 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 text-xs font-bold py-2 rounded-full transition-all duration-300"
              >
                <BookOpen size={13} />
                Đọc tiếp
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>{dateLabel}</span>
              <span>{formatDate(item.updatedAt)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
