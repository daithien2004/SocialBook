import { Book } from '@/src/features/books/types/book.interface';
import AddToLibraryModal from '@/src/components/library/AddToLibraryModal';
import CreatePostModal from '@/src/components/post/CreatePostModal';

interface BookModalsProps {
  book: Book;
  isLibraryOpen: boolean;
  isShareOpen: boolean;
  closeLibrary: () => void;
  closeShare: () => void;
  onShareSubmit: (data: any) => Promise<any>;
  defaultShareContent: string;
  isSharing: boolean;
}

export const BookModals = ({
  book,
  isLibraryOpen,
  isShareOpen,
  closeLibrary,
  closeShare,
  onShareSubmit,
  defaultShareContent,
  isSharing,
}: BookModalsProps) => {
  if (!book) return null;

  return (
    <>
      <AddToLibraryModal
        isOpen={isLibraryOpen}
        onClose={closeLibrary}
        bookId={book.id}
      />
      <CreatePostModal
        isSubmitting={isSharing}
        isOpen={isShareOpen}
        onClose={closeShare}
        onSubmit={onShareSubmit}
        defaultContent={defaultShareContent}
        title={`Chia sẻ sách "${book.title}"`}
        contentLabel="Nội dung bài viết"
        contentPlaceholder="Chia sẻ suy nghĩ của bạn về cuốn sách này..."
        maxImages={10}
      />
    </>
  );
};
