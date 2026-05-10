'use client';

import {
  Archive,
  Bookmark,
  Check,
  Clock,
  Lock,
  Plus,
  X
} from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { useAddToLibrary } from '@/features/library/hooks/useAddToLibrary';
import { LibraryStatus } from '@/features/library/types/library.interface';
import { useAppAuth } from '@/features/auth/hooks';
import { useModalStore } from '@/store/useModalStore';

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

export default function AddToLibraryModal() {
  const { isAddToLibraryOpen, closeAddToLibrary, addToLibraryData } = useModalStore();
  const bookId = addToLibraryData?.bookId || '';

  const { user, isAuthenticated } = useAppAuth();
  const isLoggedIn = isAuthenticated;
  const currentUserId = user?.id;

  const {
    selectedStatus,
    selectedCollections,
    collections,
    isCreating,
    newCollectionName,
    setIsCreating,
    setNewCollectionName,
    handleStatusChange,
    handleToggleCollection,
    handleCreateCollection,
  } = useAddToLibrary({
    bookId,
    userId: currentUserId,
    isOpen: isAddToLibraryOpen,
    isAuthenticated: isLoggedIn,
  });

  useEffect(() => {
    if (isAddToLibraryOpen && !isAuthenticated) {
      toast.info('Vui lòng đăng nhập để sử dụng tính năng này', {
        action: {
          label: 'Đăng nhập',
          onClick: () => {
            window.location.href = '/login';
          },
        },
      });
      closeAddToLibrary();
    }
  }, [isAddToLibraryOpen, isAuthenticated, closeAddToLibrary]);

  if (!isAuthenticated || !bookId) return null;

  const collectionsList = collections ?? [];

  return (
    <Dialog open={isAddToLibraryOpen} onOpenChange={(open) => !open && closeAddToLibrary()}>
      <DialogContent className="sm:max-w-md bg-card gap-0 p-0 border-border">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle>Lưu vào thư viện</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Status Section */}
          <div className="flex p-1 bg-muted/50 rounded-lg">
            <StatusButton
              active={selectedStatus === LibraryStatus.READING}
              onClick={() => handleStatusChange(LibraryStatus.READING)}
              icon={Clock}
              label="Đang đọc"
              activeClass="bg-background text-foreground shadow-sm"
            />
            <StatusButton
              active={selectedStatus === LibraryStatus.COMPLETED}
              onClick={() => handleStatusChange(LibraryStatus.COMPLETED)}
              icon={Bookmark}
              label="Hoàn thành"
              activeClass="bg-background text-foreground shadow-sm"
            />
            <StatusButton
              active={selectedStatus === LibraryStatus.ARCHIVED}
              onClick={() => handleStatusChange(LibraryStatus.ARCHIVED)}
              icon={Archive}
              label="Lưu trữ"
              activeClass="bg-background text-foreground shadow-sm"
            />
          </div>

          {/* Collections Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">
                Bộ sưu tập của tôi
              </h4>
              {!isCreating && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary/90 hover:bg-transparent" onClick={() => setIsCreating(true)}>
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
                  Tạo
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)} className="h-9 w-9 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <ScrollArea className="h-44 pr-4 -mr-4 mt-2">
              <div className="space-y-0.5">
                {collectionsList.length > 0 ? (
                  collectionsList.map((col) => {
                    const isSelected = selectedCollections.includes(col.id);
                    return (
                      <button
                        key={col.id}
                        onClick={() => handleToggleCollection(col.id)}
                        className="w-full flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-muted/50 transition-colors group text-left"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-sm text-foreground truncate">{col.name}</span>
                          {!col.isPublic && <Lock size={12} className="text-muted-foreground flex-shrink-0" />}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2.5} />}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">Bạn chưa có bộ sưu tập nào</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
}

interface StatusButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  activeClass: string;
}

function StatusButton({ active, onClick, icon: Icon, label, activeClass }: StatusButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
                flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all duration-200
                ${active ? activeClass : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
            `}
    >
      <Icon size={14} className={active ? 'opacity-100' : 'opacity-70'} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
