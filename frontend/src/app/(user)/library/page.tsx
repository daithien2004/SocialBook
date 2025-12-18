'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Archive,
  Bookmark,
  Plus,
  Folder,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';

import {
  useGetLibraryBooksQuery,
  useGetCollectionsQuery,
  useCreateCollectionMutation,
} from '@/src/features/library/api/libraryApi';
import { LibraryStatus } from '@/src/features/library/types/library.interface';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<LibraryStatus>(
    LibraryStatus.READING
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const {
    data: libraryData,
    isLoading: isLoadingLibrary,
    isFetching: isFetchingLibrary,
  } = useGetLibraryBooksQuery({ status: activeTab });

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const { data: collections, isLoading: isLoadingCollections } =
    useGetCollectionsQuery(currentUserId, {
      skip: !currentUserId,
    });

  const [createCollection, { isLoading: isCreatingCollection }] =
    useCreateCollectionMutation();

  const books = libraryData || [];

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    try {
      await createCollection({
        name: newCollectionName,
        isPublic: false,
      }).unwrap();
      setNewCollectionName('');
      setIsCreateModalOpen(false);
      toast.success('Đã tạo bộ sưu tập mới');
    } catch (error) {
      toast.error('Không thể tạo bộ sưu tập. Vui lòng thử lại.');
    }
  };

  const tabs = [
    { id: LibraryStatus.READING, label: 'Đọc hiện tại', icon: Clock },
    { id: LibraryStatus.COMPLETED, label: 'Đã hoàn thành', icon: Bookmark },
    { id: LibraryStatus.ARCHIVED, label: 'Kho lưu trữ', icon: Archive },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#161515] pb-20 transition-colors duration-300 font-sans selection:bg-blue-500 selection:text-white relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/main-background.jpg"
          alt="Background Texture"
          className="w-full h-full object-cover opacity-10 dark:opacity-40"
        />
        <div className="absolute inset-0 bg-white/80 dark:bg-[#0f0f0f]/70 transition-colors duration-300"></div>
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Thư viện của tôi
            </h1>
          </div>

          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Folder size={20} className="text-yellow-500" />
                Bộ sưu tập
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Plus size={16} /> Tạo mới
              </button>
            </div>

            {isLoadingCollections ? (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-40 h-16 bg-gray-200 dark:bg-white/5 rounded-lg animate-pulse flex-none"
                  />
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex-none w-40 h-20 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors bg-white dark:bg-white/5"
                >
                  <Plus size={24} />
                  <span className="text-xs font-medium mt-1">
                    Tạo danh sách
                  </span>
                </button>

                {collections?.map((col) => (
                  <Link
                    key={col.id}
                    href={`/collections/${col.id}`}
                    className="flex-none w-48 h-20 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-white/10 p-4 hover:shadow-md dark:hover:border-white/30 transition-all group relative"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate w-36 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {col.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(col.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <Folder size={18} className="text-yellow-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <div className="border-b border-gray-200 dark:border-white/10 mb-6">
            <nav className="flex gap-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 pb-4 px-1 font-medium text-sm transition-colors relative
                      ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }
                    `}
                  >
                    <Icon size={18} />
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="min-h-[300px]">
            {isLoadingLibrary || isFetchingLibrary ? (
              <LibrarySkeleton />
            ) : books?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {books?.map((item) => (
                  <div key={item.id} className="group relative flex flex-col">
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md dark:shadow-black/50 mb-3 group-hover:shadow-xl dark:group-hover:shadow-black/70 transition-all duration-300 bg-gray-200 dark:bg-white/5">
                      <Link href={`/books/${item.bookId.slug}`}>
                        <Image
                          src={item.bookId.coverUrl}
                          alt={item.bookId.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-black/20 transition-colors" />
                      </Link>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <Link href={`/books/${item.bookId.slug}`}>
                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-1 text-sm md:text-base">
                          {item.bookId.title}
                        </h3>
                      </Link>

                      {activeTab === LibraryStatus.READING &&
                      item.lastReadChapterId ? (
                        <div className="mt-auto pt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Đang đọc:{' '}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Chương {item.lastReadChapterId.orderIndex}
                            </span>
                          </p>
                          <Link
                            href={`/books/${item.bookId.slug}/chapters/${item.lastReadChapterId.slug}`}
                            className="w-full flex items-center justify-center gap-1 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 text-xs font-semibold py-2 rounded-lg transition-all"
                          >
                            <BookOpen size={14} />
                            Đọc tiếp
                          </Link>
                        </div>
                      ) : (
                        <div className="mt-auto pt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Cập nhật:{' '}
                            {new Date(item.updatedAt).toLocaleDateString(
                              'vi-VN'
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#1a1a1a]/50 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <BookOpen
                    size={32}
                    className="text-gray-400 dark:text-gray-500"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Chưa có sách nào ở đây
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                  {activeTab === LibraryStatus.READING
                    ? 'Bạn chưa đọc cuốn sách nào gần đây.'
                    : activeTab === LibraryStatus.COMPLETED
                    ? 'Bạn chưa đọc xong cuốn sách nào.'
                    : 'Bạn chưa lưu trữ cuốn sách nào.'}
                </p>
                <Link
                  href="/books"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  Khám phá ngay <ChevronRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Tạo bộ sưu tập mới
              </h3>
              <form onSubmit={handleCreateCollection}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên bộ sưu tập
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ví dụ: Truyện hay tháng 10..."
                    className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingCollection || !newCollectionName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isCreatingCollection ? 'Đang tạo...' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="aspect-[2/3] bg-gray-200 dark:bg-white/5 rounded-lg mb-3 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-3/4 mb-2 animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-1/2 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
