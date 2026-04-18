'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import FollowerItem from "@/components/user/follower-item";
import { useGetFollowersListQuery, FollowingUser } from "@/features/follows/api/followApi";

import { useModalStore } from "@/store/useModalStore";

const EMPTY_FOLLOWERS: FollowingUser[] = [];

export function FollowersModal() {
    const { isFollowersOpen, closeFollowers, followersData } = useModalStore();
    const userId = followersData?.userId || "";

    const {
        data: followersList = EMPTY_FOLLOWERS,
        isLoading,
    } = useGetFollowersListQuery(userId, {
        skip: !userId || !isFollowersOpen,
    });
    
    return (
        <Dialog open={isFollowersOpen} onOpenChange={(open) => !open && closeFollowers()}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-[#1a1a1a] p-0 gap-0 overflow-hidden border-slate-100 dark:border-gray-800">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-gray-800">
                    <DialogTitle className="text-center text-lg font-semibold">
                        {followersData?.count ?? followersList.length} Người theo dõi
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[60vh] px-4 py-2">
                    <div className="space-y-4 py-2">
                        {followersList.length === 0 && !isLoading && (
                            <div className="text-center text-slate-500 py-10">
                                Chưa có người theo dõi nào
                            </div>
                        )}
                        {followersList.map((follower) => (
                            <FollowerItem key={follower.id} {...follower} />
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
