import { UserProfileClient } from '@/features/users/components/UserProfileClient';

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    return <UserProfileClient userId={userId} />;
}
