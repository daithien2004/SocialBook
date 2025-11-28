import ClientLayout from "./ClientLayout";
import { ReactNode } from "react";
import type { FollowStateResponse } from "@/src/features/follows/api/followApi";
import {followServerApi} from "@/src/features/follows/api/followServerApi";
import {getServerSession} from "next-auth";
import {authOptions} from "@/src/app/api/auth/[...nextauth]/route";
import {userServerApi} from "@/src/features/users/api/usersServerApi";



export default async function UserLayout({ children, params }: {
    children: ReactNode;
    params: Promise<{ userId: string }>;
}) {
    const { userId } = await params;

    const userApi = await userServerApi();
    const user = await userApi.getIsUserExist(userId);

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">
                        Không tìm thấy người dùng
                    </h1>
                    <p className="text-gray-600">
                        Người dùng không tồn tại.
                    </p>
                </div>
            </div>
        );
    }

    const session = await getServerSession(authOptions);

    let initialFollowState: FollowStateResponse | null = {
        isOwner: false,
        isFollowing: false
    };

    if (session?.user) {
        try {
            const followApi = await followServerApi();
            initialFollowState = await followApi.getFollowState(userId);
        } catch (error) {
            console.error("SSR follow state error:", error);
        }
    }

    return (
        <ClientLayout
            profileUserId={userId}
            initialFollowState={initialFollowState}
        >
            {children}
        </ClientLayout>
    );
}

