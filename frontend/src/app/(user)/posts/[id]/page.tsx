import { Suspense } from 'react';
import { PostModalClient } from '@/features/posts/components/PostModalClient';

async function PostPageContent({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <PostModalClient id={id} />;
}

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={null}>
            <PostPageContent params={params} />
        </Suspense>
    );
}
