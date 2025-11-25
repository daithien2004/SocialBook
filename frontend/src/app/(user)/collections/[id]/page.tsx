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
  useAddBookToCollectionsMutation, // Dùng cái này để update lại mảng collectionIds của sách
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

  // 2. Xử lý xóa Folder (Xóa folder xong thì redirect về thư viện)
  const handleDeleteCollection = async () => {
    if (
      !confirm(
        'Bạn có chắc muốn xóa bộ sưu tập này? Sách bên trong sẽ không bị xóa khỏi thư viện.'
      )
    )
      return;

    try {
      await deleteCollection(collectionId).unwrap();
      router.push('/library'); // Quay về trang thư viện
    } catch (error) {
      toast.error('Lỗi khi xóa bộ sưu tập');
    }
  };

  // 3. Xóa sách khỏi Folder này
  const handleRemoveBookFromCollection = async (
    e: React.MouseEvent,
    book: LibraryItem
  ) => {
    e.preventDefault(); // Chặn click link vào sách
    e.stopPropagation();

    // Logic: Lọc bỏ ID folder hiện tại ra khỏi mảng collectionIds của sách
    const newCollectionIds = book.collectionIds.filter(
      (id) => id !== collectionId
    );

    try {
      await updateBookCollections({
        bookId: book.bookId.id, // Lấy ID gốc của Book
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <FolderOpen size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Không tìm thấy bộ sưu tập
        </h2>
        <Link href="/library" className="text-blue-600 hover:underline">
          Quay lại thư viện
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER BACKGROUND */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-[200px] sm:max-w-md">
              {collection.name}
            </h1>
            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
              {books.length} sách
            </span>
          </div>

          {/* MENU OPTIONS */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical size={20} className="text-gray-600" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={openEditModal}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Pencil size={16} /> Đổi tên
                  </button>
                  <button
                    onClick={handleDeleteCollection}
                    disabled={isDeleting}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={16} />{' '}
                    {isDeleting ? 'Đang xóa...' : 'Xóa bộ sưu tập'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
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

                  {/* Nút Xóa khỏi folder (Góc trên phải) */}
                  <button
                    onClick={(e) => handleRemoveBookFromCollection(e, item)}
                    title="Gỡ khỏi bộ sưu tập này"
                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 hover:text-red-600 z-10"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <Link href={`/books/${item.bookId.slug}`}>
                    <h3 className="font-bold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors text-sm mb-1">
                      {item.bookId.title}
                    </h3>
                  </Link>
                  {/* Hiển thị tiến độ nếu đang đọc */}
                  {item.status === 'READING' && item.lastReadChapterId ? (
                    <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1">
                      <BookOpen size={12} />
                      Chương {item.lastReadChapterId.orderIndex}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
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
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen size={40} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Bộ sưu tập này đang trống
            </h3>
            <p className="text-gray-500 max-w-sm mb-6">
              Hãy thêm sách vào bộ sưu tập này bằng cách chọn "Thêm vào danh
              sách" khi đọc sách.
            </p>
            <Link
              href="/library"
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Về thư viện
            </Link>
          </div>
        )}
      </div>

      {/* === MODAL ĐỔI TÊN === */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Đổi tên bộ sưu tập
            </h3>
            <form onSubmit={handleUpdateName}>
              <input
                type="text"
                autoFocus
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading Skeleton
function CollectionDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-16 bg-white border-b border-gray-200" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="aspect-[2/3] bg-gray-200 rounded-lg mb-3 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
