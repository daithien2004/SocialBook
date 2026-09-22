'use client';

import { useQuery } from "@tanstack/react-query";
import { followQueries } from "@/features/follows/api/follows.queries";
import FollowingItem from "@/features/users/components/following-item";

export default function FollowingClientPage({ userId }: { userId: string }) {
    const {
        data: following = [],
    } = useQuery({
        ...followQueries.following(userId),
        enabled: !!userId,
    });

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {following.map((followingUser) => (
                    <FollowingItem key={followingUser.id} {...followingUser} />
                ))}
            </div>
        </div>
    );
}
