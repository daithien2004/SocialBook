import ClientLayout from './ClientLayout';
import { ReactNode } from 'react';
import type { FollowStateResponse } from '@/features/follows/types/follow.interface';
import { followServerApi } from '@/features/follows/api/followServerApi';
import { getServerMe } from '@/lib/get-server-me';
import { userServerApi } from '@/features/users/api/usersServerApi';

export default async function UserLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const userApi = await userServerApi();
  const user = await userApi.getIsUserExist(userId);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Không tìm thấy người dùng
          </h1>
          <p className="text-muted-foreground">Người dùng không tồn tại.</p>
        </div>
      </div>
    );
  }

  const me = await getServerMe();

  let initialFollowState: FollowStateResponse | null = {
    isOwner: false,
    isFollowing: false,
  };

  if (me) {
    try {
      const followApi = await followServerApi();
      initialFollowState = await followApi.getFollowState(userId);
    } catch {
      // ignore SSR follow state error
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
