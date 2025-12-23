'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Star, BookOpen, Bookmark, Heart, Share2 } from 'lucide-react';

import { ElementType } from 'react';
import { Book } from '@/src/features/books/types/book.interface';

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
    <div className="bg-white/60 dark:bg-transparent border border-gray-200 dark:border-white/10 rounded-xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-2xl backdrop-blur-sm">
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
            <Badge status={book.status} />
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 rounded text-xs font-bold uppercase tracking-wider">
              {book.publishedYear}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {book.title}
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 flex items-center gap-2">
            Tác giả:{' '}
            <span className="font-bold text-red-600 dark:text-red-500 hover:underline cursor-pointer">
              {book.authorId.name}
            </span>
          </p>

          <StatsGrid book={book} />

          <div className="flex flex-wrap gap-4 mt-8">
            {book.chapters?.length > 0 && (
              <Link
                href={`/books/${book.slug}/chapters/${book.chapters[0].slug}`}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg hover:-translate-y-1"
              >
                <BookOpen size={20} /> Đọc ngay
              </Link>
            )}

            <button
              onClick={onOpenLibrary}
              className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-white px-6 py-3 rounded-full font-semibold transition-all"
            >
              <Bookmark size={20} /> Thêm vào thư viện
            </button>

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
    </div>
  );
};

interface BadgeProps {
  status: string;
}

const Badge = ({ status }: BadgeProps) => (
  <span
    className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${
      status === 'completed'
        ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
        : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400'
    }`}
  >
    {status === 'completed' ? 'Hoàn thành' : 'Đang cập nhật'}
  </span>
);

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
      className={`flex items-center justify-center gap-1 font-bold text-xl ${
        isRating ? 'text-yellow-500' : 'text-gray-900 dark:text-white'
      }`}
    >
      {value} {icon}
    </div>
    <div className="text-xs text-gray-500 uppercase mt-1">{label}</div>
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
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-3 rounded-full border transition-all ${
      active
        ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-500/20 dark:border-red-500 dark:text-red-500'
        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/20 text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-white dark:hover:text-white'
    }`}
  >
    <Icon size={20} className={active ? 'fill-current' : ''} />
  </button>
);
