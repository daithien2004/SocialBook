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

  const collection = response?.folder;
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#141414] transition-colors duration-300">
        <FolderOpen
          size={48}
          className="text-gray-300 dark:text-gray-600 mb-4"
        />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Không tìm thấy bộ sưu tập
        </h2>
        <Link
          href="/library"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Quay lại thư viện
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#161515] pb-20 transition-colors duration-300">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/main-background.jpg"
          alt="Background Texture"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-10 dark:opacity-40 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-white/60 dark:bg-[#0f0f0f]/70 transition-colors duration-300"></div>
      </div>

      <div className="z-10 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 sticky top-0 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft
                size={24}
                className="text-gray-600 dark:text-gray-400"
              />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-md transition-colors">
              {collection.name}
            </h1>
            <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-xs rounded-full font-medium transition-colors">
              {books.length} sách
            </span>
          </div>

          <div className="relative z-50">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <MoreVertical
                size={20}
                className="text-gray-600 dark:text-gray-400"
              />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute overflow-hidden right-0 top-full mt-2 w-56 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-200 dark:border-white/20 z-50 animate-in fade-in zoom-in-95 duration-100 transition-colors p-1.5">
                  <button
                    onClick={() => {
                      openEditCollection({
                        collectionId,
                        currentName: collection.name,
                        onSuccess: refetch,
                      });
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 rounded-lg flex items-center gap-3 transition-colors"
                  >
                    <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                      <Pencil size={16} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    Đổi tên
                  </button>
                  
                  <button
                    onClick={() => {
                      openConfirm({
                        title: "Xóa bộ sưu tập",
                        description: `Bạn có chắc chắn muốn xóa bộ sưu tập "${collection.name}"? Hành động này không thể hoàn tác.`,
                        confirmText: "Xóa vĩnh viễn",
                        variant: "destructive",
                        onConfirm: handleDeleteCollection
                      });
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-3 transition-colors disabled:opacity-50"
                    disabled={isDeleting}
                  >
                    <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                      <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                    </div>
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
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md mb-3 group-hover:shadow-xl transition-all duration-300">
                  <Link href={`/books/${item.bookId.slug}`}>
                    <Image
                      src={item.bookId.coverUrl}
                      alt={item.bookId.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </Link>

                  <button
                    onClick={(e) => handleRemoveBookFromCollection(e, item)}
                    title="Gỡ khỏi bộ sưu tập này"
                    className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-gray-400 z-10"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1">
                  <Link href={`/books/${item.bookId.slug}`}>
                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm mb-1">
                      {item.bookId.title}
                    </h3>
                  </Link>
                  {item.status === 'READING' && item.lastReadChapterId ? (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-1">
                      <BookOpen size={12} />
                      Chương {item.lastReadChapterId.orderIndex}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                      Đã thêm:{' '}
                      {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 transition-colors">
              <BookOpen
                size={40}
                className="text-gray-400 dark:text-gray-600"
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors">
              Bộ sưu tập này đang trống
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6 transition-colors">
              Hãy thêm sách vào bộ sưu tập này bằng cách chọn "Thêm vào danh
              sách" khi đọc sách.
            </p>
            <Link
              href="/library"
              className="px-6 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
            >
              Về thư viện
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function CollectionDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#161515] transition-colors duration-300">
      <div className="h-16 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 transition-colors" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="aspect-[2/3] bg-gray-200 dark:bg-white/10 rounded-lg mb-3 animate-pulse transition-colors" />
              <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4 mb-2 animate-pulse transition-colors" />
              <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/2 animate-pulse transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
