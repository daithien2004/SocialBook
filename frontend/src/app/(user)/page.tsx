import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { redirect } from 'next/navigation';
import HomePageClient from '@/features/home/components/HomePageClient';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === 'admin') {
    redirect('/admin');
  }

  return <HomePageClient />;
}
