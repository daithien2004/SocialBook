import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ElementType, useCallback, useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Book } from '@/features/books/types/book.interface';
import { cn } from '@/lib/utils';
import { BookCard } from './BookCard';

interface BookSectionProps {
    title?: string;
    books: Book[];
    icon?: ElementType;
}

export function BookSection({ title, books, icon: IconComponent }: BookSectionProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = useCallback(() => {
        const container = containerRef.current;
        if (container) {
            setCanScrollLeft(container.scrollLeft > 2);
            setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 2);
        }
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScroll);
            checkScroll();
            window.addEventListener('resize', checkScroll);
            return () => {
                container.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [books, checkScroll]);

    const scroll = useCallback((direction: 'left' | 'right') => {
        const container = containerRef.current;
        if (container) {
            const scrollAmount = container.clientWidth * 0.8;
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    }, []);

    const handleScrollLeft = useCallback(() => scroll('left'), [scroll]);
    const handleScrollRight = useCallback(() => scroll('right'), [scroll]);

    if (!books || books.length === 0) return null;

    return (
        <section className="w-full group/section py-4">
            <BookSectionHeader
                title={title}
                icon={IconComponent}
                canScrollLeft={canScrollLeft}
                canScrollRight={canScrollRight}
                onScrollLeft={handleScrollLeft}
                onScrollRight={handleScrollRight}
            />

            <div className="relative group">
                <div
                    ref={containerRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-12 pb-4 pt-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {books.map((book) => (
                        <div key={book.id} className="flex-none w-[160px] md:w-[200px]">
                            <BookCard book={book} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

interface BookSectionHeaderProps {
    title?: string;
    icon?: ElementType;
    canScrollLeft: boolean;
    canScrollRight: boolean;
    onScrollLeft: () => void;
    onScrollRight: () => void;
}

function BookSectionHeader({ title, icon: IconComponent, canScrollLeft, canScrollRight, onScrollLeft, onScrollRight }: BookSectionHeaderProps) {
    return (
        <div className="flex items-center justify-between px-4 md:px-12 mb-4">
            {title && (
                <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-wide flex items-center gap-2 transition-colors duration-300">
                    {IconComponent && <IconComponent size={24} className="text-red-600 dark:text-red-500" />}
                    {title}
                </h2>
            )}

            <ScrollButtons canScrollLeft={canScrollLeft} canScrollRight={canScrollRight} onScrollLeft={onScrollLeft} onScrollRight={onScrollRight} />
        </div>
    );
}

interface ScrollButtonsProps {
    canScrollLeft: boolean;
    canScrollRight: boolean;
    onScrollLeft: () => void;
    onScrollRight: () => void;
}

function ScrollButtons({ canScrollLeft, canScrollRight, onScrollLeft, onScrollRight }: ScrollButtonsProps) {
    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                size="icon"
                onClick={onScrollLeft}
                disabled={!canScrollLeft}
                className={cn(
                    "rounded-full border-gray-300 dark:border-white/20 hover:border-red-600 dark:hover:border-white hover:bg-red-50 dark:hover:bg-white/10 text-gray-700 dark:text-white transition-all duration-300",
                    !canScrollLeft && "opacity-30 cursor-not-allowed"
                )}
                aria-label="Scroll left"
            >
                <ChevronLeft size={20} />
            </Button>

            <Button
                variant="outline"
                size="icon"
                onClick={onScrollRight}
                disabled={!canScrollRight}
                className={cn(
                    "rounded-full border-gray-300 dark:border-white/20 hover:border-red-600 dark:hover:border-white hover:bg-red-50 dark:hover:bg-white/10 text-gray-700 dark:text-white transition-all duration-300",
                    !canScrollRight && "opacity-30 cursor-not-allowed"
                )}
                aria-label="Scroll right"
            >
                <ChevronRight size={20} />
            </Button>
        </div>
    );
}
