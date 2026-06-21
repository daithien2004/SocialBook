'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Archive,
  Bookmark,
  FolderPlus,
  Folder,
  ChevronRight,
  Lock,
  Globe,
  Pencil,
} from 'lucide-react';

import {
  useGetLibraryBooksQuery,
  useGetCollectionsQuery,
  useGetCollectionDetailQuery,
} from '@/features/library/api/libraryApi';
import { LibraryStatus, Collection } from '@/features/library/types/library.interface';
import { useAppAuth } from '@/features/auth/hooks';
import { useModalStore } from '@/store/useModalStore';
import LoginWall from '@/components/auth/LoginWall';
import { formatDate } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<LibraryStatus>(
    LibraryStatus.READING
  );
  const { user, isAuthenticated } = useAppAuth();
  const { openCreateCollection } = useModalStore();

  const {
    data: libraryData,
    isLoading: isLoadingLibrary,
    isFetching: isFetchingLibrary,
  } = useGetLibraryBooksQuery({ status: activeTab }, {
    skip: !isAuthenticated
  });

  const currentUserId = user?.id;
  const router = useRouter();

  const { data: collections, isLoading: isLoadingCollections, refetch: refetchCollections } =
    useGetCollectionsQuery(currentUserId, {
      skip: !currentUserId,
    });

  const books = libraryData || [];

  if (!isAuthenticated) {
    return (
      <LoginWall
        title="Thư viện cá nhân"
        description="Đăng nhập để quản lý sách đang đọc, lưu trữ bộ sưu tập và đồng bộ tiến độ đọc trên mọi thiết bị."
        secondaryLabel="Khám phá sách trước"
        secondaryHref="/books"
      />
    );
  }

  const tabs = [
    { id: LibraryStatus.READING, label: 'Đọc hiện tại', icon: Clock },
    { id: LibraryStatus.COMPLETED, label: 'Đã hoàn thành', icon: Bookmark },
    { id: LibraryStatus.ARCHIVED, label: 'Kho lưu trữ', icon: Archive },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative transition-colors duration-300 font-sans selection:bg-brand selection:text-brand-foreground">
      {/* HERO BANNER */}
      <div className="relative w-full h-[30vh] min-h-[260px] max-h-[350px] flex items-center justify-center overflow-hidden bg-slate-900 dark:bg-black">
        <Image
          src="/main-background.jpg"
          alt="Background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40 dark:opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-black/20 dark:bg-black/50" />
        <div className="relative z-10 text-center w-full max-w-3xl px-4 flex flex-col items-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
            Thư Viện Của Tôi
          </h1>
          <p className="text-white/90 mb-4 text-sm md:text-base font-medium max-w-xl drop-shadow-sm">
            Quản lý tủ sách cá nhân, tiến độ đọc và bộ sưu tập của bạn một cách tiện lợi nhất.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-4 md:px-8 py-8 lg:py-10 relative z-10 max-w-6xl">
        <div className="flex flex-col gap-8">
          {/* Bộ sưu tập Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Folder size={22} className="text-yellow-500" />
                Bộ sưu tập
              </h2>
            </div>

            {isLoadingCollections ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card
                    key={i}
                    className="h-32 border-border/80 animate-pulse bg-card"
                  >
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                      <div className="flex justify-between items-center border-t border-border/60 pt-3">
                        <Skeleton className="h-3 w-1/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pt-1.5">
                <button
                  onClick={() => openCreateCollection({ onSuccess: refetchCollections })}
                  className="group relative flex flex-col items-center justify-center h-36 rounded-2xl border-2 border-dashed border-border/80 hover:border-brand/50 hover:bg-brand/[0.015] dark:hover:bg-brand/[0.01] hover:shadow-md transition-all duration-500 bg-card cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-muted group-hover:bg-gradient-to-br group-hover:from-brand-gradient-start group-hover:to-brand-gradient-end flex items-center justify-center text-muted-foreground group-hover:text-brand-foreground transition-all duration-500 shadow-sm group-hover:shadow-lg">
                    <FolderPlus size={22} className="transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <span className="text-xs font-bold mt-4 text-muted-foreground group-hover:text-brand transition-colors">
                    Tạo bộ sưu tập mới
                  </span>
                </button>

                {collections?.map((col) => (
                  <CollectionCard key={col.id} col={col} />
                ))}
              </div>
            )}
          </section>

          {/* Book Lists with Tabs */}
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as LibraryStatus)} className="w-full">
            <TabsList variant="underline" className="mb-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    variant="underline"
                    className="gap-2"
                  >
                    <Icon size={16} />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="min-h-[300px]">
              {isLoadingLibrary ? (
                <LibrarySkeleton />
              ) : books?.length > 0 ? (
                <div className="relative">
                  {isFetchingLibrary && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Đang tải...
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {books?.map((item) => (
                      <Card
                        key={item.id}
                        className="group flex flex-col h-full overflow-hidden border-border/85 transition-all duration-500 hover:border-brand/40 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] bg-card text-foreground"
                      >
                        {/* Book Cover */}
                        <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                          <Image
                            src={item.bookId.coverUrl}
                            alt={item.bookId.title}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
                            className="object-cover transition-all duration-700 group-hover:scale-105 group-hover:opacity-95"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-85" />

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
                            {activeTab === LibraryStatus.READING && item.lastReadChapterId ? (
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
                                <span>Cập nhật</span>
                                <span>{new Date(item.updatedAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-card/50 rounded-2xl border border-dashed border-border">
                  <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                    <BookOpen
                      size={32}
                      className="text-muted-foreground"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Chưa có sách nào ở đây
                  </h3>
                  <p className="text-muted-foreground max-w-sm mb-6 text-sm">
                    {activeTab === LibraryStatus.READING
                      ? 'Bạn chưa đọc cuốn sách nào gần đây.'
                      : activeTab === LibraryStatus.COMPLETED
                      ? 'Bạn chưa đọc xong cuốn sách nào.'
                      : 'Bạn chưa lưu trữ cuốn sách nào.'}
                  </p>
                  <Link
                    href="/books"
                    className="px-6 py-2.5 bg-brand hover:bg-brand/90 text-brand-foreground rounded-full font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    Khám phá ngay <ChevronRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      {[...Array(10)].map((_, i) => (
        <Card key={i} className="flex flex-col h-full overflow-hidden border-border/80">
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
  );
}

function CollectionCard({ col }: { col: Collection }) {
  const router = useRouter();
  const { data: detail } = useGetCollectionDetailQuery(col.id);
  const books = detail?.books || [];
  const { openEditCollection } = useModalStore();
  
  // Lấy tối đa 3 bìa sách
  const covers = books.slice(0, 3).map((b) => b.bookId.coverUrl);

  return (
    <div
      onClick={() => router.push(`/collections/${col.id}`)}
      className="group relative flex flex-col justify-between h-36 bg-card rounded-2xl border border-border p-5 hover:border-brand/40 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Accent brand gradient line at the top */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end opacity-80 group-hover:opacity-100 transition-opacity z-10" />

      {/* Edit button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          openEditCollection({
            collectionId: col.id,
            currentName: col.name,
            currentIsPublic: col.isPublic,
          });
        }}
        className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm border border-border/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted cursor-pointer"
        title="Chỉnh sửa bộ sưu tập"
      >
        <Pencil size={12} className="text-muted-foreground" />
      </button>

      {/* Main card body layout */}
      <div className="flex gap-4 items-start justify-between h-full min-w-0 z-10">
        {/* Left: Info */}
        <div className="flex flex-col justify-between h-full min-w-0 flex-1">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground truncate group-hover:text-brand transition-colors">
              {col.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {col.description || 'Chưa có mô tả bộ sưu tập.'}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground font-medium mt-auto">
            <span className="flex items-center text-muted-foreground" title={col.isPublic ? "Công khai" : "Chỉ mình tôi"}>
              {col.isPublic ? (
                <Globe size={13.5} className="text-muted-foreground" />
              ) : (
                <Lock size={13.5} className="text-muted-foreground" />
              )}
            </span>
            <span>{formatDate(col.createdAt)}</span>
          </div>
        </div>

        {/* Right: Cover stack or Folder icon */}
        <div className="relative w-20 h-24 flex items-center justify-center shrink-0 self-center">
          {covers.length > 0 ? (
            <div className="relative w-full h-full flex items-center justify-end">
              {/* Back cover (3rd book) */}
              {covers[2] && (
                <div className="absolute w-[40px] h-[56px] right-7 top-4 -rotate-12 z-0 opacity-40 shadow-sm rounded-sm overflow-hidden border border-white/10 dark:border-black/20">
                  <Image
                    src={covers[2]}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
              )}
              {/* Middle cover (2nd book) */}
              {covers[1] && (
                <div className="absolute w-[44px] h-[62px] right-3.5 top-2 -rotate-6 z-10 opacity-75 shadow-md rounded-sm overflow-hidden border border-white/10 dark:border-black/20">
                  <Image
                    src={covers[1]}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
              )}
              {/* Front cover (1st book) */}
              {covers[0] && (
                <div className="absolute w-[48px] h-[68px] right-0 top-1.5 rotate-3 z-20 shadow-lg rounded-sm overflow-hidden border border-white/20 dark:border-black/40 group-hover:scale-105 group-hover:rotate-0 transition-all duration-300">
                  <Image
                    src={covers[0]}
                    alt=""
                    fill
                    priority
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Folder icon if collection is empty */
            <div className="p-3 bg-yellow-500/10 dark:bg-yellow-500/5 text-yellow-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Folder className="w-6 h-6" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
