import { PostModalClient } from '@/features/posts/components/PostModalClient';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <PostModalClient id={id} />;
}
