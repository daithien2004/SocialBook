'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Archive,
  Bookmark,
  FolderPlus,
  Folder,
  ChevronRight,
} from 'lucide-react';

import { libraryQueries } from '@/features/library/api/library.queries';
import { LibraryStatus } from '@/features/library/types/library.interface';
import { useAppAuth } from '@/features/auth/hooks';
import { useModalStore } from '@/store/useModalStore';
import { LibraryBookCard } from '@/features/library/components/LibraryBookCard';
import { CollectionCard } from '@/features/library/components/CollectionCard';
import { LibrarySkeleton } from '@/features/library/components/LibrarySkeleton';
import LoginWall from '@/features/auth/components/LoginWall';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FullScreenSpinner } from '@/components/shared/AppLoading';

export default function LibraryClientSection() {
  const [activeTab, setActiveTab] = useState<LibraryStatus>(
    LibraryStatus.READING
  );
  const { user, isAuthenticated, isLoading } = useAppAuth();
  const openCreateCollection = useModalStore(s => s.openCreateCollection);

  const {
    data: libraryData,
    isLoading: isLoadingLibrary,
    isFetching: isFetchingLibrary,
  } = useQuery({
    ...libraryQueries.books({ status: activeTab }),
    enabled: isAuthenticated,
  });

  const currentUserId = user?.id;

  const { data: collections, isLoading: isLoadingCollections, refetch: refetchCollections } =
    useQuery({
      ...libraryQueries.collections(currentUserId),
      enabled: !!currentUserId,
    });

  const books = libraryData || [];

  if (isLoading) {
    return <FullScreenSpinner />;
  }

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
                  key={`skeleton-collection-${i}`}
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
                    <LibraryBookCard
                      key={item.id}
                      item={item}
                      activeTab={activeTab}
                    />
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
  );
}


