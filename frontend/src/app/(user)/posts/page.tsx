import { Suspense } from 'react';
import PostsClientSection from './_components/PostsClientSection';

export const metadata = {
  title: 'Bảng tin — SocialBook',
  description: 'Khám phá và chia sẻ các bài viết về sách cùng cộng đồng độc giả',
};

export default function PostsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PostsClientSection />
    </Suspense>
  );
}
