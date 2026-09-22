import FollowingClientPage from './_components/FollowingClientPage';

export default async function FollowingPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    return <FollowingClientPage userId={userId} />;
}
