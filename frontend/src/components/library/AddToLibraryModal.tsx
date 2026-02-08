'use client';

import {
  Archive,
  Bookmark,
  Check,
  Clock,
  Globe,
  Lock,
  Plus,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  useAddBookToCollectionsMutation,
  useCreateCollectionMutation,
  useGetBookLibraryInfoQuery,
  useGetCollectionsQuery,
  useUpdateLibraryStatusMutation,
} from '@/features/library/api/libraryApi';
import { LibraryStatus } from '@/features/library/types/library.interface';
import { useAppAuth } from '@/hooks/useAppAuth';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
      setSelectedCollections(selectedCollections); // Rollback
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

  if (!isAuthenticated) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#1a1a1a] gap-0 p-0 border-slate-100 dark:border-gray-800">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-gray-800">
          <DialogTitle>Lưu vào thư viện</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Status Section */}
          <div className="grid grid-cols-3 gap-3">
            <StatusButton
              active={selectedStatus === LibraryStatus.READING}
              onClick={() => handleStatusChange(LibraryStatus.READING)}
              icon={Clock}
              label="Đang đọc"
              activeClass="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800"
            />
            <StatusButton
              active={selectedStatus === LibraryStatus.COMPLETED}
              onClick={() => handleStatusChange(LibraryStatus.COMPLETED)}
              icon={Bookmark}
              label="Hoàn thành"
              activeClass="bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-800"
            />
            <StatusButton
              active={selectedStatus === LibraryStatus.ARCHIVED}
              onClick={() => handleStatusChange(LibraryStatus.ARCHIVED)}
              icon={Archive}
              label="Lưu trữ"
              activeClass="bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
            />
          </div>

          <Separator />

          {/* Collections Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                Bộ sưu tập của tôi
              </h4>
              {!isCreating && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700" onClick={() => setIsCreating(true)}>
                  <Plus className="w-3 h-3 mr-1" />
                  Tạo mới
                </Button>
              )}
            </div>

            {isCreating && (
              <div className="flex gap-2 mb-3 animate-in fade-in slide-in-from-top-1">
                <Input
                  autoFocus
                  placeholder="Tên danh sách..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                  className="h-9 text-sm"
                />
                <Button size="sm" onClick={handleCreateCollection} className="h-9">
                  ok
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)} className="h-9 w-9 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <ScrollArea className="h-44 pr-4 -mr-4">
              <div className="space-y-1">
                {collections.map((col) => {
                  const isSelected = selectedCollections.includes(col.id);
                  return (
                    <button
                      key={col.id}
                      onClick={() => handleToggleCollection(col.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors group text-left"
                    >
                      <div className={`
                                      flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors
                                      ${isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-slate-300 dark:border-gray-600 group-hover:border-blue-400'}
                                  `}>
                        {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                      <span className="text-sm text-slate-700 dark:text-gray-300 flex-1 truncate">{col.name}</span>
                      {col.isPublic ? <Globe size={13} className="text-slate-400" /> : <Lock size={13} className="text-slate-400" />}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50 dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800">
          <Button className="w-full" onClick={onClose}>
            Xong
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusButton({ active, onClick, icon: Icon, label, activeClass }: any) {
  return (
    <button
      onClick={onClick}
      className={`
                flex flex-col items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-200
                ${active ? activeClass : 'bg-white dark:bg-gray-800/20 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800/60'}
            `}
    >
      <Icon size={20} className={active ? 'opacity-100' : 'opacity-70'} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}
