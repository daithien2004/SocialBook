"use client"
import {useGetFollowingListQuery} from "@/src/features/follows/api/followApi";
import {useParams} from "next/navigation";
import FollowingItem from "@/src/components/user/following-item";

const FollowingPage = () => {
    const { userId } = useParams<{ userId: string }>();
    const {
        data: following = [],
    } = useGetFollowingListQuery(userId, {
        skip: !userId,
    });
    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {following.map((followingUser) => (
                    <FollowingItem key={followingUser.id} {...followingUser}/>
                ))}
            </div>
        </div>
    );
}
export default  FollowingPage
