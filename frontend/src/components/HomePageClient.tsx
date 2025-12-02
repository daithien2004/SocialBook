"use client";

import { BannerSlider } from "../components/book/BannerSlider";
import { BookSection } from "../components/book/BookSection";
import { Flame, Sparkles, BookPlus, Star } from "lucide-react";
import { useGetBooksQuery } from "../features/books/api/bookApi";
import { Book } from "../features/books/types/book.interface";
import { useMemo } from "react";

const ONE_DAY_IN_MS = 86400000;
const NEW_BOOK_THRESHOLD_DAYS = 30;

export const getTrendingBooks = (books: Book[]) => {
    return books
        .filter((book) => book.views > 2000)
        .sort((a, b) => b.views - a.views)
        .slice(0, 20);
};

export const getNewBooks = (books: Book[]) => {
    const now = Date.now();
    const threshold = now - NEW_BOOK_THRESHOLD_DAYS * ONE_DAY_IN_MS;

    return books
        .filter(
            (book) => new Date(book.createdAt).getTime() >= threshold
        )
        .sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
        )
        .slice(0, 20);
};

export const getTopRatedBooks = (books: Book[]) => {
    return books
        .map((book) => ({
            ...book,
            rating: book.views > 0 ? book.likes / book.views : 0,
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 20);
};

export const getRecommendedBooks = (books: Book[]) => {
    const shuffled = [...books];
    const limit = Math.min(20, shuffled.length);

    for (let i = 0; i < limit; i++) {
        const j =
            Math.floor(Math.random() * (shuffled.length - i)) + i;
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, limit);
};

const BOOK_SECTIONS = [
    {
        title: "Trending Now",
        description: "Sách hot nhất hiện nay",
        icon: Flame,
        getBooks: getTrendingBooks,
    },
    {
        title: "Recommended For You",
        description: "Gợi ý dành riêng cho bạn",
        icon: Sparkles,
        getBooks: getRecommendedBooks,
    },
    {
        title: "New Releases",
        description: "Mới cập nhật gần đây",
        icon: BookPlus,
        getBooks: getNewBooks,
    },
    {
        title: "Top Rated",
        description: "Được đánh giá tốt nhất",
        icon: Star,
        getBooks: getTopRatedBooks,
    },
];

export default function HomePageClient() {
    const { data: books = [], isLoading } = useGetBooksQuery();

    const sections = useMemo(() => {
        if (!books.length) return [];
        return BOOK_SECTIONS.map((section) => ({
            ...section,
            books: section.getBooks(books),
        }));
    }, [books]);

    const featuredBooks = useMemo(() => {
        return getNewBooks(books).slice(0, 5);
    }, [books]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#141414] flex items-center justify-center transition-colors duration-300">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <main>
            <div className="pb-8">
                <BannerSlider books={featuredBooks} />
            </div>

            <div className="flex flex-col gap-8 pb-20 mt-4 px-0">
                {sections.map((section) => (
                    <BookSection
                        key={section.title}
                        title={section.title}
                        books={section.books}
                        icon={section.icon}
                    />
                ))}
            </div>
        </main>
    );
}
