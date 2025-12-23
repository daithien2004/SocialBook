'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Plus,
  Check,
  Lock,
  Globe,
  Bookmark,
  Clock,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useUpdateLibraryStatusMutation,
  useAddBookToCollectionsMutation,
  useGetBookLibraryInfoQuery,
} from '@/src/features/library/api/libraryApi';
import { LibraryStatus } from '@/src/features/library/types/library.interface';
import { useAppAuth } from '@/src/hooks/useAppAuth';

interface AddToLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
}

export default function AddToLibraryModal({
  isOpen,
  onClose,
  bookId,
}: AddToLibraryModalProps) {
  const { user, isAuthenticated } = useAppAuth();
  const isLoggedIn = isAuthenticated;
  const router = useRouter();

  const [selectedStatus, setSelectedStatus] = useState<LibraryStatus | null>(
    null
  );
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      toast.info('Vui lòng đăng nhập để sử dụng tính năng này', {
        action: {
          label: 'Đăng nhập',
          onClick: () => router.push('/login'),
        },
      });
      onClose();
    }
  }, [isOpen, isAuthenticated, onClose, router]);

  const currentUserId = user?.id;

  const { data: collectionsData } = useGetCollectionsQuery(currentUserId, {
    skip: !isLoggedIn,
  });
  const { data: libraryInfo } = useGetBookLibraryInfoQuery(bookId, {
    skip: !isOpen || !isAuthenticated,
  });

  const [updateStatus] = useUpdateLibraryStatusMutation();
  const [updateCollections] = useAddBookToCollectionsMutation();
  const [createCollection] = useCreateCollectionMutation();

  const collections = collectionsData || [];

  useEffect(() => {
    if (libraryInfo) {
      setSelectedStatus(libraryInfo.status);
      setSelectedCollections(libraryInfo.collections.map((c) => c.id));
    }
  }, [libraryInfo]);

  useEffect(() => {
    if (isOpen) {
      setIsCreating(false);
      setNewCollectionName('');
    }
  }, [isOpen]);

  if (!isOpen || !isAuthenticated) return null;

  const handleStatusChange = async (status: LibraryStatus) => {
    setSelectedStatus(status);
    try {
      await updateStatus({ bookId, status }).unwrap();
    } catch (error: any) {
      if (error?.status !== 401) {
        toast.error('Cập nhật trạng thái thất bại');
      }
    }
  };

  const handleToggleCollection = async (collectionId: string) => {
    const isSelected = selectedCollections.includes(collectionId);
    let newIds: string[] = [];

    if (isSelected) {
      newIds = selectedCollections.filter((id) => id !== collectionId);
    } else {
      newIds = [...selectedCollections, collectionId];
    }

    setSelectedCollections(newIds);

    try {
      await updateCollections({ bookId, collectionIds: newIds }).unwrap();
    } catch (error: any) {
      setSelectedCollections(selectedCollections);
      if (error?.status !== 401) {
        toast.error('Cập nhật bộ sưu tập thất bại');
      }
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      const res = await createCollection({ name: newCollectionName }).unwrap();
      const newColId = res.id;

      await handleToggleCollection(newColId);

      setNewCollectionName('');
      setIsCreating(false);
    } catch (error: any) {
      if (error?.status !== 401) {
        toast.error('Tạo danh sách thất bại');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            Lưu vào thư viện
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-6">
          <div className="grid grid-cols-3 gap-2">
            <StatusButton
              active={selectedStatus === LibraryStatus.READING}
              onClick={() => handleStatusChange(LibraryStatus.READING)}
              icon={Clock}
              label="Đang đọc"
              color="text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
            />
            <StatusButton
              active={selectedStatus === LibraryStatus.COMPLETED}
              onClick={() => handleStatusChange(LibraryStatus.COMPLETED)}
              icon={Bookmark}
              label="Đã hoàn thành"
              color="text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
            />
            <StatusButton
              active={selectedStatus === LibraryStatus.ARCHIVED}
              onClick={() => handleStatusChange(LibraryStatus.ARCHIVED)}
              icon={Archive}
              label="Lưu trữ"
              color="bg-zinc-200 text-zinc-700 border-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:border-zinc-500"
            />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Bộ sưu tập của tôi
            </h4>

            <div className="space-y-1">
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => handleToggleCollection(col.id)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors group"
                >
                  <div
                    className={`
                      w-5 h-5 rounded border flex items-center justify-center
                      ${
                        selectedCollections.includes(col.id)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'
                      }
                    `}
                  >
                    {selectedCollections.includes(col.id) && (
                      <Check size={14} strokeWidth={3} />
                    )}
                  </div>

                  <span className="text-gray-700 dark:text-gray-200 text-sm flex-1 text-left truncate">
                    {col.name}
                  </span>

                  {col.isPublic ? (
                    <Globe size={14} className="text-gray-400" />
                  ) : (
                    <Lock size={14} className="text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {isCreating ? (
            <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
              <input
                autoFocus
                placeholder="Tên danh sách..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-blue-500 bg-white dark:bg-zinc-800 text-black dark:text-gray-100"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
              />
              <button
                onClick={handleCreateCollection}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Tạo
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline"
            >
              <Plus size={16} /> Tạo danh sách mới
            </button>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-zinc-900">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusButton({ active, onClick, icon: Icon, label, color }: any) {
  return (
    <button
      onClick={onClick}
      className={`
                flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all
                ${
                  active
                    ? color
                    : `
                            bg-white dark:bg-zinc-800
                            border-gray-200 dark:border-gray-700
                            text-gray-500 dark:text-gray-400
                            hover:bg-gray-50 dark:hover:bg-zinc-700
                          `
                }
            `}
    >
      <Icon
        size={20}
        className={active ? 'fill-current opacity-20' : 'opacity-70'}
      />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
