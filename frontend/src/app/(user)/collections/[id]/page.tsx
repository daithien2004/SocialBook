'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  MoreVertical,
  Pencil,
  Trash2,
  BookOpen,
  FolderOpen,
  X,
} from 'lucide-react';

// API Hooks & Types
import {
  useGetCollectionDetailQuery,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useAddBookToCollectionsMutation,
} from '@/src/features/library/api/libraryApi';
import { LibraryItem } from '@/src/features/library/types/library.interface';
import { toast } from 'sonner';

export default function CollectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const collectionId = params.id as string;

  // --- STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editName, setEditName] = useState('');

  // --- QUERIES ---
  const {
    data: response,
    isLoading,
    error,
  } = useGetCollectionDetailQuery(collectionId);

  const collection = response?.folder;
  const books = response?.books || [];

  // --- MUTATIONS ---
  const [updateCollection, { isLoading: isUpdating }] =
    useUpdateCollectionMutation();
  const [deleteCollection, { isLoading: isDeleting }] =
    useDeleteCollectionMutation();
  const [updateBookCollections] = useAddBookToCollectionsMutation();

  // --- HANDLERS ---

  // 1. Xử lý đổi tên Folder
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      await updateCollection({
        id: collectionId,
        data: { name: editName },
      }).unwrap();
      setIsEditModalOpen(false);
      setIsMenuOpen(false);
    } catch (error) {
      toast.error('Lỗi khi cập nhật tên bộ sưu tập');
    }
  };

  // 2. Xử lý xóa Folder
  const handleDeleteCollection = async () => {
    if (
      !confirm(
        'Bạn có chắc muốn xóa bộ sưu tập này? Sách bên trong sẽ không bị xóa khỏi thư viện.'
      )
    )
      return;

    try {
      await deleteCollection(collectionId).unwrap();
      router.push('/library');
    } catch (error) {
      toast.error('Lỗi khi xóa bộ sưu tập');
    }
  };

  // 3. Xóa sách khỏi Folder này
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
    } catch (error) {
      console.error('Failed to remove book', error);
      toast.error('Không thể gỡ sách khỏi danh sách');
    }
  };

  // Mở modal edit và điền sẵn tên cũ
  const openEditModal = () => {
    if (collection) setEditName(collection.name);
    setIsEditModalOpen(true);
    setIsMenuOpen(false);
  };

  // --- RENDER LOADING & ERROR ---
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
      {/* GLOBAL BACKGROUND FIXED */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/main-background.jpg"
          alt="Background Texture"
          className="w-full h-full object-cover opacity-10 dark:opacity-40 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-white/60 dark:bg-[#0f0f0f]/70 transition-colors duration-300"></div>
      </div>

      {/* HEADER BACKGROUND */}
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

          {/* MENU OPTIONS */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
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
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-100 dark:border-white/10 py-1 z-20 animate-in fade-in zoom-in-95 duration-100 transition-colors">
                  <button
                    onClick={openEditModal}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors"
                  >
                    <Pencil size={16} /> Đổi tên
                  </button>
                  <button
                    onClick={handleDeleteCollection}
                    disabled={isDeleting}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={16} />
                    {isDeleting ? 'Đang xóa...' : 'Xóa bộ sưu tập'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* BOOK LIST */}
        {books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {books.map((item) => (
              <div key={item.id} className="group relative flex flex-col">
                {/* Cover Image */}
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

                  {/* Nút Xóa khỏi folder */}
                  <button
                    onClick={(e) => handleRemoveBookFromCollection(e, item)}
                    title="Gỡ khỏi bộ sưu tập này"
                    className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-gray-400 z-10"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <Link href={`/books/${item.bookId.slug}`}>
                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm mb-1">
                      {item.bookId.title}
                    </h3>
                  </Link>
                  {/* Hiển thị tiến độ nếu đang đọc */}
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
          // Empty State
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

      {/* === MODAL ĐỔI TÊN === */}
      {isEditModalOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 animate-in fade-in duration-200"
            onClick={() => setIsEditModalOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200 pointer-events-auto transition-colors">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 transition-colors">
                Đổi tên bộ sưu tập
              </h3>
              <form onSubmit={handleUpdateName}>
                <input
                  type="text"
                  autoFocus
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 bg-white dark:bg-black/40 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 outline-none mb-4 transition-colors"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nhập tên mới..."
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg font-medium transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || !editName.trim()}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 font-medium transition-colors"
                  >
                    {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Loading Skeleton
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
