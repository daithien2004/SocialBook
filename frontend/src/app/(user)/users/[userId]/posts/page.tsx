import PostListUser from "@/features/posts/components/PostListByUser";

export default async function UserPostsPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    return <PostListUser userId={userId} />;
}
