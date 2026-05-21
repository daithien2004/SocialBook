'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Flame, TrendingUp } from 'lucide-react';
import { useGetTrendingBooksQuery } from '@/features/posts/api/postApi';

export default function TrendingBooksWidget() {
    const { data, isLoading } = useGetTrendingBooksQuery({ days: 30, limit: 5 });
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="h-48 rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-gray-800 dark:bg-neutral-900 animate-pulse" />
        );
    }

    const trendingBooks = data || [];

    if (trendingBooks.length === 0) return null;

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Sách Hot Trong Tuần
                </h2>
            </div>
            
            <div className="space-y-3">
                {trendingBooks.map((book, index) => (
                    <div 
                        key={book.bookId}
                        onClick={() => router.push(`/books/${book.bookId}`)}
                        className="flex items-start gap-3 cursor-pointer group"
                    >
                        <span className="text-xs font-bold text-muted-foreground w-4 mt-1">{index + 1}</span>
                        <div className="flex-shrink-0">
                            <Image 
                                src={book.coverImage || '/abstract-book-pattern.png'} 
                                alt={book.title} 
                                width={40} 
                                height={60} 
                                className="w-10 h-14 object-cover rounded shadow-sm group-hover:opacity-80 transition"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-foreground truncate group-hover:text-sky-600 transition">
                                {book.title}
                            </h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <TrendingUp size={12} className="text-green-500" />
                                {book.score} tương tác
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
