import { Suspense } from 'react';
import BooksClientPage from './_components/BooksClientPage';

export const metadata = {
  title: 'Khám phá thư viện — SocialBook',
  description: 'Hàng ngàn tựa sách hấp dẫn đang chờ bạn khám phá trên SocialBook',
};

export default function BooksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <BooksClientPage />
    </Suspense>
  );
}
