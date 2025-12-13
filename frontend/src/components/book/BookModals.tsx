import AddToLibraryModal from '@/src/components/library/AddToLibraryModal';
import CreatePostModal from '@/src/components/post/CreatePostModal';

export const BookModals = ({
  book,
  isLibraryOpen,
  isShareOpen,
  closeLibrary,
  closeShare,
  onShareSubmit,
  defaultShareContent,
  isSharing,
}: any) => {
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
