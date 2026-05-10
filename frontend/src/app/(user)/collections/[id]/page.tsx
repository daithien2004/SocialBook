'use client';

import {
  BookOpen,
  ChevronLeft,
  FolderOpen,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  useAddBookToCollectionsMutation,
  useDeleteCollectionMutation,
  useGetCollectionDetailQuery,
} from '@/features/library/api/libraryApi';
import { LibraryItem } from '@/features/library/types/library.interface';
import { toast } from 'sonner';
import { useModalStore } from '@/store/useModalStore';

export default function CollectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const collectionId = params.id as string;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { openEditCollection, openConfirm } = useModalStore();

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useGetCollectionDetailQuery(collectionId);

  const collection = response;
  const books = response?.books || [];

  const [deleteCollection, { isLoading: isDeleting }] =
    useDeleteCollectionMutation();
  const [updateBookCollections] = useAddBookToCollectionsMutation();

  const handleDeleteCollection = async () => {
    try {
      await deleteCollection(collectionId).unwrap();
      toast.success('Đã xóa bộ sưu tập');
      router.push('/library');
    } catch (error) {
      toast.error('Lỗi khi xóa bộ sưu tập');
    }
  };

  const handleRemoveBookFromCollection = async (
    e: React.MouseEvent,
    book: LibraryItem
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const newCollectionIds = book.collectionIds.filter(
      (id) => id !== collectionId
    );

    try {
      await updateBookCollections({
        bookId: book.bookId.id,
        collectionIds: newCollectionIds,
      }).unwrap();
      toast.success('Đã gỡ sách khỏi bộ sưu tập');
    } catch (error) {
      console.error('Failed to remove book', error);
      toast.error('Không thể gỡ sách khỏi danh sách');
    }
  };

  if (isLoading) return <CollectionDetailSkeleton />;

  if (error || !collection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background transition-colors duration-300">
        <FolderOpen
          size={48}
          className="text-muted-foreground mb-4 opacity-20"
        />
        <h2 className="text-xl font-bold text-foreground mb-2">
          Không tìm thấy bộ sưu tập
        </h2>
        <Link
          href="/library"
          className="text-primary hover:underline font-medium"
        >
          Quay lại thư viện
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 transition-colors duration-300">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 bg-background transition-colors duration-300"></div>
      </div>

      <div className="z-10 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ChevronLeft
                size={22}
                className="text-foreground"
              />
            </button>
            <h1 className="text-lg font-bold text-foreground truncate max-w-[200px] sm:max-w-md">
              {collection.name}
            </h1>
            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] uppercase tracking-wider rounded-md font-bold transition-colors">
              {books.length} sách
            </span>
          </div>

          <div className="relative z-50">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <MoreVertical
                size={20}
                className="text-foreground"
              />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute overflow-hidden right-0 top-full mt-2 w-48 bg-card rounded-lg shadow-lg border border-border z-50 animate-in fade-in zoom-in-95 duration-100 p-1">
                  <button
                    onClick={() => {
                      openEditCollection({
                        collectionId,
                        currentName: collection.name,
                        onSuccess: refetch,
                      });
                      setIsMenuOpen(false);
                    }}
                    className="group w-full px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted rounded-md flex items-center gap-2.5 transition-colors"
                  >
                    <Pencil size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    Đổi tên
                  </button>
                  
                  <button
                    onClick={() => {
                      openConfirm({
                        title: "Xóa bộ sưu tập",
                        description: `Hành động này không thể hoàn tác.`,
                        confirmText: "Xóa",
                        variant: "destructive",
                        onConfirm: handleDeleteCollection
                      });
                      setIsMenuOpen(false);
                    }}
                    className="group w-full px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md flex items-center gap-2.5 transition-colors disabled:opacity-50"
                    disabled={isDeleting}
                  >
                    <Trash2 size={14} className="text-destructive/70 group-hover:text-destructive transition-colors" />
                    Xóa bộ sưu tập
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {books.map((item) => (
              <div key={item.id} className="group relative flex flex-col">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-border mb-3 group-hover:shadow-lg transition-all duration-300">
                  <Link href={`/books/${item.bookId.slug}`}>
                    <Image
                      src={item.bookId.coverUrl}
                      alt={item.bookId.title}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <button
                    onClick={(e) => handleRemoveBookFromCollection(e, item)}
                    title="Gỡ khỏi bộ sưu tập này"
                    className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground text-foreground z-10"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex-1">
                  <Link href={`/books/${item.bookId.slug}`}>
                    <h3 className="font-bold text-foreground line-clamp-2 hover:text-primary transition-colors text-sm mb-1">
                      {item.bookId.title}
                    </h3>
                  </Link>
                  {item.status === 'READING' && item.lastReadChapterId ? (
                    <p className="text-xs text-primary font-bold flex items-center gap-1 mt-1">
                      <BookOpen size={12} />
                      Chương {item.lastReadChapterId.orderIndex}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1 transition-colors">
                      Đã thêm:{' '}
                      {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 transition-colors">
              <BookOpen
                size={32}
                className="text-muted-foreground opacity-30"
              />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Bộ sưu tập này đang trống
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-8">
              Hãy thêm sách vào bộ sưu tập này bằng cách chọn "Thêm vào danh
              sách" khi đọc sách.
            </p>
            <Link
              href="/library"
              className="px-8 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Khám phá thư viện
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function CollectionDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 bg-card border-b border-border" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="aspect-[2/3] bg-muted rounded-lg mb-3 animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
