import { redirect } from 'next/navigation';
import HomePageClient from '@/features/home/components/HomePageClient';
import { getServerMe } from '@/lib/get-server-me';

export default async function HomePage() {
  const me = await getServerMe();

  if (me?.role === 'admin') {
    redirect('/admin');
  }

  return <HomePageClient />;
}
