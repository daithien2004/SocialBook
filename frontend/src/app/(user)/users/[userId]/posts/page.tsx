'use client'
import PostList from "@/components/post/PostList";
import PostListUser from "@/components/post/PostListByUser";
import {useParams} from "next/navigation";

const UserPostsPage = () => {
    const { userId } = useParams<{ userId: string }>();
    return(
        <PostListUser userId={userId}/>
    )
}
export default UserPostsPage;
