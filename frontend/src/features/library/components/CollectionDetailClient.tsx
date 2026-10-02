'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  ChevronLeft,
  FolderOpen,
  Pencil,
  Trash2,
  Lock,
  Globe,
  Check,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { libraryQueries } from '@/features/library/api/library.queries';
import { useAddBookToCollections, useDeleteCollection, useUpdateCollection } from '@/features/library/api/library.mutations';
import { LibraryItem } from '@/features/library/types/library.interface';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { useModalStore } from '@/store/useModalStore';
import { LibraryBookCard } from '@/features/library/components/LibraryBookCard';
import { CollectionDetailSkeleton } from '@/features/library/components/CollectionDetailSkeleton';
import { useAppAuth } from '@/features/auth/hooks';
import LoginWall from '@/features/auth/components/LoginWall';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CollectionDetailClient({ collectionId }: { collectionId: string }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAppAuth();
  const openConfirm = useModalStore(s => s.openConfirm);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  const {
    data: collection,
    isLoading,
    error,
  } = useQuery({ ...libraryQueries.collectionDetail(collectionId) });

  const books = collection?.books || [];
  const isOwner = !!(collection && user && collection.userId === user.id);

  const deleteCollection = useDeleteCollection();
  const isDeleting = deleteCollection.isPending;
  const updateCollection = useUpdateCollection();
  const isUpdatingName = updateCollection.isPending;
  const updateBookCollections = useAddBookToCollections();

  const handleSaveName = async () => {
    if (!editNameValue.trim()) {
      toast.error('Tên bộ sưu tập không được để trống');
      return;
    }
    if (editNameValue.trim() === collection?.name) {
      setIsEditingName(false);
      return;
    }

    try {
      await updateCollection.mutateAsync({
        id: collectionId,
        data: {
          name: editNameValue.trim(),
          isPublic: collection?.isPublic,
          description: collection?.description,
        },
      });
      toast.success('Đã cập nhật tên bộ sưu tập');
      setIsEditingName(false);
    } catch {
      toast.error('Lỗi khi cập nhật tên');
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginWall
        title="Bộ sưu tập"
        description="Đăng nhập để xem và quản lý bộ sưu tập sách cá nhân của bạn."
        secondaryLabel="Khám phá sách trước"
        secondaryHref="/books"
      />
    );
  }

  const handleDeleteCollection = async () => {
    try {
      await deleteCollection.mutateAsync(collectionId);
      toast.success('Đã xóa bộ sưu tập');
      router.push('/library');
    } catch {
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
      await updateBookCollections.mutateAsync({
        bookId: book.bookId.id,
        collectionIds: newCollectionIds,
      });
      toast.success('Đã gỡ sách khỏi bộ sưu tập');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoading) return <CollectionDetailSkeleton />;

  if (error || !collection) {
    return (
      <div className="min-h-screen">
        <EmptyState
          icon={FolderOpen}
          title="Không tìm thấy bộ sưu tập"
          action={
            <Button onClick={() => router.push('/library')}>Quay lại thư viện</Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative transition-colors duration-300 pb-20">
      {/* HEADER SECTION */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8 pb-4">
        {/* Breadcrumb */}
        <Link
          href="/library"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand transition-colors mb-4 font-semibold"
        >
          <ChevronLeft size={14} />
          Quay lại Thư viện
        </Link>

        {/* Header Card */}
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-sm">
          {/* Top accent gradient line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end opacity-80" />

          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                {books.length} sách
              </span>
              {isOwner && (
                <button
                  onClick={() => openConfirm({
                    title: `Chuyển sang chế độ ${collection.isPublic ? 'riêng tư' : 'công khai'}`,
                    description: collection.isPublic
                      ? 'Chỉ bạn mới nhìn thấy bộ sưu tập này.'
                      : 'Bất kỳ ai cũng có thể xem bộ sưu tập này.',
                    confirmText: 'Xác nhận',
                    onConfirm: async () => {
                      await updateCollection.mutateAsync({
                        id: collectionId,
                        data: { name: collection.name, isPublic: !collection.isPublic },
                      });
                      toast.success('Đã cập nhật quyền riêng tư');
                    },
                  })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-wider hover:bg-brand/20 transition-colors cursor-pointer"
                >
                  {collection.isPublic ? (
                    <>
                      <Globe size={11} />
                      Công khai
                    </>
                  ) : (
                    <>
                      <Lock size={11} />
                      Chỉ mình tôi
                    </>
                  )}
                </button>
              )}
            </div>

            {isEditingName ? (
              <Input
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                disabled={isUpdatingName}
                autoFocus
                className="text-xl md:text-2xl font-bold text-foreground tracking-tight h-10 py-1 px-3 border-border focus-visible:ring-brand/50 bg-background w-full max-w-md rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') {
                    setIsEditingName(false);
                    setEditNameValue(collection?.name || '');
                  }
                }}
              />
            ) : (
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight break-words max-w-2xl">
                {collection.name}
              </h1>
            )}
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed break-words">
              {collection.description || 'Quản lý danh mục sách của bạn một cách khoa học và gọn gàng.'}
            </p>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center border-t md:border-t-0 border-border/50 pt-4 md:pt-0 w-full md:w-auto justify-end">
              {isEditingName ? (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveName}
                    disabled={isUpdatingName || !editNameValue.trim()}
                    className="h-9 px-4 rounded-xl font-semibold gap-1.5 bg-brand hover:bg-brand/90 text-brand-foreground cursor-pointer shadow-sm"
                  >
                    {isUpdatingName ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    Lưu
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingName(false);
                      setEditNameValue(collection?.name || '');
                    }}
                    disabled={isUpdatingName}
                    className="h-9 px-4 rounded-xl font-semibold gap-1.5 hover:bg-muted cursor-pointer"
                  >
                    Hủy
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditNameValue(collection.name);
                    setIsEditingName(true);
                  }}
                  className="h-9 px-4 rounded-xl font-semibold gap-1.5 hover:bg-muted cursor-pointer"
                >
                  <Pencil size={14} />
                  Đổi tên
                </Button>
              )}

              {!isEditingName && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openConfirm({
                    title: "Xóa bộ sưu tập",
                    description: `Hành động này không thể hoàn tác.`,
                    confirmText: "Xóa",
                    variant: "destructive",
                    onConfirm: handleDeleteCollection
                  })}
                  className="h-9 px-4 rounded-xl font-semibold gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 cursor-pointer"
                  disabled={isDeleting}
                >
                  <Trash2 size={14} />
                  Xóa
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-4 md:px-8 py-4 relative z-10 max-w-6xl">
        {books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {books.map((item) => (
              <LibraryBookCard
                key={item.id}
                item={item}
                dateLabel="Đã thêm"
                onRemove={isOwner ? handleRemoveBookFromCollection : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card/50 rounded-2xl border border-dashed border-border max-w-xl mx-auto mt-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 transition-colors">
              <BookOpen
                size={32}
                className="text-muted-foreground opacity-40"
              />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Bộ sưu tập này đang trống
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-8">
              {isOwner
                ? 'Hãy thêm sách vào bộ sưu tập này bằng cách chọn "Thêm vào danh sách" khi đọc sách.'
                : 'Bộ sưu tập này chưa có sách nào.'}
            </p>
            {isOwner && (
              <Link
                href="/library"
                className="px-8 py-2.5 bg-brand hover:bg-brand/90 text-brand-foreground rounded-full text-sm font-bold shadow-sm hover:shadow transition-colors"
              >
                Khám phá thư viện
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}


