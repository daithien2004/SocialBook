'use client'
import PostList from "@/src/components/post/PostList";
import PostListUser from "@/src/components/post/PostListByUser";
import {useParams} from "next/navigation";

const UserPostsPage = () => {
    const { userId } = useParams<{ userId: string }>();
    return(
        <PostListUser userId={userId}/>
    )
}
export default UserPostsPage;
