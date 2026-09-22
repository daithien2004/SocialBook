import './globals.css';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import ScrollToTop from '@/components/shared/ScrollToTop';
import { Providers } from '../context/Providers';
import { Toaster } from 'sonner';
import { inter, merriweather, notoSans } from '@/features/books/components/Fonts';
import { FollowersModal } from '@/features/users/components/FollowersModal';
import GlobalConfirmModal from '@/components/shared/GlobalConfirmModal';
import { ThemeProvider } from '@/context/ThemeProvider';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

const CreatePostModal = dynamic(() => import('@/features/posts/components/CreatePostModal'));
const EditPostModal = dynamic(() => import('@/features/posts/components/EditPostModal'));
const SharePostModal = dynamic(() => import('@/features/posts/components/SharePostModal'));
const ModalPostComment = dynamic(() => import('@/features/posts/components/ModalPostComment'));
const AddToLibraryModal = dynamic(() => import('@/features/library/components/AddToLibraryModal'));
const ChapterSummaryModal = dynamic(() => import('@/features/chapters/components/ChapterSummaryModal'));
const DeleteBookModal = dynamic(() => import('@/features/admin/components/book/DeleteBookModal'));
const CreateCollectionModal = dynamic(() => import('@/features/library/components/CreateCollectionModal'));
const EditCollectionModal = dynamic(() => import('@/features/library/components/EditCollectionModal'));
const GenreModal = dynamic(() => import('@/features/admin/components/genre/GenreModal'));
const AuthorModal = dynamic(() => import('@/features/admin/components/author/AuthorModal'));
const ManageChapterModal = dynamic(() => import('@/features/admin/components/chapter/ManageChapterModal'));

export const metadata = {
  title: 'SocialBook',
  description: 'Mạng xã hội dành cho người yêu sách — khám phá, chia sẻ và kết nối cùng cộng đồng đọc sách trực tuyến.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable} ${merriweather.variable} ${notoSans.variable} mdl-js`} suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <Providers>
              <ScrollToTop />
              <ErrorBoundary name="RootLayout">
                {children}
              </ErrorBoundary>
              <CreatePostModal />
              <EditPostModal />
              <SharePostModal />
              <ModalPostComment />
              <AddToLibraryModal />
              <FollowersModal />
              <ChapterSummaryModal />
              <DeleteBookModal />
              <CreateCollectionModal />
              <EditCollectionModal />
              <GlobalConfirmModal />
              <GenreModal />
              <AuthorModal />
              <Suspense fallback={null}>
                <ManageChapterModal />
              </Suspense>
            </Providers>
          </Suspense>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
