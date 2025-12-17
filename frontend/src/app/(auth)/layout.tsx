'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    localStorage.removeItem('theme');
    document.documentElement.removeAttribute('data-theme');
  }, [pathname]);
  return <main className="bg-white">{children}</main>;
}
