"use client";

import { useEffect } from "react";
import PostCard from "@/src/components/post/PostCard";
import { useGetPostsMutation } from "@/src/features/posts/api/postApi";
import { Post } from "@/src/features/posts/types/post.interface";

const PostList = () => {
    const [getPosts, { data: posts, isLoading, error }] = useGetPostsMutation();

    useEffect(() => {
        (async () => {
            try {
                // ✅ unwrap() giúp lấy data thật (từ server)
                const result = await getPosts().unwrap();
                console.log("✅ Dữ liệu bài viết:", result);
            } catch (e) {
                console.error("❌ Fetch posts failed:", e);
            }
        })();
    }, [getPosts]);

    if (isLoading) return <p>Đang tải bài viết...</p>;
    if (error) return <p>Lỗi tải dữ liệu bài viết 😢</p>;

    return (
        <div className="space-y-4">
            {posts?.map((post: Post) => (
                <PostCard key={post.id} post={post} />
                ))}
        </div>
    );
};

export default PostList;
