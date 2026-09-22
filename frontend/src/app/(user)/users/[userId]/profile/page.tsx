import { UserProfileClient } from '@/features/users/components/UserProfileClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { redirect } from 'next/navigation';

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/login');
    }
    if (session.user.id !== userId) {
        redirect('/403');
    }

    return <UserProfileClient userId={userId} />;
}