import { Book } from '@/src/features/books/types/book.interface';
import { BookCard } from './BookCard';
import {
  BookGridSkeleton,
  EmptyBooksState,
  LoadingMoreIndicator,
  EndOfListMessage,
} from './LoadingStates';

interface BookGridProps {
  books: Book[];
  isLoading: boolean;
  isFetching: boolean;
  hasMore: boolean;
  isInitialized: boolean;
  onLastElementVisible: (node: HTMLDivElement | null) => void;
}

export function BookGrid({
  books,
  isLoading,
  isFetching,
  hasMore,
  isInitialized,
  onLastElementVisible,
}: BookGridProps) {
  if (isLoading && !isInitialized) {
    return <BookGridSkeleton />;
  }

  // Empty state
  if (isInitialized && books.length === 0) {
    return <EmptyBooksState />;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-20">
        {books.map((book, index) => {
          const isLastBook = index === books.length - 1;

          if (isLastBook) {
            return (
              <div key={book.id} ref={onLastElementVisible}>
                <BookCard book={book} />
              </div>
            );
          }

          return <BookCard key={book.id} book={book} />;
        })}
      </div>

      {isFetching && isInitialized && <LoadingMoreIndicator />}

      {!hasMore && books.length > 0 && <EndOfListMessage />}
    </>
  );
}
