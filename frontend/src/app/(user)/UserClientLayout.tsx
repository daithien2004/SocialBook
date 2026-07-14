'use client';

import { Header } from '@/components/header';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const ChatWidget = dynamic(
  () => import('@/components/chatbot/ChatWidget').then((module) => module.ChatWidget),
  { ssr: false }
);

export default function UserClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand selection:text-brand-foreground relative transition-colors duration-300">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/main-background.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-10 dark:opacity-40 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-white/60 dark:bg-[#0f0f0f]/70 transition-colors duration-300" />
      </div>

      <div className="relative z-10">
        <Header />
        <main className="pt-16 min-h-screen">{children}</main>

        <ChatWidget />
      </div>
    </div>
  );
}
