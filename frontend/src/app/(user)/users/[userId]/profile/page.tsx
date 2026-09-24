import { UserProfileClient } from '@/features/users/components/UserProfileClient';
import { redirect } from 'next/navigation';
import { getServerMe } from '@/lib/get-server-me';

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const me = await getServerMe();

    if (!me) {
        redirect('/login');
    }
    if (me.id !== userId) {
        redirect('/403');
    }

    return <UserProfileClient userId={userId} />;
}