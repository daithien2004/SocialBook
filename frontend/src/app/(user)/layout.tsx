import { Header } from '@/src/components/header';
import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';

export default async function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <>
      <Header session={session} />
      <main className="pt-16 min-h-screen">{children}</main>
    </>
  );
}
