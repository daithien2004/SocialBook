'use client';
import { cn } from '@/lib/utils';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Book } from '@/src/features/books/types/book.interface';
import { BookOpen, Bookmark, Heart, Share2, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ElementType } from 'react';

interface BookHeroProps {
  book: Book;
  isLiking: boolean;
  onToggleLike: () => void;
  onOpenLibrary: () => void;
  onOpenShare: () => void;
}

export const BookHero = ({
  book,
  isLiking,
  onToggleLike,
  onOpenLibrary,
  onOpenShare,
}: BookHeroProps) => {
  return (
    <Card className="mb-8 border-gray-200 dark:border-white/10 bg-white/60 dark:bg-transparent shadow-sm dark:shadow-2xl backdrop-blur-sm overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-none mx-auto lg:mx-0">
            <div className="w-[240px] h-[360px] md:w-[280px] md:h-[420px] relative rounded-lg overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.2)] dark:shadow-[0_0_40px_rgba(0,0,0,0.6)] group">
              <Image
                src={book.coverUrl}
                alt={book.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant={book.status === 'completed' ? 'secondary' : 'default'} // mapped simple logic
                className={cn(
                  "px-2 py-0.5 text-xs font-bold uppercase tracking-wider border",
                  book.status === 'completed'
                    ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                    : "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20"
                )}
              >
                {book.status === 'completed' ? 'Hoàn thành' : 'Đang cập nhật'}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground border-gray-200 dark:border-white/10">
                {book.publishedYear}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              {book.title}
            </h1>

            <p className="text-lg text-muted-foreground mb-6 flex items-center gap-2">
              Tác giả:{' '}
              <span className="font-bold text-red-600 dark:text-red-500 hover:underline cursor-pointer">
                {book.authorId.name}
              </span>
            </p>

            <StatsGrid book={book} />

            <div className="flex flex-wrap gap-4 mt-8">
              {book.chapters?.length > 0 && (
                <Button
                  asChild
                  size="lg"
                  className="rounded-full font-bold shadow-lg hover:-translate-y-1 transition-all bg-red-600 hover:bg-red-700 text-white"
                >
                  <Link href={`/books/${book.slug}/chapters/${book.chapters[0].slug}`}>
                    <BookOpen size={20} className="mr-2" /> Đọc ngay
                  </Link>
                </Button>
              )}

              <Button
                onClick={onOpenLibrary}
                variant="outline"
                size="lg"
                className="rounded-full font-semibold border-gray-200 dark:border-white/20 bg-background hover:bg-accent"
              >
                <Bookmark size={20} className="mr-2" /> Thêm vào thư viện
              </Button>

              <div className="flex gap-2">
                <IconButton
                  onClick={onToggleLike}
                  active={book.isLiked}
                  disabled={isLiking}
                  icon={Heart}
                  title={book.isLiked ? 'Bỏ thích' : 'Yêu thích'}
                />
                <IconButton onClick={onOpenShare} icon={Share2} title="Chia sẻ" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface StatsGridProps {
  book: Book;
}

const StatsGrid = ({ book }: StatsGridProps) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-lg border border-gray-200 dark:border-white/5">
    <StatItem
      value={book.stats?.averageRating || 0}
      label="Đánh giá"
      icon={<Star size={16} />}
      isRating
    />
    <StatItem value={book.views?.toLocaleString()} label="Lượt xem" />
    <StatItem value={book.likes?.toLocaleString()} label="Yêu thích" />
    <StatItem value={book.chapters?.length || 0} label="Chương" />
  </div>
);

interface StatItemProps {
  value: number | string | undefined;
  label: string;
  icon?: React.ReactNode;
  isRating?: boolean;
}

const StatItem = ({ value, label, icon, isRating }: StatItemProps) => (
  <div className="text-center border-r border-gray-200 dark:border-white/10 last:border-0">
    <div
      className={cn(
        "flex items-center justify-center gap-1 font-bold text-xl",
        isRating ? 'text-yellow-500' : 'text-foreground'
      )}
    >
      {value} {icon}
    </div>
    <div className="text-xs text-muted-foreground uppercase mt-1">{label}</div>
  </div>
);

interface IconButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  icon: ElementType;
  title: string;
}

const IconButton = ({ onClick, active, disabled, icon: Icon, title }: IconButtonProps) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    title={title}
    variant={active ? "default" : "outline"}
    size="icon"
    className={cn(
      "rounded-full h-12 w-12 border transition-all",
      active
        ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-red-500/20 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-500/30"
        : "border-gray-200 dark:border-white/20 text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-white dark:hover:text-white"
    )}
  >
    <Icon size={20} className={active ? 'fill-current' : ''} />
  </Button>
);
