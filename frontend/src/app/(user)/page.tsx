import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import HomePageClient from '@/src/components/HomePageClient';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === 'admin') {
    redirect('/admin');
  }

  return <HomePageClient />;
}
