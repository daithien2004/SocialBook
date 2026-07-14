'use client';

import { useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  FolderOpen,
  Pencil,
  Trash2,
  X,
  Lock,
  Globe,
  Check,
  Loader2,
} from 'lucide-react';
import { SafeImage } from '@/components/common/SafeImage';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import {
  useAddBookToCollectionsMutation,
  useDeleteCollectionMutation,
  useGetCollectionDetailQuery,
  useUpdateCollectionMutation,
} from '@/features/library/api/libraryApi';
import { LibraryItem } from '@/features/library/types/library.interface';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { useModalStore } from '@/store/useModalStore';
import { useAppAuth } from '@/features/auth/hooks';
import LoginWall from '@/components/auth/LoginWall';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

export default function CollectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const collectionId = params.id as string;
  const { isAuthenticated, user } = useAppAuth();
  const { openConfirm } = useModalStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  const {
    data: collection,
    isLoading,
    error,
  } = useGetCollectionDetailQuery(collectionId);

  const books = collection?.books || [];
  const isOwner = !!(collection && user && collection.userId === user.id);

  const [deleteCollection, { isLoading: isDeleting }] =
    useDeleteCollectionMutation();
  const [updateCollection, { isLoading: isUpdatingName }] =
    useUpdateCollectionMutation();
  const [updateBookCollections] = useAddBookToCollectionsMutation();

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
      await updateCollection({
        id: collectionId,
        data: {
          name: editNameValue.trim(),
          isPublic: collection?.isPublic,
          description: collection?.description,
        },
      }).unwrap();
      toast.success('Đã cập nhật tên bộ sưu tập');
      setIsEditingName(false);
    } catch (err) {
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
                      await updateCollection({
                        id: collectionId,
                        data: { name: collection.name, isPublic: !collection.isPublic },
                      }).unwrap();
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
              <Card
                key={item.id}
                className="group flex flex-col h-full overflow-hidden border-border/85 transition-all duration-500 hover:border-brand/40 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] bg-card text-foreground"
              >
                {/* Book Cover */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                  <SafeImage
                    src={item.bookId.coverUrl}
                    alt={item.bookId.title}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover transition-all duration-700 group-hover:scale-105 group-hover:opacity-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-85" />

                  {isOwner && (
                    <button
                      onClick={(e) => handleRemoveBookFromCollection(e, item)}
                      title="Gỡ khỏi bộ sưu tập này"
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-brand border border-white/10 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 duration-200 z-20 cursor-pointer shadow-md"
                    >
                      <X size={13} />
                    </button>
                  )}

                  {/* Hover Action Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[1px]">
                    <Link
                      href={`/books/${item.bookId.slug}`}
                      className="px-4 py-2 bg-background text-foreground font-semibold text-xs rounded-full hover:bg-brand hover:text-brand-foreground shadow-md transition-all duration-300 scale-90 group-hover:scale-100"
                    >
                      Chi tiết truyện
                    </Link>
                  </div>
                </div>

                {/* Book Details */}
                <CardContent className="flex flex-col flex-1 p-4 pt-3 gap-1">
                  <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground truncate">
                    {item.bookId.authorName || 'Tác giả'}
                  </p>
                  <Link href={`/books/${item.bookId.slug}`}>
                    <h3 className="font-semibold text-sm line-clamp-2 hover:text-brand transition-colors mb-2 min-h-[40px] leading-tight text-foreground">
                      {item.bookId.title}
                    </h3>
                  </Link>

                  {/* Reading Progress */}
                  <div className="mt-auto border-t border-border pt-3 w-full">
                    {item.status === 'READING' && item.lastReadChapterId ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Đang đọc</span>
                          <span className="font-semibold text-foreground">
                            Chương {item.lastReadChapterId.orderIndex}
                          </span>
                        </div>
                        <Link
                          href={`/books/${item.bookId.slug}/chapters/${item.lastReadChapterId.slug}`}
                          className="w-full flex items-center justify-center gap-1.5 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 text-xs font-bold py-2 rounded-full transition-all duration-300"
                        >
                          <BookOpen size={13} />
                          Đọc tiếp
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                        <span>Đã thêm</span>
                        <span>{formatDate(item.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
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

function CollectionDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8">
        <div className="h-4 w-28 bg-muted rounded animate-pulse mb-6" />
        <div className="h-32 bg-card border border-border rounded-2xl animate-pulse" />
      </div>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={`skeleton-collection-detail-${i}`} className="flex flex-col h-full overflow-hidden border-border/80">
              <Skeleton className="aspect-[2/3] w-full rounded-none" />
              <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="space-y-2 pt-2 border-t border-border mt-auto">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-full rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
