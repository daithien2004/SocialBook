import './globals.css';
import dynamic from 'next/dynamic';
import ScrollToTop from '@/components/common/ScrollToTop';
import { Providers } from '../context/Providers';
import { Toaster } from 'sonner';
import { inter, merriweather, notoSans } from '@/components/book/Fonts';
import { FollowersModal } from '@/components/user/FollowersModal';
import GlobalConfirmModal from '@/components/common/GlobalConfirmModal';
import { ThemeProvider } from '@/context/ThemeProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const CreatePostModal = dynamic(() => import('@/components/post/CreatePostModal'));
const EditPostModal = dynamic(() => import('@/components/post/EditPostModal'));
const SharePostModal = dynamic(() => import('@/components/post/SharePostModal'));
const ModalPostComment = dynamic(() => import('@/components/post/ModalPostComment'));
const AddToLibraryModal = dynamic(() => import('@/components/library/AddToLibraryModal'));
const ChapterSummaryModal = dynamic(() => import('@/components/chapter/ChapterSummaryModal'));
const DeleteBookModal = dynamic(() => import('@/components/admin/book/DeleteBookModal'));
const CreateCollectionModal = dynamic(() => import('@/components/library/CreateCollectionModal'));
const EditCollectionModal = dynamic(() => import('@/components/library/EditCollectionModal'));
const GenreModal = dynamic(() => import('@/components/admin/genre/GenreModal'));
const AuthorModal = dynamic(() => import('@/components/admin/author/AuthorModal'));
const ManageChapterModal = dynamic(() => import('@/components/admin/chapter/ManageChapterModal'));

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
            <ManageChapterModal />
          </Providers>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
