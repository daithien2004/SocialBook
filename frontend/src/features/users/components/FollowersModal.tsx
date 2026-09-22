'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import FollowerItem from "@/features/users/components/follower-item";
import { useQuery } from "@tanstack/react-query";
import { followQueries } from "@/features/follows/api/follows.queries";
import { FollowingUser } from "@/features/follows/types/follow.interface";

import { useModalStore } from "@/store/useModalStore";

const EMPTY_FOLLOWERS: FollowingUser[] = [];

export function FollowersModal() {
    const { modals, closeFollowers } = useModalStore();
    const { isOpen: isFollowersOpen, data: followersData } = modals.followers;
    const userId = followersData?.userId || "";

    const {
        data: followersList = EMPTY_FOLLOWERS,
        isLoading,
    } = useQuery({
        ...followQueries.followers(userId),
        enabled: !!userId && isFollowersOpen,
    });
    
    return (
        <Dialog open={isFollowersOpen} onOpenChange={(open) => !open && closeFollowers()}>
            <DialogContent className="sm:max-w-md bg-card p-0 gap-0 overflow-hidden border-border">
                <DialogHeader className="px-6 py-4 border-b border-border">
                    <DialogTitle className="text-center text-lg font-semibold">
                        {followersData?.count ?? followersList.length} Người theo dõi
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[60vh] px-4 py-2">
                    <div className="space-y-4 py-2">
                        {followersList.length === 0 && !isLoading && (
                            <div className="text-center text-muted-foreground py-10">
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
