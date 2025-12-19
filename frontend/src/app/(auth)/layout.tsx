'use client';

import { ReactNode } from 'react';
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <main className="bg-white">{children}</main>;
}
