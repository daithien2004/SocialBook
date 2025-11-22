import { Header } from '@/src/components/Header';
import { ReactNode } from 'react';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen">{children}</main>
    </>
  );
}
