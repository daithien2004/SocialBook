'use client';

import { useQuery } from "@tanstack/react-query";
import { followQueries } from "@/features/follows/api/follows.queries";
import FollowingItem from "@/features/users/components/following-item";
import { Skeleton } from "@/components/ui/skeleton";

export default function FollowingClientPage({ userId }: { userId: string }) {
    const {
        data: following = [],
        isLoading,
    } = useQuery({
        ...followQueries.following(userId),
        enabled: !!userId,
    });

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
                    ))
                ) : following.length > 0 ? (
                    following.map((followingUser) => (
                        <FollowingItem key={followingUser.id} {...followingUser} />
                    ))
                ) : (
                    <div className="col-span-full py-10 text-center text-muted-foreground">
                        Chưa theo dõi người dùng nào.
                    </div>
                )}
            </div>
        </div>
    );
}
