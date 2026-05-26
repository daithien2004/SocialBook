'use client';

import {
  Archive,
  Bookmark,
  Check,
  Plus,
  X,
  Library,
  PlusCircle
} from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';

import { useAddToLibrary } from '@/features/library/hooks/useAddToLibrary';
import { LibraryStatus } from '@/features/library/types/library.interface';
import { useAppAuth } from '@/features/auth/hooks';
import { useModalStore } from '@/store/useModalStore';
import { useGetBookByIdQuery } from '@/features/books/api/bookApi';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';

export default function AddToLibraryModal() {
  const { isAddToLibraryOpen, closeAddToLibrary, addToLibraryData } = useModalStore();
  const bookId = addToLibraryData?.bookId || '';

  const { data: book } = useGetBookByIdQuery(bookId, { skip: !bookId || !isAddToLibraryOpen });

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
      <DialogContent className="sm:max-w-[400px] bg-card p-0 gap-0 border-border overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Lưu vào thư viện</DialogTitle>
        </DialogHeader>
        {/* Book Preview Header */}
        <div className="bg-muted/30 p-6 flex items-center gap-4 border-b border-border">
          <div className="relative w-14 h-20 flex-shrink-0 shadow-md rounded overflow-hidden">
            {book?.coverUrl ? (
              <Image src={book.coverUrl} alt={book.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Library className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground line-clamp-1">{book?.title || 'Đang tải...'}</h3>
            <p className="text-xs text-muted-foreground">Thêm vào thư viện cá nhân của bạn</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Selection */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Trạng thái đọc</h4>
            <div className="grid grid-cols-1 gap-2">
              <StatusButton
                active={selectedStatus === LibraryStatus.ARCHIVED}
                onClick={() => handleStatusChange(LibraryStatus.ARCHIVED)}
                icon={Archive}
                label="Lưu trữ"
                activeClass="bg-amber-500/10 text-amber-600 border-amber-500/20"
              />
            </div>
          </div>

          {/* Collections Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Bộ sưu tập</h4>
              {!isCreating && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Plus size={14} />
                  TẠO MỚI
                </button>
              )}
            </div>

            {isCreating && (
              <div className="flex gap-2 p-2 bg-muted/50 rounded-lg animate-in fade-in duration-300">
                <Input
                  autoFocus
                  placeholder="Tên bộ sưu tập..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                  className="h-8 border-none bg-transparent focus-visible:ring-0 text-sm"
                />
                <Button size="sm" onClick={handleCreateCollection} className="h-8 px-3">Tạo</Button>
                <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <ScrollArea className="max-h-[280px] min-h-[100px] -mx-1 px-1">
              <div className="space-y-1">
                {collectionsList.length > 0 ? (
                  collectionsList.map((col) => {
                    const isSelected = selectedCollections.includes(col.id);
                    return (
                      <button
                        key={col.id}
                        onClick={() => handleToggleCollection(col.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-lg transition-all text-left border",
                          isSelected 
                            ? "bg-primary/10 border-primary/20 text-primary shadow-sm" 
                            : "hover:bg-muted/50 border-transparent text-foreground/80"
                        )}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={cn(
                            "w-8 h-8 rounded-md flex items-center justify-center transition-colors flex-shrink-0",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            <Library size={14} />
                          </div>
                          <span className="text-sm font-medium truncate">{col.name}</span>
                        </div>
                        {isSelected && (
                          <div className="bg-primary rounded-full p-0.5 ml-2">
                            <Check className="w-3 h-3 text-white" strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-12 text-center opacity-40">
                    <PlusCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" strokeWidth={1} />
                    <p className="text-xs font-medium">Chưa có bộ sưu tập nào</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end bg-muted/20">
          <Button onClick={closeAddToLibrary} className="rounded-lg font-bold px-8">
            Xong
          </Button>
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
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all duration-200",
        active 
          ? activeClass 
          : "bg-background border-border text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
      )}
    >
      <Icon size={16} />
      <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
    </button>
  );
}
