'use client';

import { ReactNode } from 'react';
import { ThemeToggle } from '@/components/common';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="bg-background text-foreground min-h-screen relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {children}
    </main>
  );
}
